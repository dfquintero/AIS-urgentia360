import { NIVELES_TRIAGE } from '../data/mockData'

const ALERTA = {
  ok: { texto: 'En tiempo', clase: 'bg-emerald-100 text-emerald-800 ring-emerald-200' },
  amarillo: { texto: 'Alerta', clase: 'bg-amber-100 text-amber-900 ring-amber-300' },
  rojo: { texto: 'Crítico', clase: 'bg-red-100 text-red-800 ring-red-300' },
}

export function InsigniaAlerta({ nivel }) {
  const a = ALERTA[nivel]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${a.clase}`}>
      <span
        className={`h-1.5 w-1.5 rounded-full ${nivel === 'ok' ? 'bg-emerald-500' : nivel === 'amarillo' ? 'bg-amber-500' : 'bg-red-600'}`}
      />
      {a.texto}
    </span>
  )
}

export function InsigniaTriage({ nivel }) {
  if (!nivel) {
    return (
      <span className="inline-flex rounded px-1.5 py-0.5 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-300">
        Sin triage
      </span>
    )
  }
  const t = NIVELES_TRIAGE.find((n) => n.id === nivel)
  return <span className={`inline-flex rounded px-1.5 py-0.5 text-[11px] font-semibold ${t.clase}`}>{t.nombre}</span>
}
