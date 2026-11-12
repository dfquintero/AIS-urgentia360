// Datos 100 % simulados. No corresponden a personas reales.

export const ETAPAS = [
  { id: 'punto0', nombre: 'Punto 0 · Generación de turno', corto: 'Punto 0', area: 'Recepción / Digiturno', rol: 'digiturno' },
  { id: 'triage', nombre: 'Triage', corto: 'Triage', area: 'Consultorio de triage', rol: 'enfermeria', obligatoria: true },
  { id: 'admision', nombre: 'Admisión', corto: 'Admisión', area: 'Ventanilla de admisiones', rol: 'admisiones' },
  { id: 'consulta', nombre: 'Consulta', corto: 'Consulta', area: 'Consultorios de urgencias', rol: 'medico' },
  { id: 'ayudas', nombre: 'Ayudas diagnósticas', corto: 'Ayudas Dx', area: 'Laboratorio / Imágenes', rol: 'ayudas' },
  { id: 'valoracion', nombre: 'Valoración / Observación', corto: 'Valoración', area: 'Sala de observación', rol: 'medico' },
  { id: 'egreso', nombre: 'Egreso', corto: 'Egreso', area: 'Salida / Facturación', rol: 'admisiones' },
]

export const ETAPA_POR_ID = Object.fromEntries(ETAPAS.map((e) => [e.id, e]))

// Máquina de estados: transiciones permitidas desde cada etapa.
// El triage no se puede omitir: Punto 0 solo conduce a Triage.
export const TRANSICIONES = {
  punto0: ['triage'],
  triage: ['admision'],
  admision: ['consulta'],
  consulta: ['ayudas', 'valoracion'],
  ayudas: ['valoracion'],
  valoracion: ['egreso', 'valoracion'],
  egreso: [],
}

export const ETIQUETA_TRANSICION = {
  'consulta>ayudas': 'Ayudas diagnósticas',
  'consulta>valoracion': 'Pasar directo a valoración / observación',
  'valoracion>egreso': 'Egreso',
  'valoracion>valoracion': 'Revaloración (permanece en observación)',
}

// Umbrales de alerta en minutos de permanencia en la etapa (espera + atención).
export const UMBRALES_INICIALES = {
  punto0: { amarillo: 5, rojo: 10 },
  triage: { amarillo: 15, rojo: 30 },
  admision: { amarillo: 15, rojo: 30 },
  consulta: { amarillo: 45, rojo: 90 },
  ayudas: { amarillo: 60, rojo: 120 },
  valoracion: { amarillo: 120, rojo: 240 },
  egreso: { amarillo: 20, rojo: 40 },
}

export const PERSONAL = {
  digiturno: ['Digiturno · Kiosko 1', 'Digiturno · Kiosko 2'],
  enfermeria: ['Enf. Laura Gómez', 'Enf. Andrés Rojas', 'Enf. Paola Castillo', 'Enf. Julián Mejía'],
  admisiones: ['Aux. Carolina Díaz', 'Aux. Mateo Herrera', 'Aux. Sofía Vargas'],
  medico: ['Dr. Felipe Ramírez', 'Dra. Natalia Ospina', 'Dr. Camilo Torres', 'Dra. Valentina Ruiz', 'Dr. Sergio Peña'],
  ayudas: ['Bact. Diana Moreno', 'Tec. Rx Juan Pardo', 'Bact. Esteban Ríos'],
}

export const SERVICIOS = [
  'Medicina general',
  'Pediatría',
  'Ortopedia',
  'Ginecobstetricia',
  'Cirugía general',
  'Medicina interna',
]

// Clasificación de triage (I a V). La asigna siempre el profesional de salud.
export const NIVELES_TRIAGE = [
  { id: 'I', nombre: 'Triage I', clase: 'bg-red-600 text-white' },
  { id: 'II', nombre: 'Triage II', clase: 'bg-orange-500 text-white' },
  { id: 'III', nombre: 'Triage III', clase: 'bg-yellow-400 text-yellow-950' },
  { id: 'IV', nombre: 'Triage IV', clase: 'bg-green-600 text-white' },
  { id: 'V', nombre: 'Triage V', clase: 'bg-blue-600 text-white' },
]

