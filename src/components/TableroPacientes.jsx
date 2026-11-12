import { useMemo, useState } from 'react'
import { ETAPAS, ETAPA_POR_ID } from '../data/mockData'
import { registroActual } from '../lib/flujo'
import { formatoDuracion, nivelAlerta, tiempoEnEtapa } from '../lib/indicadores'
import { InsigniaAlerta, InsigniaTriage } from './Insignias'
import Tarjeta from './Tarjeta'

const PESO = { rojo: 2, amarillo: 1, ok: 0 }
const FILA = {
  ok: '',
  amarillo: 'bg-amber-50/70 border-l-4 border-l-amber-400',
  rojo: 'bg-red-50/80 border-l-4 border-l-red-500',
}

export default function TableroPacientes({ pacientes, ahora, umbrales, onSeleccionar }) {
  const [filtroEtapa, setFiltroEtapa] = useState('todas')
  const [soloAlertas, setSoloAlertas] = useState(false)

  const filas = useMemo(() => {
    return pacientes
      .map((p) => ({ p, r: registroActual(p), nivel: nivelAlerta(p, ahora, umbrales), tiempo: tiempoEnEtapa(p, ahora) }))
      .filter((f) => filtroEtapa === 'todas' || f.r.etapa === filtroEtapa)
      .filter((f) => !soloAlertas || f.nivel !== 'ok')
      .sort((a, b) => PESO[b.nivel] - PESO[a.nivel] || b.tiempo - a.tiempo)
  }, [pacientes, ahora, umbrales, filtroEtapa, soloAlertas])

  return (
    <Tarjeta
      titulo={`Pacientes activos (${pacientes.length})`}
      subtitulo="Tiempo en etapa = desde la llegada a la etapa (espera + atención). Clic en una fila para cargarla en el escáner."
      acciones={
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={filtroEtapa}
            onChange={(e) => setFiltroEtapa(e.target.value)}
            aria-label="Filtrar por etapa"
            className="rounded-md border border-slate-300 px-2 py-1"
          >
            <option value="todas">Todas las etapas</option>
            {ETAPAS.map((e) => (
              <option key={e.id} value={e.id}>
                {e.corto}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={soloAlertas} onChange={(e) => setSoloAlertas(e.target.checked)} className="accent-teal-700" />
            Solo en alerta
          </label>
        </div>
      }
    >
      <div className="-mx-4 -my-4 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">Turno</th>
              <th className="px-4 py-2 font-medium">Paciente</th>
              <th className="px-4 py-2 font-medium">Servicio</th>
              <th className="px-4 py-2 font-medium">Etapa actual</th>
              <th className="px-4 py-2 font-medium">Responsable</th>
              <th className="px-4 py-2 text-right font-medium">Tiempo en etapa</th>
              <th className="px-4 py-2 font-medium">Alerta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filas.map(({ p, r, nivel, tiempo }) => {
              const u = umbrales[r.etapa]
              return (
                <tr key={p.id} onClick={() => onSeleccionar?.(p)} className={`cursor-pointer hover:bg-slate-50 ${FILA[nivel]}`}>
                  <td className="whitespace-nowrap px-4 py-2">
                    <div className="font-mono font-semibold">{p.turno}</div>
                    <InsigniaTriage nivel={p.triage} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-2">
                    <div>{p.nombre}</div>
                    <div className="text-xs text-slate-500">{p.edad} años</div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-slate-600">{p.servicio}</td>
                  <td className="whitespace-nowrap px-4 py-2">
                    <div className="font-medium">
                      {ETAPA_POR_ID[r.etapa].corto}
                      {r.revaloracion > 0 && <span className="ml-1 text-xs text-violet-700">(reval. #{r.revaloracion})</span>}
                    </div>
                    <div className="text-xs text-slate-500">
                      {r.entrada ? 'En atención' : 'En espera'} · {r.area}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-slate-600">{r.responsable ?? <span className="text-slate-400">Por asignar</span>}</td>
                  <td className="whitespace-nowrap px-4 py-2 text-right">
                    <div className="font-mono font-semibold tabular-nums">{formatoDuracion(tiempo)}</div>
                    <div className="text-[11px] text-slate-400">
                      umbral {u.amarillo}/{u.rojo} min
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2">
                    <InsigniaAlerta nivel={nivel} />
                  </td>
                </tr>
              )
            })}
            {filas.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  No hay pacientes para el filtro seleccionado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Tarjeta>
  )
}
