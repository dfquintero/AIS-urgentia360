export default function Tarjeta({ titulo, subtitulo, acciones, children, className = '' }) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {(titulo || acciones) && (
        <header className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 px-4 py-3">
          <div>
            {titulo && <h2 className="text-sm font-semibold text-slate-900">{titulo}</h2>}
            {subtitulo && <p className="mt-0.5 text-xs text-slate-500">{subtitulo}</p>}
          </div>
          {acciones}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  )
}