const NOMBRES = [
  'Ana M. Pérez', 'Luis F. Castro', 'Marta L. Suárez', 'Jorge E. Ruiz', 'Daniela P. León',
  'Carlos A. Niño', 'Isabel C. Duarte', 'Ricardo J. Silva', 'Lucía R. Mora', 'Tomás D. Cruz',
  'Gloria E. Pineda', 'Héctor M. Salazar', 'Camila S. Ortiz', 'Fernando L. Vega', 'Rosa I. Cárdenas',
  'Miguel Á. Rincón', 'Patricia V. Lozano', 'Samuel O. Acosta', 'Elena B. Quintana', 'Óscar H. Medina',
  'Juliana T. Bernal', 'Andrés F. Gil', 'Beatriz N. Arias', 'David R. Prieto', 'Valeria J. Mendoza',
]

const MIN = 60000

// Rangos típicos simulados (minutos) de espera y atención por etapa.
const DURACIONES = {
  punto0: { espera: [0, 0], atencion: [1, 4] },
  triage: { espera: [3, 15], atencion: [3, 8] },
  admision: { espera: [4, 18], atencion: [3, 8] },
  consulta: { espera: [15, 55], atencion: [10, 20] },
  ayudas: { espera: [10, 35], atencion: [20, 60] },
  valoracion: { espera: [5, 20], atencion: [30, 120] },
  egreso: { espera: [5, 15], atencion: [5, 10] },
}

export function crearAleatorio(semilla = 360) {
  let s = semilla >>> 0
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 4294967296
  }
}

export const elegir = (lista, rand = Math.random) => lista[Math.floor(rand() * lista.length)]
const entre = ([a, b], rand) => a + rand() * (b - a)

export function codigoTurno(numero) {
  return `U-${String(numero).padStart(3, '0')}`
}

export function generarQR(turno, rand = Math.random) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let token = ''
  for (let i = 0; i < 4; i++) token += chars[Math.floor(rand() * chars.length)]
  return `QR-${turno.replace('-', '')}-${token}`
}

export function nuevoRegistro(etapa, llegada, extra = {}) {
  return {
    etapa,
    area: ETAPA_POR_ID[etapa].area,
    llegada,
    entrada: null,
    salida: null,
    responsable: null,
    revaloracion: 0,
    ...extra,
  }
}

export function crearPaciente({ numero, ahora, rand = Math.random, nombre, servicio, edad }) {
  const turno = codigoTurno(numero)
  return {
    id: `pac-${numero}`,
    turno,
    qr: generarQR(turno, rand),
    nombre: nombre ?? NOMBRES[(numero * 7) % NOMBRES.length],
    edad: edad ?? Math.floor(1 + rand() * 88),
    servicio: servicio ?? elegir(SERVICIOS, rand),
    triage: null,
    historial: [
      nuevoRegistro('punto0', ahora, { entrada: ahora, responsable: elegir(PERSONAL.digiturno, rand) }),
    ],
  }
}

function rutaHasta(etapaObjetivo, conAyudas) {
  const ruta = ['punto0', 'triage', 'admision', 'consulta']
  if (conAyudas) ruta.push('ayudas')
  ruta.push('valoracion', 'egreso')
  return ruta.slice(0, ruta.indexOf(etapaObjetivo) + 1)
}

