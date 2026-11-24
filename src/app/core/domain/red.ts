/**
 * Visión de red (escenario hipotético): centros ficticios en Bogotá, tiempo estimado en carro y
 * espera estimada. Ningún valor representa tiempos reales ni recomienda una institución.
 */

export interface Punto {
  lat: number;
  lon: number;
}

export type TipoCentro = 'Clínica' | 'Centro médico' | 'Unidad de urgencias';

export interface CentroRed {
  id: string;
  nombre: string;
  tipo: TipoCentro;
  localidad: string;
  posicion: Punto;
  /** Ocupación simulada de urgencias entre 0 y 1. */
  carga: number;
}

export type Prioridad = 'vital' | 'alta' | 'media' | 'baja';

export interface Alternativa {
  centro: CentroRed;
  distanciaKm: number;
  desplazamiento: number;
  espera: number;
  total: number;
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

/** Centros ficticios de una red simulada: nombres, localidades, posiciones y carga aleatorios. La semilla por defecto
 * produce un ejemplo en el que el centro más cercano al origen simulado no es el de menor total. */
export function generarCentros(semilla = 5, cantidad = 8): CentroRed[] {
  const azar = aleatorio(semilla);
  const localidades = barajar(LOCALIDADES, azar).slice(0, Math.min(cantidad, LOCALIDADES.length));
  const nombres = barajar(NOMBRES, azar);
  return localidades.map((l, i) => {
    const tipo = TIPOS[Math.floor(azar() * TIPOS.length)];
    return {
      id: `RED-${String(i + 1).padStart(2, '0')}`,
      nombre: `${tipo} ${nombres[i % nombres.length]}`,
      tipo,
      localidad: l.nombre,
      posicion: { lat: l.lat + (azar() - 0.5) * 0.012, lon: l.lon + (azar() - 0.5) * 0.012 },
      carga: Math.round((0.2 + azar() * 0.8) * 100) / 100,
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

/** Llegadas a urgencias según la hora: mayores a media mañana y en la tarde-noche. */
export function factorDemanda(hora: number): number {
  if (hora >= 10 && hora < 13) return 1.2;
  if (hora >= 16 && hora < 22) return 1.3;
  if (hora < 6) return 0.7;
  return 1;
}

/** Espera estimada desde la llegada hasta la valoración médica (simulada). */
export function esperaEstimada(centro: CentroRed, prioridad: Prioridad, hora: number): number {
  return Math.round(ESPERA_BASE[prioridad] * (0.6 + centro.carga * 1.2) * factorDemanda(hora));
}

/** Alternativas ordenadas por el menor total estimado (desplazamiento + espera). */
export function compararAlternativas(origen: Punto, centros: readonly CentroRed[], prioridad: Prioridad, hora: number): Alternativa[] {
  return centros
    .map((centro) => {
      const desplazamiento = tiempoEnCarro(origen, centro.posicion, hora);
      const espera = esperaEstimada(centro, prioridad, hora);
      return { centro, distanciaKm: Math.round(distanciaKm(origen, centro.posicion) * 10) / 10, desplazamiento, espera, total: desplazamiento + espera };
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
