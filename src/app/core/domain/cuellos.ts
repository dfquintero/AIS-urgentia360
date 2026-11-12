import { ETAPAS } from '../data/catalogos';
import { BloqueCapacidad, Episodio, EtapaId, NivelTriageId, OrdenDiagnostica, RegistroEtapa } from '../models/urgencias.models';
import { registroActual } from './flujo';

const MIN = 60_000;
const HORA = 60 * MIN;
const OFFSET_BOGOTA = -5; // Colombia no usa horario de verano.

export const ETAPAS_CUELLO = ETAPAS.filter((e) => e.id !== 'punto0' && e.id !== 'egreso');

export function percentil(valores: readonly number[], p: number): number | null {
  if (!valores.length) return null;
  const orden = [...valores].sort((a, b) => a - b);
  const i = (orden.length - 1) * p;
  const bajo = Math.floor(i);
  const alto = Math.ceil(i);
  return Math.round((orden[bajo] + (orden[alto] - orden[bajo]) * (i - bajo)) * 10) / 10;
}

const promedioSimple = (v: readonly number[]) => (v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10 : null);

export const horaBogota = (ts: number): number => (((Math.floor(ts / HORA) + OFFSET_BOGOTA) % 24) + 24) % 24;

/**
 * Fin de la espera de un registro: inicio de atención; si nunca se atendió, el cierre de la etapa o el egreso
 * (no se acumula espera después de que el episodio salió). En "Definición de conducta" la espera relevante
 * es hasta el egreso efectivo.
 */
export function finEspera(r: RegistroEtapa, e: Episodio, ahora: number): number {
  if (r.etapa === 'conducta') return r.salida ?? e.egreso ?? ahora;
  return r.entrada ?? r.salida ?? e.egreso ?? ahora;
}

/** Esperas en minutos por etapa (ver finEspera). */
export function esperas(episodios: readonly Episodio[], ahora: number): Map<EtapaId, { espera: number; llegada: number; episodio: Episodio }[]> {
  const mapa = new Map<EtapaId, { espera: number; llegada: number; episodio: Episodio }[]>();
  for (const e of episodios) {
    for (const r of e.historial) {
      const lista = mapa.get(r.etapa) ?? [];
      lista.push({ espera: Math.max(0, (finEspera(r, e, ahora) - r.llegada) / MIN), llegada: r.llegada, episodio: e });
      mapa.set(r.etapa, lista);
    }
  }
  return mapa;
}

export interface EstadisticaEtapa {
  id: EtapaId;
  etapa: string;
  nombre: string;
  n: number;
  promedio: number | null;
  mediana: number | null;
  p90: number | null;
  enCola: number;
}

/** Ranking de etapas por espera promedio, con mediana, p90 y cola actual. */
export function rankingEtapas(episodios: readonly Episodio[], activos: readonly Episodio[], ahora: number): EstadisticaEtapa[] {
  const datos = esperas(episodios, ahora);
  return ETAPAS_CUELLO.map((etapa) => {
    const v = (datos.get(etapa.id) ?? []).map((x) => x.espera);
    return {
      id: etapa.id,
      etapa: etapa.corto,
      nombre: etapa.nombre,
      n: v.length,
      promedio: promedioSimple(v),
      mediana: percentil(v, 0.5),
      p90: percentil(v, 0.9),
      enCola: activos.filter((a) => registroActual(a).etapa === etapa.id && registroActual(a).entrada == null).length,
    };
  }).sort((a, b) => (b.promedio ?? -1) - (a.promedio ?? -1));
}

export interface CeldaCalor {
  fila: string;
  columna: string;
  valor: number | null;
  n: number;
}

/** Espera promedio por etapa y hora de llegada a la etapa (hora de Bogotá). */
export function mapaCalorHoras(episodios: readonly Episodio[], ahora: number): CeldaCalor[] {
  const datos = esperas(episodios, ahora);
  return ETAPAS_CUELLO.flatMap((etapa) => {
    const lista = datos.get(etapa.id) ?? [];
    return Array.from({ length: 24 }, (_, h) => {
      const v = lista.filter((x) => horaBogota(x.llegada) === h).map((x) => x.espera);
      return { fila: etapa.corto, columna: String(h).padStart(2, '0'), valor: promedioSimple(v), n: v.length };
    });
  });
}

/** Espera promedio por etapa para cada valor de un atributo del episodio (triage, tipo de demanda…). */
export function cortePorGrupo(
  episodios: readonly Episodio[],
  ahora: number,
  grupo: (e: Episodio) => string | null,
  grupos: readonly string[],
): CeldaCalor[] {
  const datos = esperas(episodios, ahora);
  return grupos.flatMap((g) =>
    ETAPAS_CUELLO.map((etapa) => {
      const v = (datos.get(etapa.id) ?? []).filter((x) => grupo(x.episodio) === g).map((x) => x.espera);
      return { fila: g, columna: etapa.corto, valor: promedioSimple(v), n: v.length };
    }),
  );
}

