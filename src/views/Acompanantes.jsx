import { useState } from 'react'
import { IconoBuscar, IconoCandado } from '../components/Iconos'
import { estadoPublico } from '../lib/indicadores'

const ESTILO_ESTADO = {
  'En espera': 'bg-slate-700 text-slate-100',
  'En admisión': 'bg-sky-700 text-white',
  'En valoración': 'bg-teal-600 text-white',
  'En ayudas diagnósticas': 'bg-violet-600 text-white',
  'En proceso de salida': 'bg-emerald-600 text-white',
}

export default function Acompanantes({ pacientes, egresados }) {
  const [busqueda, setBusqueda] = useState('')
  const [resultado, setResultado] = useState(null)

  const turnos = [...pacientes].sort((a, b) => a.turno.localeCompare(b.turno))

  function buscar(e) {
    e.preventDefault()
    const c = busqueda.trim().toUpperCase().replace(/^U-?/, '')
    if (!c) return
    const codigo = `U-${c.padStart(3, '0')}`
    const activo = pacientes.find((p) => p.turno === codigo)
    if (activo) return setResultado({ codigo, estado: estadoPublico(activo) })
    if (egresados.some((p) => p.turno === codigo)) return setResultado({ codigo, estado: 'Atención finalizada' })
    setResultado({ codigo, estado: null })
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <section className="min-w-0 overflow-hidden rounded-2xl bg-slate-900 text-white shadow-lg lg:col-span-2">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700 px-5 py-4">
          <div>
            <h2 className="text-xl font-bold">Sala de espera · Urgencias</h2>
            <p className="text-sm text-slate-400">Consulte el estado con el código de su turno</p>
          </div>
          <span className="text-xs text-slate-400">{turnos.length} turnos en curso</span>
        </header>
        <ul className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3 xl:grid-cols-4">
          {turnos.map((p) => {
            const estado = estadoPublico(p)
            return (
              <li key={p.id} className="rounded-xl bg-slate-800 p-3 text-center">
                <p className="font-mono text-2xl font-bold tracking-wider">{p.turno}</p>
                <p className={`mt-2 rounded-md px-2 py-1 text-xs font-medium ${ESTILO_ESTADO[estado]}`}>{estado}</p>
              </li>
            )
          })}
        </ul>
        <footer className="border-t border-slate-700 px-5 py-3 text-xs text-slate-400">
          Por privacidad solo se muestra el código de turno y un estado general. La información clínica la entrega
          exclusivamente el personal de salud. El orden de atención depende de la clasificación de triage, no del número de turno.
        </footer>
      </section>

      <section aria-label="Consulta móvil" className="mx-auto w-full max-w-xs">
        <div className="rounded-[2.5rem] border-8 border-slate-800 bg-white p-4 shadow-xl">
          <div className="mx-auto mb-4 h-1.5 w-16 rounded-full bg-slate-300" />
          <p className="text-center text-xs font-semibold uppercase tracking-wide text-teal-700">Urgentia360 · Acompañantes</p>
          <h2 className="mt-1 text-center text-lg font-bold text-slate-900">Estado de su turno</h2>
          <form onSubmit={buscar} className="mt-4 flex gap-2">
            <label htmlFor="buscar-turno" className="sr-only">
              Código de turno
            </label>
            <input
              id="buscar-turno"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Ej: U-021"
              inputMode="text"
              className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm uppercase focus:border-teal-600 focus:outline-none"
            />
            <button type="submit" aria-label="Buscar" className="rounded-lg bg-teal-700 px-3 text-white hover:bg-teal-800">
              <IconoBuscar className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-4 min-h-[8rem]">
            {resultado ? (
              resultado.estado ? (
                <div className="rounded-xl bg-slate-50 p-4 text-center ring-1 ring-slate-200">
                  <p className="font-mono text-3xl font-bold">{resultado.codigo}</p>
                  <p
                    className={`mx-auto mt-2 inline-block rounded-md px-3 py-1 text-sm font-medium ${
                      ESTILO_ESTADO[resultado.estado] ?? 'bg-slate-200 text-slate-800'
                    }`}
                  >
                    {resultado.estado}
                  </p>
                  <p className="mt-3 text-xs text-slate-500">Para información clínica acérquese al puesto de información.</p>
                </div>
              ) : (
                <p className="rounded-xl bg-amber-50 p-4 text-center text-sm text-amber-900">
                  No encontramos el turno <span className="font-mono font-semibold">{resultado.codigo}</span>. Verifique el código impreso en su ficho.
                </p>
              )
            ) : (
              <p className="text-center text-sm text-slate-500">Ingrese el código de turno impreso en el ficho entregado en Punto 0.</p>
            )}
          </div>

          <p className="mt-4 flex items-center justify-center gap-1 text-[11px] text-slate-400">
            <IconoCandado className="h-3 w-3" /> Consulta limitada · sin datos clínicos
          </p>
          <div className="mx-auto mt-4 h-1 w-24 rounded-full bg-slate-300" />
        </div>
      </section>
    </div>
  )
}
