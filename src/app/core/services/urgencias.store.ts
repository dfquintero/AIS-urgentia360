import { Injectable, computed, inject, signal } from '@angular/core';
import { ETAPA_POR_ID, GRUPOS_EDAD, METAS_TRIAGE_INICIALES, ROL_EVENTO, TIPOS_DEMANDA, UMBRALES_INICIALES } from '../data/catalogos';
import { elegir, faseEvento } from '../data/dataset';
import { coincideCodigo, crearEpisodioNuevo, numeroEpisodio, registrarEscaneo, registroActual } from '../domain/flujo';
import { alertaEpisodio, estadoOrden, tiempoEnEtapa, vistaEnTiempo } from '../domain/indicadores';
import {
  EstadoOrden,
  Episodio,
  EtapaId,
  EventoEpisodio,
  FilaTablero,
  MetasTriage,
  NivelTriageId,
  OrdenDiagnostica,
  ResultadoEscaneo,
  SolicitudEscaneo,
  Umbral,
  Umbrales,
} from '../models/urgencias.models';
import { DatasetService } from './dataset.service';
import { RelojService } from './reloj.service';

export interface OrdenVisible extends OrdenDiagnostica {
  estado: EstadoOrden;
}

/**
 * Estado en memoria de la sala: reproducción de la base sintética + registros manuales por QR.
 * Un episodio registrado manualmente deja de seguir la reproducción desde ese instante.
 */
@Injectable({ providedIn: 'root' })
export class UrgenciasStore {
  private readonly dataset = inject(DatasetService).dataset;
  private readonly reloj = inject(RelojService);
  readonly ahora = this.reloj.ahora;
  readonly fuente = this.dataset.fuente;
  readonly esRespaldo = this.dataset.esRespaldo;
  readonly capacidad = this.dataset.capacidad;
  readonly corte = this.dataset.corte;

  private siguienteNumero = Math.max(0, ...this.dataset.episodios.map((e) => numeroEpisodio(e.id))) + 1;
  private readonly manuales = signal<ReadonlyMap<string, Episodio>>(new Map());
  private readonly cortesManuales = signal<ReadonlyMap<string, number>>(new Map());
  private readonly eventosManuales = signal<EventoEpisodio[]>([]);

  readonly umbrales = signal<Umbrales>(structuredClone(UMBRALES_INICIALES) as Umbrales);
  readonly metasTriage = signal<MetasTriage>({ ...METAS_TRIAGE_INICIALES });

  /** Episodios que ya generaron turno en el instante actual. */
  readonly episodios = computed<Episodio[]>(() => {
    const t = this.ahora();
    const manuales = this.manuales();
    const lista: Episodio[] = [];
    for (const e of this.dataset.episodios) {
      if (manuales.has(e.id)) continue;
      const vista = vistaEnTiempo(e, t);
      if (vista) lista.push(vista);
    }
    return [...lista, ...manuales.values()];
  });

  readonly activos = computed(() => this.episodios().filter((e) => e.egreso == null));
  readonly egresados = computed(() => this.episodios().filter((e) => e.egreso != null));

  readonly ordenes = computed<OrdenVisible[]>(() => {
    const t = this.ahora();
    const cortes = this.cortesManuales();
    return this.dataset.ordenes.flatMap((o) => {
      const estado = estadoOrden(o, Math.min(t, cortes.get(o.episodioId) ?? t));
      return estado ? [{ ...o, estado }] : [];
    });
  });

  readonly ordenesPendientes = computed(() => this.ordenes().filter((o) => o.estado !== 'Revisada'));

  private readonly pendientesPorEpisodio = computed(() => {
    const mapa = new Map<string, number>();
    for (const o of this.ordenesPendientes()) mapa.set(o.episodioId, (mapa.get(o.episodioId) ?? 0) + 1);
    return mapa;
  });

  readonly filas = computed<FilaTablero[]>(() => {
    const t = this.ahora();
    const umbrales = this.umbrales();
    const metas = this.metasTriage();
    const pendientes = this.pendientesPorEpisodio();
    return this.activos().map((episodio) => {
      const registro = registroActual(episodio);
      return {
        episodio,
        registro,
        etapa: ETAPA_POR_ID[registro.etapa],
        enAtencion: registro.entrada != null,
        tiempoMs: tiempoEnEtapa(episodio, t),
        alerta: alertaEpisodio(episodio, t, umbrales, metas),
        ordenesPendientes: pendientes.get(episodio.id) ?? 0,
      };
    });
  });

