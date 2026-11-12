export type EtapaId =
  | 'punto0'
  | 'triage'
  | 'admision'
  | 'valoracion'
  | 'ayudas'
  | 'revaloracion'
  | 'conducta'
  | 'egreso';

export type RolPersonal = 'digiturno' | 'enfermeria' | 'admisiones' | 'medico' | 'diagnostico';

export type NivelTriageId = 'I' | 'II' | 'III' | 'IV' | 'V';

export type NivelAlerta = 'ok' | 'amarillo' | 'rojo';

export type AccionEscaneo = 'entrada' | 'salida';

export type DestinoEgreso = 'Alta' | 'Hospitalización' | 'Remisión' | 'Otro';

export type EstadoOrden = 'Solicitada' | 'En proceso' | 'Disponible' | 'Revisada';

export interface Etapa {
  id: EtapaId;
  nombre: string;
  corto: string;
  rol: RolPersonal;
  /** Sistema institucional de referencia (conceptual: no hay integración). */
  sistema: string;
  obligatoria?: boolean;
}

export interface RegistroEtapa {
  etapa: EtapaId;
  llegada: number;
  entrada: number | null;
  salida: number | null;
  responsable: string | null;
}

/** Episodio ficticio de urgencias (sin nombres ni datos clínicos). */
export interface Episodio {
  id: string;
  turno: string;
  triage: NivelTriageId | null;
  grupoEdad: string;
  demanda: string;
  responsable: string;
  historial: RegistroEtapa[];
  destino?: DestinoEgreso | null;
  egreso?: number;
}

export interface OrdenDiagnostica {
  id: string;
  episodioId: string;
  tipo: string;
  descripcion: string;
  sistema: string;
  solicitud: number;
  toma: number | null;
  disponible: number | null;
  revisado: number | null;
}

export type OrigenEvento = 'Simulación' | 'Registro manual (QR)';

export interface EventoEpisodio {
  id: string;
  episodioId: string;
  ts: number;
  fase: string;
  tipo: string;
  sistema: string;
  rol: string;
  nota: string;
  origen: OrigenEvento;
}

export interface BloqueCapacidad {
  inicio: number;
  franja: string;
  medicos: number;
  enfermeria: number;
  puestosTriage: number;
  puestosObservacion: number;
  demanda: string;
}

export interface Dataset {
  fuente: string;
  esRespaldo: boolean;
  inicio: number;
  corte: number;
  episodios: Episodio[];
  ordenes: OrdenDiagnostica[];
  eventos: EventoEpisodio[];
  capacidad: BloqueCapacidad[];
}

export interface Umbral {
  amarillo: number;
  rojo: number;
}

export type Umbrales = Record<EtapaId, Umbral>;

/** Minutos máximos entre fin de triage y primera valoración; null = por definir. */
export type MetasTriage = Record<NivelTriageId, number | null>;

export interface SolicitudEscaneo {
  codigo: string;
  responsable?: string | null;
  siguiente?: EtapaId;
  triage?: NivelTriageId | null;
  destino?: DestinoEgreso | null;
}

export type ResultadoEscaneo =
  | { ok: true; episodio: Episodio; egresado: boolean; texto: string; etapaEvento: EtapaId }
  | { ok: false; error: string };

export interface Alerta {
  nivel: NivelAlerta;
  motivo: string;
}

export interface FilaTablero {
  episodio: Episodio;
  etapa: Etapa;
  registro: RegistroEtapa;
  enAtencion: boolean;
  tiempoMs: number;
  alerta: Alerta;
  ordenesPendientes: number;
}

export interface PromedioEtapa {
  id: EtapaId;
  etapa: string;
  nombre: string;
  espera: number;
  atencion: number;
  total: number;
  n: number;
}
