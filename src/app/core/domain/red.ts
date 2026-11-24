/**
 * Visión de red (escenario hipotético): centros ficticios en Bogotá, tiempo estimado en carro y
 * espera estimada. Ningún valor representa tiempos reales ni recomienda una institución.
 */

export interface Punto {
  lat: number;
  lon: number;
}

export type TipoCentro = 'Clínica' | 'Centro médico' | 'Unidad de urgencias';

export const SERVICIOS = ['Laboratorio', 'Rayos X', 'Procedimientos', 'Terapia respiratoria', 'Pediatría', 'Ginecobstetricia'] as const;
export type Servicio = (typeof SERVICIOS)[number];

export interface CentroRed {
  id: string;
  nombre: string;
  tipo: TipoCentro;
  localidad: string;
  posicion: Punto;
  /** Ocupación base simulada de urgencias entre 0 y 1. */
  carga: number;
  /** Consultorios de urgencias disponibles (simulado). */
  consultorios: number;
  /** Horas pico propias del centro: [mañana, tarde]. */
  picos: readonly [number, number];
  servicios: readonly Servicio[];
}

export type Prioridad = 'vital' | 'alta' | 'media' | 'baja';

export interface Alternativa {
  centro: CentroRed;
  distanciaKm: number;
  desplazamiento: number;
  espera: number;
  total: number;
  /** Ocupación estimada del centro a la hora de la solicitud (0–1,2). */
  ocupacion: number;
  /** Servicios que la solicitud necesita y el centro no tiene. */
  faltantes: Servicio[];
}

/** Lo que cambia la espera: prioridad orientativa, síntoma y datos del perfil. */
export interface Solicitud {
  prioridad: Prioridad;
  sintoma: string;
  edad: number | null;
  embarazo: boolean;
}

/** Límites del mapa esquemático (casco urbano de Bogotá). */
export const BOGOTA = { norte: 4.84, sur: 4.46, oeste: -74.22, este: -74.0 } as const;

/** Punto de partida cuando no hay GPS o la ubicación está fuera de Bogotá. */
export const ORIGEN_SIMULADO: Punto = { lat: 4.6486, lon: -74.0975 };

const LOCALIDADES: readonly { nombre: string; lat: number; lon: number }[] = [
  { nombre: 'Usaquén', lat: 4.715, lon: -74.035 },
  { nombre: 'Suba', lat: 4.742, lon: -74.083 },
  { nombre: 'Engativá', lat: 4.703, lon: -74.112 },
  { nombre: 'Fontibón', lat: 4.672, lon: -74.142 },
  { nombre: 'Chapinero', lat: 4.648, lon: -74.062 },
  { nombre: 'Barrios Unidos', lat: 4.668, lon: -74.075 },
  { nombre: 'Teusaquillo', lat: 4.632, lon: -74.083 },
  { nombre: 'Puente Aranda', lat: 4.618, lon: -74.112 },
  { nombre: 'Kennedy', lat: 4.628, lon: -74.152 },
  { nombre: 'Bosa', lat: 4.612, lon: -74.188 },
  { nombre: 'Tunjuelito', lat: 4.578, lon: -74.132 },
  { nombre: 'Ciudad Bolívar', lat: 4.558, lon: -74.152 },
  { nombre: 'San Cristóbal', lat: 4.565, lon: -74.088 },
  { nombre: 'Rafael Uribe Uribe', lat: 4.578, lon: -74.112 },
];

const NOMBRES = ['Aurora', 'Altavista', 'Los Cedros', 'Mirador', 'Bosque Alto', 'La Pradera', 'Sabana', 'Arrayanes', 'Guayacanes', 'Las Acacias', 'Yarumo', 'Alameda'];
const TIPOS: readonly TipoCentro[] = ['Clínica', 'Centro médico', 'Unidad de urgencias'];

