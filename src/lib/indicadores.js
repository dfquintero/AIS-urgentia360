import { ETAPAS } from '../data/mockData'
import { registroActual } from './flujo'

const MIN = 60000

export function tiempoEnEtapa(paciente, ahora) {
  return Math.max(0, ahora - registroActual(paciente).llegada)
}

export function nivelAlerta(paciente, ahora, umbrales) {
  const { etapa } = registroActual(paciente)
  const minutos = tiempoEnEtapa(paciente, ahora) / MIN
  const u = umbrales[etapa]
  if (minutos >= u.rojo) return 'rojo'
  if (minutos >= u.amarillo) return 'amarillo'
  return 'ok'
}

export function formatoDuracion(ms) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const dos = (n) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${dos(m)}:${dos(s)}` : `${dos(m)}:${dos(s)}`
}

export function formatoHora(ts) {
  return new Date(ts).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

const redondear = (n) => Math.round(n * 10) / 10

// Promedio de espera (llegada → entrada) y atención (entrada → salida) por etapa, en minutos.
export function promediosPorEtapa(activos, egresados, ahora) {
  const acumulado = Object.fromEntries(ETAPAS.map((e) => [e.id, { espera: 0, atencion: 0, n: 0 }]))
  for (const p of [...activos, ...egresados]) {
    for (const r of p.historial) {
      const a = acumulado[r.etapa]
      a.espera += ((r.entrada ?? ahora) - r.llegada) / MIN
      a.atencion += r.entrada ? ((r.salida ?? ahora) - r.entrada) / MIN : 0
      a.n += 1
    }
  }
  return ETAPAS.map((e) => {
    const a = acumulado[e.id]
    const espera = a.n ? redondear(a.espera / a.n) : 0
    const atencion = a.n ? redondear(a.atencion / a.n) : 0
    return { id: e.id, etapa: e.corto, nombre: e.nombre, espera, atencion, total: redondear(espera + atencion), n: a.n }
  })
}

export function cuelloDeBotella(promedios) {
  return promedios.filter((p) => p.n > 0).reduce((max, p) => (!max || p.espera > max.espera ? p : max), null)
}

export function estadoPublico(paciente) {
  const r = registroActual(paciente)
  if (r.etapa === 'ayudas') return 'En ayudas diagnósticas'
  if (r.etapa === 'egreso') return 'En proceso de salida'
  if (!r.entrada || r.etapa === 'punto0') return 'En espera'
  if (r.etapa === 'admision') return 'En admisión'
  return 'En valoración'
}
