import { ETAPA_POR_ID, TRANSICIONES } from '../data/catalogos';
import { nuevoRegistro } from '../data/datos-simulados';
import {
  AccionEscaneo,
  EtapaId,
  NivelTriageId,
  Paciente,
  RegistroEtapa,
  ResultadoEscaneo,
} from '../models/urgencias.models';

export const registroActual = (p: Paciente): RegistroEtapa => p.historial[p.historial.length - 1];

export const etapaActual = (p: Paciente): EtapaId => registroActual(p).etapa;

/** 'entrada' si el paciente espera ser atendido en su etapa actual; 'salida' si ya está en atención. */
export const accionPendiente = (p: Paciente): AccionEscaneo =>
  registroActual(p).entrada ? 'salida' : 'entrada';

export const opcionesSiguiente = (p: Paciente): readonly EtapaId[] => TRANSICIONES[etapaActual(p)];

export const requiereTriage = (p: Paciente): boolean =>
  etapaActual(p) === 'triage' && accionPendiente(p) === 'salida' && !p.triage;

export interface DatosEscaneo {
  ahora: number;
  responsable?: string | null;
  siguiente?: EtapaId;
  triage?: NivelTriageId | null;
}

/** Aplica un escaneo QR al paciente siguiendo la máquina de estados del flujo de urgencias. */
export function registrarEscaneo(paciente: Paciente, datos: DatosEscaneo): ResultadoEscaneo {
  const { ahora, responsable, siguiente, triage } = datos;
  const actual = registroActual(paciente);
  const etapa = ETAPA_POR_ID[actual.etapa];
  const previos = paciente.historial.slice(0, -1);

  if (!actual.entrada) {
    if (!responsable) return { ok: false, error: 'Seleccione el responsable que recibe al paciente.' };
    return {
      ok: true,
      paciente: { ...paciente, historial: [...previos, { ...actual, entrada: ahora, responsable }] },
      egresado: false,
      evento: { tipo: 'entrada', texto: `Entrada a ${etapa.nombre} · ${responsable}` },
    };
  }

  const clasificacion = paciente.triage ?? triage ?? null;
  if (actual.etapa === 'triage' && !clasificacion) {
    return {
      ok: false,
      error: 'El triage es obligatorio: registre la clasificación asignada por el profesional antes de continuar.',
    };
  }

  const cerrado: RegistroEtapa = { ...actual, salida: ahora };

  if (actual.etapa === 'egreso') {
    return {
      ok: true,
      paciente: { ...paciente, historial: [...previos, cerrado], egreso: ahora },
      egresado: true,
      evento: { tipo: 'egreso', texto: 'Salida de urgencias · atención finalizada' },
    };
  }

  const permitidas = TRANSICIONES[actual.etapa];
  const destino = siguiente ?? permitidas[0];
  if (!permitidas.includes(destino)) {
    const nombreDestino = ETAPA_POR_ID[destino]?.nombre ?? destino;
    return { ok: false, error: `Transición no permitida: ${etapa.nombre} → ${nombreDestino}.` };
  }

  const esRevaloracion = actual.etapa === 'valoracion' && destino === 'valoracion';
  const nuevo = nuevoRegistro(destino, ahora, {
    revaloracion: esRevaloracion ? actual.revaloracion + 1 : 0,
  });
  const detalleTriage = actual.etapa === 'triage' ? ` (Triage ${clasificacion})` : '';

  return {
    ok: true,
    paciente: { ...paciente, triage: clasificacion, historial: [...previos, cerrado, nuevo] },
    egresado: false,
    evento: {
      tipo: 'salida',
      texto: esRevaloracion
        ? `Salida de ${etapa.nombre} → revaloración #${nuevo.revaloracion}`
        : `Salida de ${etapa.nombre} → ${ETAPA_POR_ID[destino].nombre}${detalleTriage}`,
    },
  };
}
