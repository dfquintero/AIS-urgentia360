import { Injectable, computed, inject, signal } from '@angular/core';
import { GRUPOS_EDAD, NIVELES_TRIAGE, TIPOS_DEMANDA } from '../data/catalogos';
import { DEFINICIONES_ANS, DefinicionAns, evaluarAns } from '../domain/ans';
import { cargaVsEspera, cortePorGrupo, desgloseOrdenes, mapaCalorHoras, rankingEtapas, resumenCuello } from '../domain/cuellos';
import { bloqueDe, cuelloDeBotella, esperaPostTriage, promedio, promediosPorEtapa, tiemposClave } from '../domain/indicadores';
import { Episodio, NivelTriageId } from '../models/urgencias.models';
import { UrgenciasStore } from './urgencias.store';

export type Ventana = 'periodo' | '72h' | '24h';
export type Franja = 'todas' | 'Pico simulado' | 'Valle simulado';

const MIN = 60_000;
const HORA = 60 * MIN;
const VENTANAS: Record<Ventana, number> = { periodo: Infinity, '72h': 72 * HORA, '24h': 24 * HORA };
const NIVEL_ANS: Record<string, NivelTriageId> = { 'T-I': 'I', 'T-II': 'II', 'T-III': 'III', 'T-IV': 'IV', 'T-V': 'V' };

/** Filtros compartidos por las pestañas de análisis y los agregados que todas consultan. */
@Injectable({ providedIn: 'root' })
export class AnalisisService {
  private readonly store = inject(UrgenciasStore);

  readonly ventana = signal<Ventana>('periodo');
  readonly triage = signal<NivelTriageId | 'todas'>('todas');
  readonly franja = signal<Franja>('todas');

  /** Recalcula como máximo una vez por minuto simulado: los agregados no cambian segundo a segundo. */
  readonly ahora = computed(() => Math.floor(this.store.ahora() / MIN) * MIN);

  private readonly cumpleFiltros = computed(() => {
    const desde = this.ahora() - VENTANAS[this.ventana()];
    const triage = this.triage();
    const franja = this.franja();
    return (e: Episodio) =>
      e.historial[0].llegada >= desde &&
      (triage === 'todas' || e.triage === triage) &&
      (franja === 'todas' || bloqueDe(e.historial[0].llegada, this.store.capacidad)?.franja === franja);
  });

  readonly episodios = computed(() => this.store.episodios().filter(this.cumpleFiltros()));
  readonly filas = computed(() => this.store.filas().filter((f) => this.cumpleFiltros()(f.episodio)));
  private readonly activos = computed(() => this.filas().map((f) => f.episodio));

  readonly ranking = computed(() => rankingEtapas(this.episodios(), this.activos(), this.ahora()));
  readonly horas = computed(() => mapaCalorHoras(this.episodios(), this.ahora()));
  readonly porTriage = computed(() => cortePorGrupo(this.episodios(), this.ahora(), (e) => e.triage, NIVELES_TRIAGE));
  readonly porDemanda = computed(() => cortePorGrupo(this.episodios(), this.ahora(), (e) => e.demanda, TIPOS_DEMANDA));
  readonly porEdad = computed(() => cortePorGrupo(this.episodios(), this.ahora(), (e) => e.grupoEdad, GRUPOS_EDAD));
  readonly resumen = computed(() => resumenCuello(this.ranking(), this.horas(), this.porTriage()));
  readonly carga = computed(() => cargaVsEspera(this.episodios(), this.store.capacidad, this.ahora()).slice(-18));

  private readonly ordenesFiltradas = computed(() => {
    const ids = new Set(this.episodios().map((e) => e.id));
    return this.store.ordenes().filter((o) => ids.has(o.episodioId));
  });
  readonly ordenes = computed(() => desgloseOrdenes(this.ordenesFiltradas(), this.ahora()));
  readonly resumenOrdenes = computed(() => {
    const propias = this.ordenesFiltradas();
    const conResultado = propias.filter((o) => o.disponible != null && o.estado !== 'Solicitada' && o.estado !== 'En proceso');
    return {
      pendientes: propias.filter((o) => o.estado !== 'Revisada').length,
      solicitudAResultado: promedio(conResultado.map((o) => (o.disponible! - o.solicitud) / MIN)),
    };
  });

  readonly promedios = computed(() => promediosPorEtapa(this.episodios(), this.ahora()));
  readonly cuello = computed(() => cuelloDeBotella(this.promedios()));

  readonly alertas = computed(() => ({
    rojo: this.filas().filter((f) => f.alerta.nivel === 'rojo').length,
    amarillo: this.filas().filter((f) => f.alerta.nivel === 'amarillo').length,
  }));

  readonly tiempos = computed(() => {
    const t = this.episodios().map(tiemposClave);
    return {
      turnoATriage: promedio(t.map((x) => x.turnoATriage)),
      finTriageAMedico: promedio(t.map((x) => x.finTriageAMedico)),
      estancia: promedio(t.map((x) => x.estanciaTotal)),
    };
  });

  /** Comparación ilustrativa con la referencia normativa de Triage II (no evalúa cumplimiento real). */
  readonly triageII = computed(() => {
    const casos = this.episodios().filter((e) => e.triage === 'II');
    const fuera = casos.filter((e) => (esperaPostTriage(e, this.ahora()) ?? 0) > 30).length;
    return { total: casos.length, fuera };
  });

  readonly demanda = computed(() => {
    const conteo = new Map<string, number>();
    for (const e of this.episodios()) conteo.set(e.demanda, (conteo.get(e.demanda) ?? 0) + 1);
    return [...conteo].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  });

  metaAns(d: DefinicionAns): number | null {
    const nivel = NIVEL_ANS[d.id];
    return nivel ? this.store.metasTriage()[nivel] : this.store.metasAns()[d.id];
  }

  actualizarMetaAns(d: DefinicionAns, minutos: number | null): void {
    const nivel = NIVEL_ANS[d.id];
    if (nivel) this.store.actualizarMetaTriage(nivel, minutos);
    else this.store.actualizarMetaAns(d.id, minutos);
  }

  /** Cumplimiento de ANS sobre todo el periodo transcurrido (no aplica los filtros de análisis). */
  readonly ans = computed(() => {
    const objetivo = this.store.objetivoAns();
    const episodios = this.ahora() >= 0 ? this.store.episodios() : [];
    return DEFINICIONES_ANS.map((d) => {
      const meta = this.metaAns(d);
      const r = evaluarAns(d, meta, episodios);
      const estado =
        d.tipo === 'Contractual' ? 'No disponible'
        : meta == null ? 'Meta por definir'
        : r.cumplimiento == null ? 'Sin datos'
        : r.cumplimiento >= objetivo ? 'Cumple'
        : 'No cumple';
      return { d, meta, ...r, estado };
    });
  });
}