  /** Últimos eventos registrados hasta el instante actual (reproducción + manuales). */
  readonly eventosRecientes = computed<EventoEpisodio[]>(() => {
    const t = this.ahora();
    const cortes = this.cortesManuales();
    const eventos = this.dataset.eventos;
    const recientes: EventoEpisodio[] = [];
    for (let i = this.ultimoIndiceHasta(t); i >= 0 && recientes.length < 40; i--) {
      const ev = eventos[i];
      const corte = cortes.get(ev.episodioId);
      if (corte == null || ev.ts <= corte) recientes.push(ev);
    }
    const manuales = this.eventosManuales().filter((e) => e.ts <= t);
    return [...manuales, ...recientes].sort((a, b) => b.ts - a.ts).slice(0, 40);
  });

  buscarActivo(codigo: string): Episodio | undefined {
    return this.activos().find((e) => coincideCodigo(e, codigo));
  }

  buscar(codigo: string): Episodio | undefined {
    return this.episodios().find((e) => coincideCodigo(e, codigo));
  }

  eventosDe(id: string): EventoEpisodio[] {
    const t = this.ahora();
    const corte = this.cortesManuales().get(id) ?? t;
    const limite = Math.min(t, corte);
    return [
      ...this.dataset.eventos.filter((e) => e.episodioId === id && e.ts <= limite),
      ...this.eventosManuales().filter((e) => e.episodioId === id && e.ts <= t),
    ].sort((a, b) => a.ts - b.ts);
  }

  ordenesDe(id: string): OrdenVisible[] {
    return this.ordenes().filter((o) => o.episodioId === id);
  }

  generarTurno(): Episodio {
    const episodio = crearEpisodioNuevo(this.siguienteNumero++, this.ahora(), elegir(TIPOS_DEMANDA), elegir(GRUPOS_EDAD));
    this.manuales.update((m) => new Map(m).set(episodio.id, episodio));
    this.registrarEvento(episodio.id, 'punto0', 'Turno generado', 'Punto cero del episodio (Digiturno)');
    return episodio;
  }

  escanear(solicitud: SolicitudEscaneo): ResultadoEscaneo {
    const episodio = this.buscarActivo(solicitud.codigo);
    if (!episodio) {
      const egresado = this.buscar(solicitud.codigo);
      return { ok: false, error: egresado ? 'Ese episodio ya egresó de urgencias.' : 'Código no encontrado entre los episodios activos.' };
    }
    const t = this.ahora();
    const resultado = registrarEscaneo(episodio, { ...solicitud, ahora: t });
    if (!resultado.ok) return resultado;

    this.manuales.update((m) => new Map(m).set(episodio.id, resultado.episodio));
    if (!this.cortesManuales().has(episodio.id)) this.cortesManuales.update((c) => new Map(c).set(episodio.id, t));
    this.registrarEvento(episodio.id, resultado.etapaEvento, resultado.texto, solicitud.responsable ?? 'Registro QR');
    return resultado;
  }

  actualizarUmbral(etapa: EtapaId, umbral: Umbral): void {
    const amarillo = Math.max(1, Math.round(umbral.amarillo));
    const rojo = Math.max(amarillo + 1, Math.round(umbral.rojo));
    this.umbrales.update((u) => ({ ...u, [etapa]: { amarillo, rojo } }));
  }

  actualizarMetaTriage(nivel: NivelTriageId, minutos: number | null): void {
    this.metasTriage.update((m) => ({ ...m, [nivel]: minutos == null ? null : Math.max(1, Math.round(minutos)) }));
  }

  restablecerUmbrales(): void {
    this.umbrales.set(structuredClone(UMBRALES_INICIALES) as Umbrales);
    this.metasTriage.set({ ...METAS_TRIAGE_INICIALES });
  }

  /** Descarta los registros manuales y vuelve a la reproducción pura de la base sintética. */
  reiniciarRegistros(): void {
    this.manuales.set(new Map());
    this.cortesManuales.set(new Map());
    this.eventosManuales.set([]);
  }

  private registrarEvento(episodioId: string, etapa: EtapaId, tipo: string, nota: string): void {
    const def = ETAPA_POR_ID[etapa];
    const evento: EventoEpisodio = {
      id: `EV-M-${this.eventosManuales().length + 1}`,
      episodioId,
      ts: this.ahora(),
      fase: faseEvento(etapa),
      tipo,
      sistema: `${def.sistema} (referencial)`,
      rol: ROL_EVENTO[def.rol],
      nota,
      origen: 'Registro manual (QR)',
    };
    this.eventosManuales.update((lista) => [...lista, evento]);
  }

  private ultimoIndiceHasta(t: number): number {
    const eventos = this.dataset.eventos;
    let bajo = 0;
    let alto = eventos.length - 1;
    let res = -1;
    while (bajo <= alto) {
      const medio = (bajo + alto) >> 1;
      if (eventos[medio].ts <= t) {
        res = medio;
        bajo = medio + 1;
      } else alto = medio - 1;
    }
    return res;
  }
}
