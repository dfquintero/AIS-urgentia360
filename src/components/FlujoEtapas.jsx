import { ETAPAS } from '../data/mockData'
import { registroActual } from '../lib/flujo'
import { nivelAlerta } from '../lib/indicadores'
import { IconoFlecha } from './Iconos'

export default function FlujoEtapas({ pacientes, ahora, umbrales }) {
  const conteo = Object.fromEntries(ETAPAS.map((e) => [e.id, { total: 0, amarillo: 0, rojo: 0 }]))
  for (const p of pacientes) {
    const c = conteo[registroActual(p).etapa]
    c.total += 1
    const n = nivelAlerta(p, ahora, umbrales)
    if (n !== 'ok') c[n] += 1
  }

  return (
    <div className="overflow-x-auto">
      <ol className="flex min-w-max items-stretch gap-1">
        {ETAPAS.map((e, i) => {
          const c = conteo[e.id]
          const borde = c.rojo ? 'border-red-300 bg-red-50' : c.amarillo ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-white'
          return (
            <li key={e.id} className="flex items-center gap-1">
              <div className={`w-32 rounded-lg border px-3 py-2 ${borde}`}>
                <p className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  {i}. {e.corto}
                  {e.obligatoria && <span className="rounded bg-slate-800 px-1 text-[9px] text-white">OBLIG.</span>}
                </p>
                <p className="text-2xl font-bold text-slate-900">{c.total}</p>
                <p className="text-[11px] text-slate-500">
                  {c.amarillo > 0 && <span className="text-amber-700">{c.amarillo} alerta </span>}
                  {c.rojo > 0 && <span className="text-red-700">{c.rojo} crítico</span>}
                  {c.amarillo + c.rojo === 0 && 'Sin alertas'}
                </p>
              </div>
              {i < ETAPAS.length - 1 && <IconoFlecha className="h-4 w-4 shrink-0 text-slate-400" />}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
