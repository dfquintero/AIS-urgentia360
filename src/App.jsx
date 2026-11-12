import { useEffect, useState } from 'react'
import Disclaimer from './components/Disclaimer'
import Encabezado from './components/Encabezado'
import { UMBRALES_INICIALES, crearDatosIniciales, crearPaciente } from './data/mockData'
import { registrarEscaneo } from './lib/flujo'
import Acompanantes from './views/Acompanantes'
import Coordinacion from './views/Coordinacion'
import Operacion from './views/Operacion'

const PESTANAS = [
  { id: 'operacion', etiqueta: 'Operación de urgencias', publico: 'Medicina y enfermería' },
  { id: 'coordinacion', etiqueta: 'Coordinación / Indicadores', publico: 'Coordinación' },
  { id: 'acompanantes', etiqueta: 'Acompañantes', publico: 'Sala de espera' },
]

let idEvento = 0

export default function App() {
  const [inicio] = useState(() => crearDatosIniciales(Date.now()))
  const [vista, setVista] = useState('operacion')
  const [ahora, setAhora] = useState(inicio.ahora)
  const [velocidad, setVelocidad] = useState(1)
  const [pacientes, setPacientes] = useState(inicio.activos)
  const [egresados, setEgresados] = useState(inicio.egresados)
  const [umbrales, setUmbrales] = useState(UMBRALES_INICIALES)
  const [bitacora, setBitacora] = useState([])
  const [consecutivo, setConsecutivo] = useState(inicio.siguienteNumero)

  useEffect(() => {
    const id = setInterval(() => setAhora((t) => t + 1000 * velocidad), 1000)
    return () => clearInterval(id)
  }, [velocidad])

  function registrarEvento(turno, evento) {
    idEvento += 1
    setBitacora((b) => [{ id: idEvento, ts: ahora, turno, ...evento }, ...b].slice(0, 50))
  }

  function generarTurno() {
    const paciente = crearPaciente({ numero: consecutivo, ahora })
    setConsecutivo((n) => n + 1)
    setPacientes((lista) => [...lista, paciente])
    registrarEvento(paciente.turno, { tipo: 'turno', texto: `Turno generado en Punto 0 · ${paciente.historial[0].responsable}` })
    return paciente
  }

  function registrar(pacienteId, opciones) {
    const paciente = pacientes.find((p) => p.id === pacienteId)
    if (!paciente) return { error: 'Paciente no encontrado.' }
    const resultado = registrarEscaneo(paciente, { ...opciones, ahora })
    if (resultado.error) return resultado

    if (resultado.egresado) {
      setPacientes((lista) => lista.filter((p) => p.id !== pacienteId))
      setEgresados((lista) => [resultado.paciente, ...lista])
    } else {
      setPacientes((lista) => lista.map((p) => (p.id === pacienteId ? resultado.paciente : p)))
    }
    registrarEvento(paciente.turno, resultado.evento)
    return resultado
  }

  return (
    <div className="min-h-screen">
      <Encabezado
        pestanas={PESTANAS}
        vista={vista}
        onVista={setVista}
        ahora={ahora}
        velocidad={velocidad}
        onVelocidad={setVelocidad}
      />
      <main className="mx-auto max-w-7xl space-y-4 px-4 py-5">
        <Disclaimer />
        {vista === 'operacion' && (
          <Operacion
            pacientes={pacientes}
            ahora={ahora}
            umbrales={umbrales}
            bitacora={bitacora}
            onGenerarTurno={generarTurno}
            onRegistrar={registrar}
          />
        )}
        {vista === 'coordinacion' && (
          <Coordinacion pacientes={pacientes} egresados={egresados} ahora={ahora} umbrales={umbrales} onUmbrales={setUmbrales} />
        )}
        {vista === 'acompanantes' && <Acompanantes pacientes={pacientes} egresados={egresados} />}
      </main>
      <footer className="mx-auto max-w-7xl px-4 pb-6 text-xs text-slate-500">
        Urgentia360 · Prototipo con datos simulados en memoria. Sin backend; la “red interna cifrada” es solo una representación visual.
      </footer>
    </div>
  )
}
