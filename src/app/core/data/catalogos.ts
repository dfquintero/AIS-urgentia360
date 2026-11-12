import { Etapa, EtapaId, NivelTriage, RolPersonal, Umbrales } from '../models/urgencias.models';

export const ETAPAS: readonly Etapa[] = [
  { id: 'punto0', nombre: 'Punto 0 · Generación de turno', corto: 'Punto 0', area: 'Recepción / Digiturno', rol: 'digiturno' },
  { id: 'triage', nombre: 'Triage', corto: 'Triage', area: 'Consultorio de triage', rol: 'enfermeria', obligatoria: true },
  { id: 'admision', nombre: 'Admisión', corto: 'Admisión', area: 'Ventanilla de admisiones', rol: 'admisiones' },
  { id: 'consulta', nombre: 'Consulta', corto: 'Consulta', area: 'Consultorios de urgencias', rol: 'medico' },
  { id: 'ayudas', nombre: 'Ayudas diagnósticas', corto: 'Ayudas Dx', area: 'Laboratorio / Imágenes', rol: 'ayudas' },
  { id: 'valoracion', nombre: 'Valoración / Observación', corto: 'Valoración', area: 'Sala de observación', rol: 'medico' },
  { id: 'egreso', nombre: 'Egreso', corto: 'Egreso', area: 'Salida / Facturación', rol: 'admisiones' },
];

export const ETAPA_POR_ID = Object.fromEntries(ETAPAS.map((e) => [e.id, e])) as Record<EtapaId, Etapa>;

// Máquina de estados: transiciones permitidas desde cada etapa.
// El triage no se puede omitir: Punto 0 solo conduce a Triage.
export const TRANSICIONES: Readonly<Record<EtapaId, readonly EtapaId[]>> = {
  punto0: ['triage'],
  triage: ['admision'],
  admision: ['consulta'],
  consulta: ['ayudas', 'valoracion'],
  ayudas: ['valoracion'],
  valoracion: ['egreso', 'valoracion'],
  egreso: [],
};

export const ETIQUETA_TRANSICION: Readonly<Record<string, string>> = {
  'consulta>ayudas': 'Ayudas diagnósticas',
  'consulta>valoracion': 'Directo a valoración / observación',
  'valoracion>egreso': 'Egreso',
  'valoracion>valoracion': 'Revaloración (permanece en observación)',
};

// Minutos de permanencia en la etapa (espera + atención) para alertar.
export const UMBRALES_INICIALES: Readonly<Umbrales> = {
  punto0: { amarillo: 5, rojo: 10 },
  triage: { amarillo: 15, rojo: 30 },
  admision: { amarillo: 15, rojo: 30 },
  consulta: { amarillo: 45, rojo: 90 },
  ayudas: { amarillo: 60, rojo: 120 },
  valoracion: { amarillo: 120, rojo: 240 },
  egreso: { amarillo: 20, rojo: 40 },
};

export const PERSONAL: Readonly<Record<RolPersonal, readonly string[]>> = {
  digiturno: ['Digiturno · Kiosko 1', 'Digiturno · Kiosko 2'],
  enfermeria: ['Enf. Laura Gómez', 'Enf. Andrés Rojas', 'Enf. Paola Castillo', 'Enf. Julián Mejía'],
  admisiones: ['Aux. Carolina Díaz', 'Aux. Mateo Herrera', 'Aux. Sofía Vargas'],
  medico: ['Dr. Felipe Ramírez', 'Dra. Natalia Ospina', 'Dr. Camilo Torres', 'Dra. Valentina Ruiz', 'Dr. Sergio Peña'],
  ayudas: ['Bact. Diana Moreno', 'Tec. Rx Juan Pardo', 'Bact. Esteban Ríos'],
};

export const SERVICIOS: readonly string[] = [
  'Medicina general',
  'Pediatría',
  'Ortopedia',
  'Ginecobstetricia',
  'Cirugía general',
  'Medicina interna',
];

// La clasificación la asigna siempre el profesional de salud; el sistema solo la registra.
export const NIVELES_TRIAGE: readonly NivelTriage[] = [
  { id: 'I', nombre: 'Triage I' },
  { id: 'II', nombre: 'Triage II' },
  { id: 'III', nombre: 'Triage III' },
  { id: 'IV', nombre: 'Triage IV' },
  { id: 'V', nombre: 'Triage V' },
];
