import { Injectable, computed, inject, signal } from '@angular/core';
import { ETAPA_POR_ID, UMBRALES_INICIALES } from '../data/catalogos';
import { crearDatosIniciales, crearPaciente } from '../data/datos-simulados';
import { registrarEscaneo, registroActual } from '../domain/flujo';
import { nivelAlerta, tiempoEnEtapa } from '../domain/indicadores';
import {
  EtapaId,
  EventoBitacora,
  FilaTablero,
  Paciente,
  ResultadoEscaneo,
  SolicitudEscaneo,
  TipoEvento,
  Umbral,
  Umbrales,
} from '../models/urgencias.models';
import { RelojService } from './reloj.service';

const normalizar = (codigo: string) => codigo.trim().toUpperCase();

/** Estado en memoria de la sala de urgencias (sin backend). */
@Injectable({ providedIn: 'root' })
export class UrgenciasStore {
  private readonly reloj = inject(RelojService);
  readonly ahora = this.reloj.ahora;

  private readonly inicial = crearDatosIniciales(this.reloj.ahora());
  private siguienteNumero = this.inicial.siguienteNumero;
  private siguienteEvento = 1;

  readonly activos = signal<Paciente[]>(this.inicial.activos);
  readonly egresados = signal<Paciente[]>(this.inicial.egresados);
  readonly umbrales = signal<Umbrales>(structuredClone(UMBRALES_INICIALES) as Umbrales);
  readonly bitacora = signal<EventoBitacora[]>([]);

  readonly filas = computed<FilaTablero[]>(() => {
    const ahora = this.ahora();
    const umbrales = this.umbrales();
    return this.activos().map((paciente) => {
      const registro = registroActual(paciente);
      return {
        paciente,
        registro,
        etapa: ETAPA_POR_ID[registro.etapa],
        enAtencion: !!registro.entrada,
        tiempoMs: tiempoEnEtapa(paciente, ahora),
        alerta: nivelAlerta(paciente, ahora, umbrales),
      };
    });
  });

  buscar(codigo: string): Paciente | undefined {
    const c = normalizar(codigo);
    if (!c) return undefined;
    return this.activos().find((p) => p.qr === c || p.turno === c);
  }

  generarTurno(): Paciente {
    const paciente = crearPaciente(this.siguienteNumero++, this.ahora());
    this.activos.update((lista) => [...lista, paciente]);
    this.registrar(paciente.turno, 'turno', `Turno generado en Punto 0 (digiturno) · ${paciente.servicio}`);
    return paciente;
  }

  escanear(solicitud: SolicitudEscaneo): ResultadoEscaneo {
    const paciente = this.buscar(solicitud.codigo);
    if (!paciente) {
      const c = normalizar(solicitud.codigo);
      const egresado = this.egresados().some((p) => p.qr === c || p.turno === c);
      return {
        ok: false,
        error: egresado ? 'Ese paciente ya egresó de urgencias.' : 'Código no encontrado entre los pacientes activos.',
      };
    }

    const resultado = registrarEscaneo(paciente, { ...solicitud, ahora: this.ahora() });
    if (!resultado.ok) return resultado;

    if (resultado.egresado) {
      this.activos.update((lista) => lista.filter((p) => p.id !== paciente.id));
      this.egresados.update((lista) => [resultado.paciente, ...lista]);
    } else {
      this.activos.update((lista) => lista.map((p) => (p.id === paciente.id ? resultado.paciente : p)));
    }
    this.registrar(paciente.turno, resultado.evento.tipo, resultado.evento.texto);
    return resultado;
  }

  actualizarUmbral(etapa: EtapaId, umbral: Umbral): void {
    const amarillo = Math.max(1, Math.round(umbral.amarillo));
    const rojo = Math.max(amarillo + 1, Math.round(umbral.rojo));
    this.umbrales.update((u) => ({ ...u, [etapa]: { amarillo, rojo } }));
  }

  restablecerUmbrales(): void {
    this.umbrales.set(structuredClone(UMBRALES_INICIALES) as Umbrales);
  }

  private registrar(turno: string, tipo: TipoEvento, texto: string): void {
    const evento: EventoBitacora = { id: this.siguienteEvento++, ts: this.ahora(), turno, tipo, texto };
    this.bitacora.update((lista) => [evento, ...lista].slice(0, 50));
  }
}
