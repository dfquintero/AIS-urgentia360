import { formatoHora } from '../lib/indicadores'
import { IconoCandado } from './Iconos'
import Tarjeta from './Tarjeta'

const PUNTO = {
  turno: 'bg-slate-500',
  entrada: 'bg-teal-600',
  salida: 'bg-sky-600',
  egreso: 'bg-violet-600',
}

export default function Bitacora({ eventos }) {
  return (
    <Tarjeta titulo="Bitácora de eventos" subtitulo="Últimos registros recibidos por la red interna (simulado)">
      {eventos.length === 0 ? (
        <p className="text-sm text-slate-500">Aún no hay escaneos en esta sesión. Genere un turno o escanee un QR.</p>
      ) : (
        <ul className="max-h-72 space-y-2 overflow-y-auto pr-1 text-sm">
          {eventos.map((e) => (
            <li key={e.id} className="flex gap-2">
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${PUNTO[e.tipo] ?? 'bg-slate-400'}`} />
              <div className="min-w-0">
                <p className="text-slate-800">
                  <span className="font-mono font-semibold">{e.turno}</span> · {e.texto}
                </p>
                <p className="flex items-center gap-1 text-[11px] text-slate-400">
                  {formatoHora(e.ts)} <IconoCandado className="h-3 w-3" /> cifrado
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Tarjeta>
  )
}
