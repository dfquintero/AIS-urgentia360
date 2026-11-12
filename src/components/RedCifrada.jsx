import { IconoCandado } from './Iconos'

export default function RedCifrada({ compacto = false, className = '' }) {
  return (
    <span
      title="Indicador visual simulado: en este mockup no hay comunicación de red real."
      className={`inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 ${className}`}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      <IconoCandado className="h-3.5 w-3.5" />
      {compacto ? 'Red interna cifrada' : 'Red interna cifrada · AES-256 / TLS 1.3 (simulado)'}
    </span>
  )
}
