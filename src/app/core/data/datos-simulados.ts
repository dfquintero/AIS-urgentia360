// Datos 100 % simulados. No corresponden a personas reales.
import { EtapaId, NivelTriageId, Paciente, RegistroEtapa } from '../models/urgencias.models';
import { ETAPA_POR_ID, PERSONAL, SERVICIOS } from './catalogos';

const MIN = 60_000;

const NOMBRES = [
  'Ana M. Pérez', 'Luis F. Castro', 'Marta L. Suárez', 'Jorge E. Ruiz', 'Daniela P. León',
  'Carlos A. Niño', 'Isabel C. Duarte', 'Ricardo J. Silva', 'Lucía R. Mora', 'Tomás D. Cruz',
  'Gloria E. Pineda', 'Héctor M. Salazar', 'Camila S. Ortiz', 'Fernando L. Vega', 'Rosa I. Cárdenas',
  'Miguel Á. Rincón', 'Patricia V. Lozano', 'Samuel O. Acosta', 'Elena B. Quintana', 'Óscar H. Medina',
  'Juliana T. Bernal', 'Andrés F. Gil', 'Beatriz N. Arias', 'David R. Prieto', 'Valeria J. Mendoza',
];

type Rango = readonly [number, number];

// Rangos simulados (minutos) de espera y atención por etapa.
const DURACIONES: Record<EtapaId, { espera: Rango; atencion: Rango }> = {
  punto0: { espera: [0, 0], atencion: [1, 4] },
  triage: { espera: [3, 15], atencion: [3, 8] },
  admision: { espera: [4, 18], atencion: [3, 8] },
  consulta: { espera: [15, 55], atencion: [10, 20] },
  ayudas: { espera: [10, 35], atencion: [20, 60] },
  valoracion: { espera: [5, 20], atencion: [30, 120] },
  egreso: { espera: [5, 15], atencion: [5, 10] },
};

export type Aleatorio = () => number;

export function crearAleatorio(semilla = 360): Aleatorio {
  let s = semilla >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export const elegir = <T>(lista: readonly T[], rand: Aleatorio = Math.random): T =>
  lista[Math.floor(rand() * lista.length)];

const entre = ([a, b]: Rango, rand: Aleatorio) => a + rand() * (b - a);

export const codigoTurno = (numero: number) => `U-${String(numero).padStart(3, '0')}`;

export function generarQR(turno: string, rand: Aleatorio = Math.random): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let token = '';
  for (let i = 0; i < 4; i++) token += chars[Math.floor(rand() * chars.length)];
  return `QR-${turno.replace('-', '')}-${token}`;
}

export function nuevoRegistro(
  etapa: EtapaId,
  llegada: number,
  extra: Partial<RegistroEtapa> = {},
): RegistroEtapa {
  return {
    etapa,
    area: ETAPA_POR_ID[etapa].area,
    llegada,
    entrada: null,
    salida: null,
    responsable: null,
    revaloracion: 0,
    ...extra,
  };
}

export function crearPaciente(numero: number, ahora: number, rand: Aleatorio = Math.random): Paciente {
  const turno = codigoTurno(numero);
  return {
    id: `pac-${numero}`,
    turno,
    qr: generarQR(turno, rand),
    nombre: NOMBRES[(numero * 7) % NOMBRES.length],
    edad: Math.floor(1 + rand() * 88),
    servicio: elegir(SERVICIOS, rand),
    triage: null,
    historial: [
      nuevoRegistro('punto0', ahora, { entrada: ahora, responsable: elegir(PERSONAL.digiturno, rand) }),
    ],
  };
}

function rutaHasta(objetivo: EtapaId, conAyudas: boolean): EtapaId[] {
  const ruta: EtapaId[] = ['punto0', 'triage', 'admision', 'consulta'];
  if (conAyudas) ruta.push('ayudas');
  ruta.push('valoracion', 'egreso');
  return ruta.slice(0, ruta.indexOf(objetivo) + 1);
}

const responsableDe = (etapa: EtapaId, rand: Aleatorio) => elegir(PERSONAL[ETAPA_POR_ID[etapa].rol], rand);

function registroCerrado(etapa: EtapaId, salida: number, rand: Aleatorio): RegistroEtapa {
  const d = DURACIONES[etapa];
  const entrada = salida - entre(d.atencion, rand) * MIN;
  const llegada = entrada - entre(d.espera, rand) * MIN;
  return nuevoRegistro(etapa, llegada, { entrada, salida, responsable: responsableDe(etapa, rand) });
}