// Construye un historial hacia atrás desde "fin", terminando en la etapa objetivo.
function construirHistorial({ etapaObjetivo, enAtencion, minutosEnEtapa, fin, rand, finalizado = false }) {
  const conAyudas = etapaObjetivo === 'ayudas' || rand() < 0.65
  const ruta = rutaHasta(etapaObjetivo, conAyudas)
  const historial = []
  let t = fin

  const ultima = ruta[ruta.length - 1]
  if (finalizado) {
    const d = DURACIONES[ultima]
    const salida = t
    const entrada = salida - entre(d.atencion, rand) * MIN
    const llegada = entrada - entre(d.espera, rand) * MIN
    historial.unshift(nuevoRegistro(ultima, llegada, { entrada, salida, responsable: elegir(PERSONAL[ETAPA_POR_ID[ultima].rol], rand) }))
    t = llegada
  } else {
    const llegada = t - minutosEnEtapa * MIN
    const reg = nuevoRegistro(ultima, llegada)
    if (enAtencion || ultima === 'punto0') {
      reg.entrada = llegada + Math.min(minutosEnEtapa * 0.4, entre(DURACIONES[ultima].espera, rand)) * MIN
      reg.responsable = elegir(PERSONAL[ETAPA_POR_ID[ultima].rol], rand)
    }
    historial.unshift(reg)
    t = llegada
  }

  for (let i = ruta.length - 2; i >= 0; i--) {
    const etapa = ruta[i]
    const d = DURACIONES[etapa]
    const salida = t
    const entrada = salida - entre(d.atencion, rand) * MIN
    const llegada = entrada - entre(d.espera, rand) * MIN
    historial.unshift(nuevoRegistro(etapa, llegada, { entrada, salida, responsable: elegir(PERSONAL[ETAPA_POR_ID[etapa].rol], rand) }))
    t = llegada
  }
  return historial
}

// [etapa, en atención, minutos en la etapa actual]
const ESCENARIO_ACTIVOS = [
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
]

export function crearDatosIniciales(ahora) {
  const rand = crearAleatorio(2024)
  const triageAleatorio = () => elegir(['II', 'III', 'III', 'III', 'IV', 'IV', 'V'], rand)
  let numero = 1

  const egresados = []
  for (let i = 0; i < 12; i++) {
    const p = crearPaciente({ numero: numero++, ahora, rand })
    p.historial = construirHistorial({
      etapaObjetivo: 'egreso',
      fin: ahora - (20 + i * 22) * MIN,
      rand,
      finalizado: true,
    })
    p.triage = triageAleatorio()
    p.egreso = p.historial[p.historial.length - 1].salida
    egresados.push(p)
  }

  const activos = ESCENARIO_ACTIVOS.map(([etapa, enAtencion, minutos]) => {
    const p = crearPaciente({ numero: numero++, ahora, rand })
    p.historial = construirHistorial({ etapaObjetivo: etapa, enAtencion, minutosEnEtapa: minutos, fin: ahora, rand })
    const idxTriage = p.historial.findIndex((r) => r.etapa === 'triage')
    if (idxTriage >= 0 && p.historial[idxTriage].salida) p.triage = triageAleatorio()
    return p
  })

  // Un paciente en revaloración para ilustrar el ciclo opcional.
  const enObs = activos.find((p) => p.historial.at(-1).etapa === 'valoracion' && p.historial.at(-1).entrada)
  if (enObs) {
    const actual = enObs.historial.at(-1)
    const previo = nuevoRegistro('valoracion', actual.llegada - 70 * MIN, {
      entrada: actual.llegada - 62 * MIN,
      salida: actual.llegada,
      responsable: elegir(PERSONAL.medico, rand),
    })
    const ayudasPrevias = enObs.historial.slice(0, -1)
    const desplazamiento = 70 * MIN
    ayudasPrevias.forEach((r) => {
      r.llegada -= desplazamiento
      if (r.entrada) r.entrada -= desplazamiento
      if (r.salida) r.salida -= desplazamiento
    })
    enObs.historial = [...ayudasPrevias, previo, { ...actual, revaloracion: 1 }]
  }

  return { ahora, activos, egresados, siguienteNumero: numero }
}
