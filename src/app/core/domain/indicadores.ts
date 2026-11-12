import { ETAPAS } from '../data/catalogos';
import {
  Alerta,
  BloqueCapacidad,
  Episodio,
  EstadoOrden,
  MetasTriage,
  NivelAlerta,
  OrdenDiagnostica,
  PromedioEtapa,
  RegistroEtapa,
  Umbrales,
} from '../models/urgencias.models';
import { registroActual } from './flujo';

const MIN = 60_000;
const PESO: Record<NivelAlerta, number> = { ok: 0, amarillo: 1, rojo: 2 };

export const tiempoEnEtapa = (e: Episodio, ahora: number): number => Math.max(0, ahora - registroActual(e).llegada);

const registro = (e: Episodio, etapa: RegistroEtapa['etapa']) => e.historial.find((r) => r.etapa === etapa);

/** Estado del episodio tal como se conocía en el instante t (reproducción de la simulación). */
export function vistaEnTiempo(e: Episodio, t: number): Episodio | null {
  const historial = e.historial
    .filter((r) => r.llegada <= t)
    .map((r) => {
      const entrada = r.entrada != null && r.entrada <= t ? r.entrada : null;
      const salida = entrada != null && r.salida != null && r.salida <= t ? r.salida : null;
      return { ...r, entrada, salida, responsable: entrada != null ? r.responsable : null };
    });
  if (!historial.length) return null;
  const finTriage = historial.find((r) => r.etapa === 'triage')?.salida;
  const egresado = e.egreso != null && e.egreso <= t;
  return {
    ...e,
    historial,
    triage: finTriage != null ? e.triage : null,
    egreso: egresado ? e.egreso : undefined,
    destino: egresado ? e.destino : null,
  };
}

/** Minutos entre el fin del triage y la primera valoración (o hasta ahora si aún no ocurre). */
export function esperaPostTriage(e: Episodio, ahora: number): number | null {
  const finTriage = registro(e, 'triage')?.salida;
  if (finTriage == null) return null;
  const medico = registro(e, 'valoracion')?.entrada;
  return ((medico ?? ahora) - finTriage) / MIN;
}

export function alertaEpisodio(e: Episodio, ahora: number, umbrales: Umbrales, metas: MetasTriage): Alerta {
  const actual = registroActual(e);
  const umbral = umbrales[actual.etapa];
  const minutos = tiempoEnEtapa(e, ahora) / MIN;
  let alerta: Alerta = { nivel: 'ok', motivo: 'En tiempo' };
  if (umbral && minutos >= umbral.rojo) alerta = { nivel: 'rojo', motivo: `Supera ${umbral.rojo} min en la etapa (ilustrativo)` };
  else if (umbral && minutos >= umbral.amarillo) alerta = { nivel: 'amarillo', motivo: `Supera ${umbral.amarillo} min en la etapa (ilustrativo)` };

  const meta = e.triage ? metas[e.triage] : null;
  const sinMedico = registro(e, 'valoracion')?.entrada == null;
  const espera = esperaPostTriage(e, ahora);
  if (meta != null && sinMedico && espera != null) {
    let nivel: NivelAlerta = 'ok';
    if (meta === 0 ? espera >= 1 : espera > meta) nivel = 'rojo';
    else if (meta > 0 && espera >= (meta * 2) / 3) nivel = 'amarillo';
    const motivo = meta === 0 ? `Triage ${e.triage}: atención inmediata` : `Meta Triage ${e.triage}: ${meta} min hasta valoración médica`;
    if (PESO[nivel] >= PESO[alerta.nivel] && nivel !== 'ok') alerta = { nivel, motivo };
  }
  return alerta;
}

export function formatoDuracion(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const p = (n: number) => String(n).padStart(2, '0');
  return h ? `${h}:${p(m)}:${p(s % 60)}` : `${p(m)}:${p(s % 60)}`;
}

const ETAPAS_MEDIBLES = ETAPAS.filter((e) => e.id !== 'punto0' && e.id !== 'egreso');

/** Espera (llegada → entrada) y atención (entrada → salida) promedio por etapa, en minutos. */
export function promediosPorEtapa(episodios: readonly Episodio[], ahora: number): PromedioEtapa[] {
  return ETAPAS_MEDIBLES.map((etapa) => {
    const registros = episodios.flatMap((e) => e.historial.filter((r) => r.etapa === etapa.id));
    const n = registros.length;
    const suma = registros.reduce(
      (acc, r) => {
        acc.espera += (r.entrada ?? ahora) - r.llegada;
        acc.atencion += r.entrada != null ? (r.salida ?? ahora) - r.entrada : 0;
        return acc;
      },
      { espera: 0, atencion: 0 },
    );
    const espera = n ? Math.round((suma.espera / n / MIN) * 10) / 10 : 0;
    const atencion = n ? Math.round((suma.atencion / n / MIN) * 10) / 10 : 0;
    return { id: etapa.id, etapa: etapa.corto, nombre: etapa.nombre, espera, atencion, total: espera + atencion, n };
  });
}

export function cuelloDeBotella(promedios: readonly PromedioEtapa[]): PromedioEtapa | null {
  return promedios.filter((p) => p.n > 0).reduce<PromedioEtapa | null>((max, p) => (!max || p.espera > max.espera ? p : max), null);
}

/** Estado genérico para acompañantes: sin datos clínicos. */
export function estadoPublico(e: Episodio): string {
  if (e.egreso != null) return 'Atención finalizada';
  const r = registroActual(e);
  switch (r.etapa) {
    case 'punto0':
    case 'triage':
      return r.entrada != null ? 'En triage' : 'En espera de triage';
    case 'admision':
      return 'En admisión';
    case 'valoracion':
      return r.entrada != null ? 'En valoración' : 'En espera de valoración';
    case 'ayudas':
      return 'En ayudas diagnósticas';
    case 'revaloracion':
      return 'En valoración';
    default:
      return 'En proceso de salida';
  }
}

export function estadoOrden(o: OrdenDiagnostica, t: number): EstadoOrden | null {
  if (o.solicitud > t) return null;
  if (o.revisado != null && o.revisado <= t) return 'Revisada';
  if (o.disponible != null && o.disponible <= t) return 'Disponible';
  if (o.toma != null && o.toma <= t) return 'En proceso';
  return 'Solicitada';
}

export interface TiemposClave {
  turnoATriage: number | null;
  finTriageAMedico: number | null;
  turnoAMedico: number | null;
  estanciaTotal: number | null;
}

/** Métricas en minutos definidas en la hoja LEEME de la base sintética. */
export function tiemposClave(e: Episodio): TiemposClave {
  const turno = e.historial[0]?.llegada;
  const triage = registro(e, 'triage');
  const medico = registro(e, 'valoracion')?.entrada;
  const dif = (a?: number | null, b?: number | null) => (a != null && b != null ? Math.round((b - a) / MIN) : null);
  return {
    turnoATriage: dif(turno, triage?.entrada),
    finTriageAMedico: dif(triage?.salida, medico),
    turnoAMedico: dif(turno, medico),
    estanciaTotal: dif(turno, e.egreso),
  };
}

export function promedio(valores: readonly (number | null)[]): number | null {
  const v = valores.filter((x): x is number => x != null);
  return v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10 : null;
}

export function bloqueDe(ts: number, capacidad: readonly BloqueCapacidad[]): BloqueCapacidad | undefined {
  let elegido: BloqueCapacidad | undefined;
  for (const b of capacidad) {
    if (b.inicio <= ts) elegido = b;
    else break;
  }
  return elegido;
}
