import { ETAPA_POR_ID, TRANSICIONES, nuevoRegistro } from '../data/mockData'

export const registroActual = (paciente) => paciente.historial[paciente.historial.length - 1]

export const etapaActual = (paciente) => registroActual(paciente).etapa

// 'entrada' si el paciente espera ser atendido en su etapa actual, 'salida' si ya está en atención.
export function accionPendiente(paciente) {
  return registroActual(paciente).entrada ? 'salida' : 'entrada'
}

export function opcionesSiguiente(paciente) {
  return TRANSICIONES[etapaActual(paciente)]
}

/**
 * Aplica un escaneo QR a un paciente siguiendo la máquina de estados.
 * Devuelve { paciente, egresado, evento } o { error }.
 */
export function registrarEscaneo(paciente, { ahora, responsable, siguiente, triage }) {
  const actual = registroActual(paciente)
  const etapa = ETAPA_POR_ID[actual.etapa]
  const historial = paciente.historial.slice(0, -1)

  if (!actual.entrada) {
    if (!responsable) return { error: 'Seleccione el responsable que recibe al paciente.' }
    const actualizado = { ...actual, entrada: ahora, responsable }
    return {
      paciente: { ...paciente, historial: [...historial, actualizado] },
      egresado: false,
      evento: { tipo: 'entrada', texto: `Entrada a ${etapa.nombre} · ${responsable}` },
    }
  }

  if (actual.etapa === 'triage' && !triage && !paciente.triage) {
    return { error: 'El triage es obligatorio: registre la clasificación asignada por el profesional antes de continuar.' }
  }

  const cerrado = { ...actual, salida: ahora }

  if (actual.etapa === 'egreso') {
    return {
      paciente: { ...paciente, historial: [...historial, cerrado], egreso: ahora },
      egresado: true,
      evento: { tipo: 'egreso', texto: 'Salida de urgencias · atención finalizada' },
    }
  }

  const permitidas = TRANSICIONES[actual.etapa]
  const destino = siguiente ?? permitidas[0]
  if (!permitidas.includes(destino)) {
    return { error: `Transición no permitida: ${etapa.nombre} → ${ETAPA_POR_ID[destino]?.nombre ?? destino}.` }
  }

  const esRevaloracion = actual.etapa === 'valoracion' && destino === 'valoracion'
  const siguienteRegistro = nuevoRegistro(destino, ahora, {
    revaloracion: esRevaloracion ? actual.revaloracion + 1 : 0,
  })

  return {
    paciente: {
      ...paciente,
      triage: paciente.triage ?? triage ?? null,
      historial: [...historial, cerrado, siguienteRegistro],
    },
    egresado: false,
    evento: {
      tipo: 'salida',
      texto: esRevaloracion
        ? `Salida de ${etapa.nombre} → revaloración #${siguienteRegistro.revaloracion}`
        : `Salida de ${etapa.nombre} → ${ETAPA_POR_ID[destino].nombre}${actual.etapa === 'triage' ? ` (Triage ${paciente.triage ?? triage})` : ''}`,
    },
  }
}
