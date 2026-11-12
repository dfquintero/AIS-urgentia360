import { ETAPA_POR_ID, PERSONAL, TRANSICIONES } from '../data/catalogos';
import {
  AccionEscaneo,
  DestinoEgreso,
  Episodio,
  EtapaId,
  NivelTriageId,
  RegistroEtapa,
  ResultadoEscaneo,
} from '../models/urgencias.models';

export const registroActual = (e: Episodio): RegistroEtapa => e.historial[e.historial.length - 1];

export const etapaActual = (e: Episodio): EtapaId => registroActual(e).etapa;

/** 'entrada' si el episodio espera ser atendido en su etapa actual; 'salida' si ya está en atención. */
export const accionPendiente = (e: Episodio): AccionEscaneo =>
  registroActual(e).entrada != null ? 'salida' : 'entrada';

export const opcionesSiguiente = (e: Episodio): readonly EtapaId[] =>
  accionPendiente(e) === 'salida' ? TRANSICIONES[etapaActual(e)] : [];

export const requiereTriage = (e: Episodio): boolean =>
  etapaActual(e) === 'triage' && accionPendiente(e) === 'salida' && !e.triage;

export const requiereDestino = (e: Episodio): boolean =>
  etapaActual(e) === 'conducta' && accionPendiente(e) === 'salida';

export const nuevoRegistro = (etapa: EtapaId, llegada: number, extra: Partial<RegistroEtapa> = {}): RegistroEtapa => ({
  etapa,
  llegada,
  entrada: null,
  salida: null,
  responsable: null,
  ...extra,
});

export const numeroEpisodio = (id: string): number => Number(id.replace(/\D/g, '')) || 0;

/** Busca por ID de episodio, ID de turno o solo por su número ("198"). */
export function coincideCodigo(e: Episodio, codigo: string): boolean {
  const c = codigo.trim().toUpperCase();
  if (!c) return false;
  if (e.id === c || e.turno === c) return true;
  return /^\d{1,5}$/.test(c) && numeroEpisodio(e.id) === Number(c);
}

/** Turno nuevo generado en Punto 0: queda en espera de triage (obligatorio). */
export function crearEpisodioNuevo(numero: number, ahora: number, demanda: string, grupoEdad: string): Episodio {
  const sufijo = String(numero).padStart(5, '0');
  return {
    id: `DEM-URG-${sufijo}`,
    turno: `TURNO-FICT-${sufijo}`,
    triage: null,
    grupoEdad,
    demanda,
    responsable: PERSONAL.medico[numero % PERSONAL.medico.length],
    historial: [
      nuevoRegistro('punto0', ahora, { entrada: ahora, salida: ahora, responsable: PERSONAL.digiturno[0] }),
      nuevoRegistro('triage', ahora),
    ],
  };
}

export interface DatosEscaneo {
  ahora: number;
  responsable?: string | null;
  siguiente?: EtapaId;
  triage?: NivelTriageId | null;
  destino?: DestinoEgreso | null;
}

/** Aplica un escaneo QR al episodio siguiendo la máquina de estados del flujo de urgencias. */
export function registrarEscaneo(episodio: Episodio, datos: DatosEscaneo): ResultadoEscaneo {
  const { ahora, responsable, siguiente, triage, destino } = datos;
  if (episodio.egreso != null) return { ok: false, error: 'El episodio ya egresó.' };

  const actual = registroActual(episodio);
  const etapa = ETAPA_POR_ID[actual.etapa];
  const previos = episodio.historial.slice(0, -1);

  if (actual.entrada == null) {
    if (!responsable) return { ok: false, error: 'Seleccione el responsable que recibe al paciente.' };
    return {
      ok: true,
      episodio: { ...episodio, historial: [...previos, { ...actual, entrada: ahora, responsable }] },
      egresado: false,
      etapaEvento: actual.etapa,
      texto: `Entrada a ${etapa.nombre} · ${responsable}`,
    };
  }

  const clasificacion = episodio.triage ?? triage ?? null;
  if (actual.etapa === 'triage' && !clasificacion) {
    return {
      ok: false,
      error: 'El triage es obligatorio: registre la clasificación asignada por el profesional antes de continuar.',
    };
  }

  const cerrado: RegistroEtapa = { ...actual, salida: ahora };
  const permitidas = TRANSICIONES[actual.etapa];
  const destinoEtapa = siguiente ?? permitidas[0];
  if (!destinoEtapa || !permitidas.includes(destinoEtapa)) {
    const nombre = destinoEtapa ? (ETAPA_POR_ID[destinoEtapa]?.nombre ?? destinoEtapa) : '—';
    return { ok: false, error: `Transición no permitida: ${etapa.nombre} → ${nombre}.` };
  }

  if (destinoEtapa === 'egreso') {
    if (!destino) return { ok: false, error: 'Seleccione el destino de egreso.' };
    const egreso = nuevoRegistro('egreso', ahora, { entrada: ahora, salida: ahora, responsable: actual.responsable });
    return {
      ok: true,
      episodio: { ...episodio, historial: [...previos, cerrado, egreso], egreso: ahora, destino },
      egresado: true,
      etapaEvento: 'egreso',
      texto: `Egreso registrado · destino: ${destino}`,
    };
  }

  const detalleTriage = actual.etapa === 'triage' ? ` (Triage ${clasificacion})` : '';
  return {
    ok: true,
    episodio: {
      ...episodio,
      triage: clasificacion,
      historial: [...previos, cerrado, nuevoRegistro(destinoEtapa, ahora)],
    },
    egresado: false,
    etapaEvento: actual.etapa,
    texto: `Salida de ${etapa.nombre} → ${ETAPA_POR_ID[destinoEtapa].nombre}${detalleTriage}`,
  };
}
