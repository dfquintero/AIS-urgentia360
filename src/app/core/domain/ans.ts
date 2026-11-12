import { Episodio, NivelTriageId, OrdenDiagnostica } from '../models/urgencias.models';
import { tiemposClave } from './indicadores';

const MIN = 60_000;
const DIA = 24 * 60 * MIN;
const OFFSET_BOGOTA = -5 * 60 * MIN;

/** Kantera sugiere diferenciar obligaciones normativas, metas operativas y ANS contractuales. */
export type TipoAns = 'Normativo' | 'Operativo' | 'Contractual';

export interface DefinicionAns {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: TipoAns;
  fuente: string;
  /** Minutos máximos por defecto; null = por definir. */
  metaInicial: number | null;
  /** La meta normativa no se edita. */
  editable: boolean;
  /** Valor medido (minutos) del episodio, o null si no aplica o aún no ocurre. */
  medir: (e: Episodio) => number | null;
}

const triage = (nivel: NivelTriageId, f: (e: Episodio) => number | null) => (e: Episodio) => (e.triage === nivel ? f(e) : null);
const postTriage = (e: Episodio) => tiemposClave(e).finTriageAMedico;

export const DEFINICIONES_ANS: readonly DefinicionAns[] = [
  { id: 'T-I', nombre: 'Triage I: atención inmediata', descripcion: 'Fin de triage → valoración médica', tipo: 'Normativo', fuente: 'Res. 5596 de 2015', metaInicial: 0, editable: false, medir: triage('I', postTriage) },
  { id: 'T-II', nombre: 'Triage II: máximo 30 min', descripcion: 'Fin de triage → valoración médica', tipo: 'Normativo', fuente: 'Res. 5596 de 2015', metaInicial: 30, editable: false, medir: triage('II', postTriage) },
  { id: 'T-III', nombre: 'Triage III', descripcion: 'Fin de triage → valoración médica', tipo: 'Operativo', fuente: 'Meta institucional por definir', metaInicial: null, editable: true, medir: triage('III', postTriage) },
  { id: 'T-IV', nombre: 'Triage IV', descripcion: 'Fin de triage → valoración médica', tipo: 'Operativo', fuente: 'Meta institucional por definir', metaInicial: null, editable: true, medir: triage('IV', postTriage) },
  { id: 'T-V', nombre: 'Triage V', descripcion: 'Fin de triage → valoración médica', tipo: 'Operativo', fuente: 'Meta institucional por definir', metaInicial: null, editable: true, medir: triage('V', postTriage) },
  { id: 'TURNO-TRIAGE', nombre: 'Turno → inicio de triage', descripcion: 'Digiturno → triage (medir aparte de la meta de Triage II)', tipo: 'Operativo', fuente: 'Meta institucional por definir', metaInicial: null, editable: true, medir: (e) => tiemposClave(e).turnoATriage },
  { id: 'ESTANCIA', nombre: 'Estancia total en urgencias', descripcion: 'Turno → egreso', tipo: 'Operativo', fuente: 'Meta institucional por definir', metaInicial: null, editable: true, medir: (e) => tiemposClave(e).estanciaTotal },
  { id: 'CONTRATO-EPS', nombre: 'ANS contractual con entidades pagadoras', descripcion: 'Indicador y fórmula según contrato', tipo: 'Contractual', fuente: 'No disponible: contratos no entregados', metaInicial: null, editable: false, medir: () => null },
];

export type MetasAns = Record<string, number | null>;

export const metasAnsIniciales = (): MetasAns => Object.fromEntries(DEFINICIONES_ANS.map((d) => [d.id, d.metaInicial]));

export interface ResultadoAns {
  medidos: number;
  cumplen: number;
  /** Porcentaje de episodios dentro de la meta; null si no hay meta o no hay mediciones. */
  cumplimiento: number | null;
}

export function evaluarAns(definicion: DefinicionAns, meta: number | null, episodios: readonly Episodio[]): ResultadoAns {
  const valores = episodios.map(definicion.medir).filter((v): v is number => v != null);
  if (meta == null || !valores.length) return { medidos: valores.length, cumplen: 0, cumplimiento: null };
  const cumplen = valores.filter((v) => v <= meta).length;
  return { medidos: valores.length, cumplen, cumplimiento: Math.round((cumplen / valores.length) * 1000) / 10 };
}

/** Día calendario (Bogotá) del turno, como timestamp de las 00:00. */
export const diaBogota = (ts: number): number => Math.floor((ts + OFFSET_BOGOTA) / DIA) * DIA - OFFSET_BOGOTA;

export function tendenciaDiaria(definicion: DefinicionAns, meta: number | null, episodios: readonly Episodio[]): { dia: number; cumplimiento: number | null; medidos: number }[] {
  const porDia = new Map<number, Episodio[]>();
  for (const e of episodios) {
    const dia = diaBogota(e.historial[0].llegada);
    porDia.set(dia, [...(porDia.get(dia) ?? []), e]);
  }
  return [...porDia.entries()]
    .sort(([a], [b]) => a - b)
    .map(([dia, lista]) => {
      const r = evaluarAns(definicion, meta, lista);
      return { dia, cumplimiento: r.cumplimiento, medidos: r.medidos };
    });
}

export type OrdenesAns = readonly OrdenDiagnostica[];