export interface PasoOrden {
  tipo: string;
  solicitudAToma: number | null;
  tomaAResultado: number | null;
  resultadoARevision: number | null;
  pendientes: { toma: number; resultado: number; revision: number };
}

/** Desglose de ayudas diagnósticas en sus pasos, separado por tipo de orden. */
export function desgloseOrdenes(ordenes: readonly OrdenDiagnostica[], ahora: number): PasoOrden[] {
  const tipos = [...new Set(ordenes.map((o) => o.tipo))].sort();
  const dif = (a: number | null, b: number | null) => (a != null && b != null && a <= ahora && b <= ahora ? (b - a) / MIN : null);
  return tipos.map((tipo) => {
    const propias = ordenes.filter((o) => o.tipo === tipo && o.solicitud <= ahora);
    const pasos = (f: (o: OrdenDiagnostica) => number | null) => promedioSimple(propias.map(f).filter((x): x is number => x != null));
    const hecho = (t: number | null) => t != null && t <= ahora;
    return {
      tipo,
      solicitudAToma: pasos((o) => dif(o.solicitud, o.toma)),
      tomaAResultado: pasos((o) => dif(o.toma, o.disponible)),
      resultadoARevision: pasos((o) => dif(o.disponible, o.revisado)),
      pendientes: {
        toma: propias.filter((o) => !hecho(o.toma)).length,
        resultado: propias.filter((o) => hecho(o.toma) && !hecho(o.disponible)).length,
        revision: propias.filter((o) => hecho(o.disponible) && !hecho(o.revisado)).length,
      },
    };
  });
}

export interface BloqueCarga {
  inicio: number;
  pico: boolean;
  turnos: number;
  medicos: number;
  turnosPorMedico: number;
  esperaMedico: number | null;
}

/** Cruza la demanda de cada bloque de 4 h con la dotación simulada y la espera a valoración médica. */
export function cargaVsEspera(episodios: readonly Episodio[], capacidad: readonly BloqueCapacidad[], ahora: number): BloqueCarga[] {
  return capacidad
    .filter((b) => b.inicio <= ahora)
    .map((b) => {
      const fin = b.inicio + 4 * HORA;
      const propios = episodios.filter((e) => e.historial[0].llegada >= b.inicio && e.historial[0].llegada < fin);
      const espera = propios.flatMap((e) => {
        const val = e.historial.find((r) => r.etapa === 'valoracion');
        return val ? [((val.entrada ?? ahora) - val.llegada) / MIN] : [];
      });
      return {
        inicio: b.inicio,
        pico: b.franja === 'Pico simulado',
        turnos: propios.length,
        medicos: b.medicos,
        turnosPorMedico: b.medicos ? Math.round((propios.length / b.medicos) * 10) / 10 : 0,
        esperaMedico: promedioSimple(espera),
      };
    });
}

const formatoMin = (m: number | null) => {
  if (m == null) return '—';
  const t = Math.round(m);
  return t < 60 ? `${t} min` : `${Math.floor(t / 60)} h ${String(t % 60).padStart(2, '0')} min`;
};

/** Resumen en lenguaje natural del principal cuello de botella (ilustrativo). */
export function resumenCuello(ranking: readonly EstadisticaEtapa[], horas: readonly CeldaCalor[], triage: readonly CeldaCalor[]): string | null {
  const principal = ranking.find((r) => r.promedio != null);
  if (!principal) return null;
  const pico = horas
    .filter((c) => c.fila === principal.etapa && c.valor != null && c.n >= 3)
    .sort((a, b) => b.valor! - a.valor!)[0];
  const grupo = triage
    .filter((c) => c.columna === principal.etapa && c.valor != null && c.n >= 3)
    .sort((a, b) => b.valor! - a.valor!)[0];
  let texto = `La mayor espera está en ${principal.nombre.toLowerCase()}: promedio ${formatoMin(principal.promedio)}, mediana ${formatoMin(principal.mediana)} y p90 ${formatoMin(principal.p90)}`;
  if (pico) texto += `, con el pico para quienes llegan hacia las ${pico.columna}:00 (${formatoMin(pico.valor)})`;
  if (grupo) texto += `; los pacientes Triage ${grupo.fila as NivelTriageId} son los que más esperan en esta etapa (${formatoMin(grupo.valor)})`;
  return `${texto}. Hay ${principal.enCola} en cola en este momento.`;
}
