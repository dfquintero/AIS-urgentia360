import { ETAPAS, UMBRALES_INICIALES } from '../data/mockData'
import Tarjeta from './Tarjeta'

const MAX = 300

export default function PanelUmbrales({ umbrales, onCambiar }) {
  function actualizar(etapa, campo, valor) {
    const v = Math.max(1, Math.min(MAX, Number(valor) || 1))
    const actual = umbrales[etapa]
    let siguiente = { ...actual, [campo]: v }
    if (campo === 'amarillo' && v >= actual.rojo) siguiente.rojo = Math.min(MAX, v + 1)
    if (campo === 'rojo' && v <= actual.amarillo) siguiente.amarillo = Math.max(1, v - 1)
    if (siguiente.rojo <= siguiente.amarillo) siguiente = { amarillo: siguiente.rojo - 1, rojo: siguiente.rojo }
    onCambiar({ ...umbrales, [etapa]: siguiente })
  }

  return (
    <Tarjeta
      titulo="Umbrales de alerta por etapa"
      subtitulo="Minutos de permanencia en la etapa. Los cambios se aplican de inmediato al tablero de Operación."
      acciones={
        <button
          type="button"
          onClick={() => onCambiar(UMBRALES_INICIALES)}
          className="rounded-md px-2 py-1 text-xs font-medium text-teal-700 ring-1 ring-teal-200 hover:bg-teal-50"
        >
          Restaurar valores
        </button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {ETAPAS.map((e) => {
          const u = umbrales[e.id]
          return (
            <div key={e.id} className="rounded-lg border border-slate-200 p-3">
              <p className="text-sm font-semibold text-slate-800">{e.nombre}</p>
              {[
                ['amarillo', 'Alerta (amarillo)', 'accent-amber-500', 'text-amber-700'],
                ['rojo', 'Crítico (rojo)', 'accent-red-600', 'text-red-700'],
              ].map(([campo, etiqueta, acento, color]) => (
                <div key={campo} className="mt-2">
                  <div className="flex items-center justify-between text-xs">
                    <label htmlFor={`${e.id}-${campo}`} className={`font-medium ${color}`}>
                      {etiqueta}
                    </label>
                    <span className="flex items-center gap-1">
                      <input
                        type="number"
                        min={1}
                        max={MAX}
                        value={u[campo]}
                        onChange={(ev) => actualizar(e.id, campo, ev.target.value)}
                        aria-label={`${etiqueta} ${e.corto} en minutos`}
                        className="w-16 rounded border border-slate-300 px-1.5 py-0.5 text-right text-xs"
                      />
                      min
                    </span>
                  </div>
                  <input
                    id={`${e.id}-${campo}`}
                    type="range"
                    min={1}
                    max={MAX}
                    value={u[campo]}
                    onChange={(ev) => actualizar(e.id, campo, ev.target.value)}
                    className={`mt-1 w-full ${acento}`}
                  />
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </Tarjeta>
  )
}
