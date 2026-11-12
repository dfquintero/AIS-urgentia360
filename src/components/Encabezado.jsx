import RedCifrada from './RedCifrada'

const VELOCIDADES = [1, 10, 30, 60]

export default function Encabezado({ pestanas, vista, onVista, ahora, velocidad, onVelocidad }) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-900 text-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <img src="./favicon.svg" alt="" className="h-9 w-9" />
          <div>
            <h1 className="text-lg font-bold leading-tight">Urgentia360</h1>
            <p className="text-xs text-slate-400">Seguimiento operativo de urgencias · mockup</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <RedCifrada className="hidden md:inline-flex" />
          <RedCifrada compacto className="md:hidden" />
          <div className="flex items-center gap-2 rounded-lg bg-slate-800 px-2.5 py-1.5">
            <span className="font-mono tabular-nums">
              {new Date(ahora).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <label className="flex items-center gap-1 text-slate-400">
              <span className="hidden sm:inline">Velocidad</span>
              <select
                value={velocidad}
                onChange={(e) => onVelocidad(Number(e.target.value))}
                aria-label="Velocidad de simulación"
                className="rounded bg-slate-700 px-1 py-0.5 text-white"
              >
                {VELOCIDADES.map((v) => (
                  <option key={v} value={v}>
                    {v}×
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>
      <nav className="mx-auto max-w-7xl px-2" aria-label="Vistas">
        <ul className="flex gap-1 overflow-x-auto">
          {pestanas.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onVista(p.id)}
                aria-current={vista === p.id ? 'page' : undefined}
                className={`whitespace-nowrap rounded-t-lg px-4 py-2 text-sm font-medium transition ${
                  vista === p.id ? 'bg-slate-100 text-slate-900' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {p.etiqueta}
                <span className={`ml-2 hidden text-xs font-normal lg:inline ${vista === p.id ? 'text-slate-500' : 'text-slate-500'}`}>
                  {p.publico}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}
