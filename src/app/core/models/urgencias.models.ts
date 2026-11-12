export type EtapaId =
  | 'punto0'
  | 'triage'
  | 'admision'
  | 'consulta'
  | 'ayudas'
  | 'valoracion'
  | 'egreso';

export type RolPersonal = 'digiturno' | 'enfermeria' | 'admisiones' | 'medico' | 'ayudas';

export type NivelTriageId = 'I' | 'II' | 'III' | 'IV' | 'V';

export type NivelAlerta = 'ok' | 'amarillo' | 'rojo';

export type AccionEscaneo = 'entrada' | 'salida';

export interface Etapa {
  id: EtapaId;
  nombre: string;
  corto: string;
  area: string;
  rol: RolPersonal;
  obligatoria?: boolean;
}

export interface RegistroEtapa {
  etapa: EtapaId;
  area: string;
  llegada: number;
  entrada: number | null;
  salida: number | null;
  responsable: string | null;
  revaloracion: number;
}

export interface Paciente {
  id: string;
  turno: string;
  qr: string;
  nombre: string;
  edad: number;
  servicio: string;
  triage: NivelTriageId | null;
  historial: RegistroEtapa[];
  egreso?: number;
}

export interface Umbral {
  amarillo: number;
  rojo: number;
}

export type Umbrales = Record<EtapaId, Umbral>;

export interface NivelTriage {
  id: NivelTriageId;
  nombre: string;
}

export type TipoEvento = 'turno' | 'entrada' | 'salida' | 'egreso';

export interface EventoBitacora {
  id: number;
  ts: number;
  turno: string;
  tipo: TipoEvento;
  texto: string;
}

export interface SolicitudEscaneo {
  codigo: string;
  responsable?: string | null;
  siguiente?: EtapaId;
  triage?: NivelTriageId | null;
}

export type ResultadoEscaneo =
  | {
      ok: true;
      paciente: Paciente;
      egresado: boolean;
      evento: { tipo: TipoEvento; texto: string };
    }
  | { ok: false; error: string };

export interface FilaTablero {
  paciente: Paciente;
  etapa: Etapa;
  registro: RegistroEtapa;
  enAtencion: boolean;
  tiempoMs: number;
  alerta: NivelAlerta;
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