/** Generador pseudoaleatorio con semilla (mulberry32): los centros son estables entre visitas. */
export function aleatorio(semilla: number): () => number {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function barajar<T>(lista: readonly T[], azar: () => number): T[] {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

const PERFIL_TIPO: Record<TipoCentro, { consultorios: [number, number]; fijos: readonly Servicio[]; probabilidad: number }> = {
  Clínica: { consultorios: [5, 7], fijos: ['Laboratorio', 'Rayos X', 'Procedimientos'], probabilidad: 0.7 },
  'Unidad de urgencias': { consultorios: [3, 5], fijos: ['Laboratorio', 'Procedimientos'], probabilidad: 0.5 },
  'Centro médico': { consultorios: [2, 3], fijos: ['Procedimientos'], probabilidad: 0.35 },
};

/** Centros ficticios de una red simulada: nombres, localidades, posiciones y carga aleatorios. La semilla por defecto
 * produce un ejemplo en el que el centro más cercano al origen simulado no es el de menor total. */
export function generarCentros(semilla = 317, cantidad = 8): CentroRed[] {
  const azar = aleatorio(semilla);
  const localidades = barajar(LOCALIDADES, azar).slice(0, Math.min(cantidad, LOCALIDADES.length));
  const nombres = barajar(NOMBRES, azar);
  return localidades.map((l, i) => {
    const tipo = TIPOS[Math.floor(azar() * TIPOS.length)];
    const perfil = PERFIL_TIPO[tipo];
    const opcionales = SERVICIOS.filter((sv) => !perfil.fijos.includes(sv) && azar() < perfil.probabilidad);
    return {
      id: `RED-${String(i + 1).padStart(2, '0')}`,
      nombre: `${tipo} ${nombres[i % nombres.length]}`,
      tipo,
      localidad: l.nombre,
      posicion: { lat: l.lat + (azar() - 0.5) * 0.012, lon: l.lon + (azar() - 0.5) * 0.012 },
      carga: Math.round((0.2 + azar() * 0.8) * 100) / 100,
      consultorios: perfil.consultorios[0] + Math.floor(azar() * (perfil.consultorios[1] - perfil.consultorios[0] + 1)),
      picos: [8 + Math.floor(azar() * 4), 16 + Math.floor(azar() * 5)] as const,
      servicios: SERVICIOS.filter((sv) => perfil.fijos.includes(sv) || opcionales.includes(sv)),
    };
  });
}

export function dentroDeBogota(p: Punto): boolean {
  return p.lat <= BOGOTA.norte && p.lat >= BOGOTA.sur && p.lon >= BOGOTA.oeste && p.lon <= BOGOTA.este;
}

/** Distancia en línea recta (haversine). */
export function distanciaKm(a: Punto, b: Punto): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** Velocidad media urbana supuesta (km/h) según la hora: horas pico, valle y noche. */
export function velocidadKmH(hora: number): number {
  if ((hora >= 6 && hora < 9) || (hora >= 16 && hora < 20)) return 14;
  if (hora >= 9 && hora < 16) return 22;
  return 32;
}

/** Factor que convierte la línea recta en recorrido por vías. */
export const FACTOR_VIA = 1.35;

/** Minutos estimados en carro: recorrido por vías a la velocidad de la hora, más 3 min de salida y parqueo. */
export function tiempoEnCarro(origen: Punto, destino: Punto, hora: number): number {
  return Math.round(((distanciaKm(origen, destino) * FACTOR_VIA) / velocidadKmH(hora)) * 60 + 3);
}

const ESPERA_BASE: Record<Prioridad, number> = { vital: 0, alta: 15, media: 55, baja: 95 };

export interface Franja {
  nombre: string;
  desde: number;
  hasta: number;
  /** Llegadas a urgencias frente a un día promedio. */
  demanda: number;
}

export const FRANJAS: readonly Franja[] = [
  { nombre: 'Madrugada', desde: 0, hasta: 6, demanda: 0.6 },
  { nombre: 'Mañana', desde: 6, hasta: 10, demanda: 1 },
  { nombre: 'Media mañana', desde: 10, hasta: 13, demanda: 1.2 },
  { nombre: 'Tarde', desde: 13, hasta: 16, demanda: 1 },
  { nombre: 'Tarde-noche', desde: 16, hasta: 22, demanda: 1.3 },
  { nombre: 'Noche', desde: 22, hasta: 24, demanda: 0.85 },
];

export function franjaHoraria(hora: number): Franja {
  return FRANJAS.find((f) => hora >= f.desde && hora < f.hasta) ?? FRANJAS[0];
}

/** Llegadas a urgencias según la franja horaria. */
export function factorDemanda(hora: number): number {
  return franjaHoraria(hora).demanda;
}

const cercania = (hora: number, pico: number) => {
  const d = Math.min(Math.abs(hora - pico), 24 - Math.abs(hora - pico));
  return Math.exp(-(d * d) / 8);
};

/** Ocupación estimada de un centro a una hora: su carga base, la franja y sus propios picos. */
export function ocupacion(centro: CentroRed, hora: number): number {
  const picos = 0.75 + 0.3 * cercania(hora, centro.picos[0]) + 0.4 * cercania(hora, centro.picos[1]);
  return Math.round(Math.min(1.2, Math.max(0.1, centro.carga * picos * factorDemanda(hora))) * 100) / 100;
}

export function textoOcupacion(x: number): string {
  return x >= 1 ? 'saturado' : `ocupación ${Math.round(x * 100)} %`;
}

const SERVICIO_POR_SINTOMA: Record<string, Servicio | undefined> = {
  Fiebre: 'Laboratorio',
  'Dolor abdominal': 'Laboratorio',
  'Golpe o trauma': 'Rayos X',
  Herida: 'Procedimientos',
  'Dificultad leve para respirar': 'Terapia respiratoria',
  'Vómito o diarrea': 'Laboratorio',
};

/** Servicios que probablemente necesitará la atención según el síntoma y el perfil. */
export function serviciosRequeridos(s: Pick<Solicitud, 'sintoma' | 'edad' | 'embarazo'>): Servicio[] {
  const req: Servicio[] = [];
  const porSintoma = SERVICIO_POR_SINTOMA[s.sintoma];
  if (porSintoma) req.push(porSintoma);
  if (s.edad != null && s.edad < 14) req.push('Pediatría');
  if (s.embarazo) req.push('Ginecobstetricia');
  return req;
}

/**
 * Espera estimada desde la llegada hasta la valoración médica (simulada). Depende de la prioridad orientativa,
 * de la ocupación del centro a esa hora, de sus consultorios y de si tiene los servicios que pide el síntoma:
 * si le faltan, se suma el tiempo de gestionar el apoyo o la remisión.
 */
export function esperaEstimada(centro: CentroRed, s: Solicitud, hora: number): number {
  if (s.prioridad === 'vital') return 0;
  const cola = ESPERA_BASE[s.prioridad] * (0.5 + ocupacion(centro, hora) * 1.1) * Math.sqrt(4 / centro.consultorios);
  const requeridos = serviciosRequeridos(s);
  const faltan = requeridos.filter((sv) => !centro.servicios.includes(sv)).length;
  const afinidad = requeridos.length === 0 ? 1 : faltan === 0 ? 0.9 : 1.25;
  return Math.round(cola * afinidad + faltan * 15);
}

/** Alternativas ordenadas por el menor total estimado (desplazamiento + espera). */
export function compararAlternativas(origen: Punto, centros: readonly CentroRed[], s: Solicitud, hora: number): Alternativa[] {
  const requeridos = serviciosRequeridos(s);
  return centros
    .map((centro) => {
      const desplazamiento = tiempoEnCarro(origen, centro.posicion, hora);
      const espera = esperaEstimada(centro, s, hora);
      return {
        centro, distanciaKm: distanciaKm(origen, centro.posicion), desplazamiento, espera, total: desplazamiento + espera,
        ocupacion: ocupacion(centro, hora), faltantes: requeridos.filter((sv) => !centro.servicios.includes(sv)),
      };
    })
    .sort((a, b) => a.total - b.total || a.desplazamiento - b.desplazamiento);
}

export interface HitoRecorrido {
  etiqueta: string;
  minuto: number;
}

/** Línea de tiempo estimada para una alternativa, en minutos desde la salida. */
export function hitosRecorrido(a: Alternativa, prioridad: Prioridad): HitoRecorrido[] {
  const triage = prioridad === 'vital' ? 0 : Math.min(10, Math.max(3, Math.round(a.espera * 0.15)));
  return [
    { etiqueta: 'Salida', minuto: 0 },
    { etiqueta: 'Llegada y turno', minuto: a.desplazamiento },
    { etiqueta: 'Triage (lo asigna un profesional)', minuto: a.desplazamiento + triage },
    { etiqueta: 'Valoración médica estimada', minuto: a.total },
  ];
}

export const SENALES_ALARMA = [
  'Dolor fuerte u opresivo en el pecho',
  'Dificultad grave para respirar',
  'Pérdida de conciencia o convulsión',
  'Sangrado abundante que no se detiene',
  'Debilidad súbita de un lado del cuerpo o dificultad para hablar',
] as const;

export const SINTOMAS = [
  'Fiebre',
  'Dolor abdominal',
  'Golpe o trauma',
  'Herida',
  'Dificultad leve para respirar',
  'Dolor de cabeza',
  'Vómito o diarrea',
  'Otro',
] as const;

export type Duracion = 'horas' | 'dias' | 'semana';

export interface Prediagnostico {
  alarmas: readonly string[];
  sintoma: string;
  dolor: number;
  duracion: Duracion;
  edad: number | null;
  embarazo: boolean;
  condiciones: string;
}

const NIVELES: readonly Prioridad[] = ['baja', 'media', 'alta'];

/**
 * Prioridad orientativa de la demostración. No es un diagnóstico ni reemplaza el triage, que
 * siempre lo asigna un profesional de salud.
 */
export function prioridadOrientativa(p: Prediagnostico): Prioridad {
  if (p.alarmas.length > 0) return 'vital';
  let nivel = p.dolor >= 8 ? 2 : p.dolor >= 4 ? 1 : 0;
  if (p.sintoma === 'Dificultad leve para respirar' || p.sintoma === 'Golpe o trauma') nivel = Math.max(nivel, 1);
  const vulnerable = (p.edad != null && (p.edad < 5 || p.edad >= 65)) || p.embarazo || p.condiciones.trim() !== '';
  if (vulnerable) nivel++;
  if (p.duracion === 'semana' && nivel > 0 && !vulnerable) nivel--;
  return NIVELES[Math.min(nivel, NIVELES.length - 1)];
}

export const ETIQUETA_PRIORIDAD: Record<Prioridad, string> = {
  vital: 'Emergencia: llama al 123',
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
};
