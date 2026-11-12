import { DestinoEgreso, Etapa, EtapaId, MetasTriage, NivelTriageId, RolPersonal, Umbrales } from '../models/urgencias.models';

// Etapas alineadas con los hitos de la base sintética UNAL–Kantera.
export const ETAPAS: readonly Etapa[] = [
  { id: 'punto0', nombre: 'Punto 0 · Generación de turno', corto: 'Punto 0', rol: 'digiturno', sistema: 'Sofía / Digiturno' },
  { id: 'triage', nombre: 'Triage', corto: 'Triage', rol: 'enfermeria', sistema: 'HIS/Athenea', obligatoria: true },
  { id: 'admision', nombre: 'Admisión', corto: 'Admisión', rol: 'admisiones', sistema: 'HIS/Athenea' },
  { id: 'valoracion', nombre: 'Primera valoración médica', corto: 'Valoración', rol: 'medico', sistema: 'HIS/Athenea' },
  { id: 'ayudas', nombre: 'Ayudas diagnósticas', corto: 'Ayudas Dx', rol: 'diagnostico', sistema: 'LIS · PACS/RIS' },
  { id: 'revaloracion', nombre: 'Revaloración / Observación', corto: 'Revaloración', rol: 'medico', sistema: 'HIS' },
  { id: 'conducta', nombre: 'Definición de conducta', corto: 'Conducta', rol: 'medico', sistema: 'HIS/Athenea' },
  { id: 'egreso', nombre: 'Egreso', corto: 'Egreso', rol: 'admisiones', sistema: 'HIS / censo' },
];

export const ETAPA_POR_ID = Object.fromEntries(ETAPAS.map((e) => [e.id, e])) as Record<EtapaId, Etapa>;

// Máquina de estados: transiciones permitidas desde cada etapa.
// El triage no se puede omitir: Punto 0 solo conduce a Triage.
export const TRANSICIONES: Readonly<Record<EtapaId, readonly EtapaId[]>> = {
  punto0: ['triage'],
  triage: ['admision'],
  admision: ['valoracion'],
  valoracion: ['ayudas', 'conducta'],
  ayudas: ['revaloracion'],
  revaloracion: ['conducta', 'ayudas'],
  conducta: ['egreso'],
  egreso: [],
};

export const ETIQUETA_TRANSICION: Readonly<Record<string, string>> = {
  'valoracion>ayudas': 'Solicitar ayudas diagnósticas',
  'valoracion>conducta': 'Definir conducta sin ayudas diagnósticas',
  'revaloracion>conducta': 'Definir conducta',
  'revaloracion>ayudas': 'Nuevas ayudas diagnósticas',
};

export const DESTINOS_EGRESO: readonly DestinoEgreso[] = ['Alta', 'Hospitalización', 'Remisión', 'Otro'];

// Umbrales ILUSTRATIVOS (minutos en la etapa, espera + atención) hasta validación institucional.
export const UMBRALES_INICIALES: Readonly<Umbrales> = {
  punto0: { amarillo: 5, rojo: 10 },
  triage: { amarillo: 15, rojo: 30 },
  admision: { amarillo: 15, rojo: 30 },
  valoracion: { amarillo: 90, rojo: 150 },
  ayudas: { amarillo: 90, rojo: 180 },
  revaloracion: { amarillo: 60, rojo: 120 },
  conducta: { amarillo: 45, rojo: 90 },
  egreso: { amarillo: 20, rojo: 40 },
};

// Resolución 5596 de 2015: I atención inmediata, II máximo 30 min. III–V las define cada prestador.
export const METAS_TRIAGE_NORMATIVAS: Readonly<Partial<MetasTriage>> = { I: 0, II: 30 };
export const METAS_TRIAGE_INICIALES: Readonly<MetasTriage> = { I: 0, II: 30, III: null, IV: null, V: null };

// Códigos de personal ficticios (no corresponden a personas reales).
const codigos = (prefijo: string, n: number) =>
  Array.from({ length: n }, (_, i) => `${prefijo}-FICT-${String(i + 1).padStart(2, '0')}`);

export const PERSONAL: Readonly<Record<RolPersonal, readonly string[]>> = {
  digiturno: ['Digiturno · Kiosko 1', 'Digiturno · Kiosko 2'],
  enfermeria: codigos('ENF', 6),
  admisiones: codigos('ADM', 4),
  medico: codigos('MED', 12),
  diagnostico: codigos('DX', 4),
};

export const ROL_EVENTO: Readonly<Record<RolPersonal, string>> = {
  digiturno: 'Administrativo',
  enfermeria: 'Enfermería',
  admisiones: 'Administrativo',
  medico: 'Médico',
  diagnostico: 'Personal diagnóstico',
};

export const TIPOS_DEMANDA: readonly string[] = ['Digestiva', 'Respiratoria', 'General', 'Dolor', 'Trauma menor', 'Otra'];
export const GRUPOS_EDAD: readonly string[] = ['0-17', '18-39', '40-64', '65+'];

// La clasificación la asigna siempre el profesional de salud; el sistema solo la registra.
export const NIVELES_TRIAGE: readonly NivelTriageId[] = ['I', 'II', 'III', 'IV', 'V'];
