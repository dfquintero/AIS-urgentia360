import { IconoInfo } from './Iconos'

export default function Disclaimer() {
  return (
    <div role="note" className="flex items-start gap-3 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
      <IconoInfo className="mt-0.5 h-5 w-5 shrink-0" />
      <p>
        <strong>Herramienta de seguimiento operativo, no clínica.</strong> Este sistema no toma decisiones clínicas ni
        asigna prioridades. El <strong>triage es obligatorio</strong> y su clasificación la realiza siempre el personal
        de salud. Mockup con datos simulados.
      </p>
    </div>
  )
}
