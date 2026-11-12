const TONOS = {
  neutro: 'border-slate-200',
  verde: 'border-emerald-300',
  amarillo: 'border-amber-300',
  rojo: 'border-red-300',
}

export default function KPI({ titulo, valor, unidad, detalle, tono = 'neutro' }) {
  return (
    <div className={`rounded-xl border-l-4 bg-white p-4 shadow-sm ring-1 ring-slate-200 ${TONOS[tono]}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{titulo}</p>
      <p className="mt-1 text-3xl font-bold text-slate-900">
        {valor}
        {unidad && <span className="ml-1 text-base font-medium text-slate-500">{unidad}</span>}
      </p>
      {detalle && <p className="mt-1 text-xs text-slate-500">{detalle}</p>}
    </div>
  )
}