interface OpcionesHistorial {
  objetivo: EtapaId;
  fin: number;
  rand: Aleatorio;
  enAtencion?: boolean;
  minutosEnEtapa?: number;
  finalizado?: boolean;
}

// Construye el historial hacia atrás desde `fin`, terminando en la etapa objetivo.
function construirHistorial(o: OpcionesHistorial): RegistroEtapa[] {
  const ruta = rutaHasta(o.objetivo, o.objetivo === 'ayudas' || o.rand() < 0.65);
  const ultima = ruta[ruta.length - 1];
  const historial: RegistroEtapa[] = [];

  if (o.finalizado) {
    historial.push(registroCerrado(ultima, o.fin, o.rand));
  } else {
    const minutos = o.minutosEnEtapa ?? 0;
    const reg = nuevoRegistro(ultima, o.fin - minutos * MIN);
    if (o.enAtencion || ultima === 'punto0') {
      reg.entrada = reg.llegada + Math.min(minutos * 0.4, entre(DURACIONES[ultima].espera, o.rand)) * MIN;
      reg.responsable = responsableDe(ultima, o.rand);
    }
    historial.push(reg);
  }

  for (let i = ruta.length - 2; i >= 0; i--) {
    historial.unshift(registroCerrado(ruta[i], historial[0].llegada, o.rand));
  }
  return historial;
}

// [etapa, en atención, minutos en la etapa actual]
const ESCENARIO_ACTIVOS: readonly [EtapaId, boolean, number][] = [
  ['punto0', true, 2],
  ['punto0', true, 7],
  ['triage', false, 6],
  ['triage', true, 18],
  ['admision', false, 9],
  ['admision', true, 34],
  ['consulta', false, 25],
  ['consulta', false, 58],
  ['consulta', true, 97],
  ['consulta', false, 12],
  ['ayudas', false, 40],
  ['ayudas', true, 75],
  ['ayudas', true, 130],
  ['valoracion', true, 65],
  ['valoracion', true, 150],
  ['valoracion', false, 18],
  ['egreso', false, 8],
  ['egreso', true, 26],
];

export interface DatosIniciales {
  activos: Paciente[];
  egresados: Paciente[];
  siguienteNumero: number;
}

export function crearDatosIniciales(ahora: number): DatosIniciales {
  const rand = crearAleatorio(2024);
  const triageAleatorio = () =>
    elegir<NivelTriageId>(['II', 'III', 'III', 'III', 'IV', 'IV', 'V'], rand);
  let numero = 1;

  const egresados: Paciente[] = [];
  for (let i = 0; i < 12; i++) {
    const p = crearPaciente(numero++, ahora, rand);
    p.historial = construirHistorial({ objetivo: 'egreso', fin: ahora - (20 + i * 22) * MIN, rand, finalizado: true });
    p.triage = triageAleatorio();
    p.egreso = p.historial[p.historial.length - 1].salida ?? undefined;
    egresados.push(p);
  }

  const activos = ESCENARIO_ACTIVOS.map(([objetivo, enAtencion, minutosEnEtapa]) => {
    const p = crearPaciente(numero++, ahora, rand);
    p.historial = construirHistorial({ objetivo, enAtencion, minutosEnEtapa, fin: ahora, rand });
    if (p.historial.some((r) => r.etapa === 'triage' && r.salida)) p.triage = triageAleatorio();
    return p;
  });

  // Un paciente en revaloración para ilustrar el ciclo opcional.
  const enObs = activos.find((p) => {
    const ultimo = p.historial[p.historial.length - 1];
    return ultimo.etapa === 'valoracion' && ultimo.entrada;
  });
  if (enObs) {
    const actual = enObs.historial[enObs.historial.length - 1];
    const desplazamiento = 70 * MIN;
    const previos = enObs.historial.slice(0, -1).map((r) => ({
      ...r,
      llegada: r.llegada - desplazamiento,
      entrada: r.entrada && r.entrada - desplazamiento,
      salida: r.salida && r.salida - desplazamiento,
    }));
    const valoracionPrevia = nuevoRegistro('valoracion', actual.llegada - desplazamiento, {
      entrada: actual.llegada - 62 * MIN,
      salida: actual.llegada,
      responsable: elegir(PERSONAL.medico, rand),
    });
    enObs.historial = [...previos, valoracionPrevia, { ...actual, revaloracion: 1 }];
  }

  return { activos, egresados, siguienteNumero: numero };
}
