import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import KPI from '../components/KPI'
import PanelUmbrales from '../components/PanelUmbrales'
import Tarjeta from '../components/Tarjeta'
import { ETAPAS, SERVICIOS } from '../data/mockData'
import { registroActual } from '../lib/flujo'
import { cuelloDeBotella, nivelAlerta, promediosPorEtapa } from '../lib/indicadores'

const COLORES_SERVICIO = ['#0f766e', '#0284c7', '#7c3aed', '#db2777', '#ea580c', '#65a30d']
const MIN = 60000

export default function Coordinacion({ pacientes, egresados, ahora, umbrales, onUmbrales }) {
  const promedios = useMemo(() => promediosPorEtapa(pacientes, egresados, ahora), [pacientes, egresados, ahora])
  const cuello = cuelloDeBotella(promedios)

  const niveles = pacientes.map((p) => nivelAlerta(p, ahora, umbrales))
  const enAmarillo = niveles.filter((n) => n === 'amarillo').length
  const enRojo = niveles.filter((n) => n === 'rojo').length

  const estanciaPromedio = pacientes.length
    ? Math.round(pacientes.reduce((s, p) => s + (ahora - p.historial[0].llegada), 0) / pacientes.length / MIN)
    : 0

  const porServicio = SERVICIOS.map((s) => ({ nombre: s, valor: pacientes.filter((p) => p.servicio === s).length })).filter((d) => d.valor > 0)
  const porEtapa = ETAPAS.map((e) => ({
    etapa: e.corto,
    pacientes: pacientes.filter((p) => registroActual(p).etapa === e.id).length,
  }))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KPI titulo="Pacientes activos" valor={pacientes.length} detalle={`${egresados.length} egresos en el turno`} />
        <KPI
          titulo="En alerta"
          valor={enAmarillo + enRojo}
          detalle={`${enAmarillo} amarillo · ${enRojo} rojo`}
          tono={enRojo ? 'rojo' : enAmarillo ? 'amarillo' : 'verde'}
        />
        <KPI titulo="Estancia promedio" valor={estanciaPromedio} unidad="min" detalle="Desde Punto 0, pacientes activos" />
        <KPI
          titulo="Cuello de botella"
          valor={cuello?.etapa ?? '—'}
          detalle={cuello ? `${cuello.espera} min de espera promedio` : 'Sin datos'}
          tono="rojo"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Tarjeta
          className="min-w-0 lg:col-span-2"
          titulo="Tiempo promedio por etapa"
          subtitulo="Minutos de espera (llegada → entrada) y atención (entrada → salida). En rojo, la etapa con mayor espera."
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={promedios} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="etapa" tick={{ fontSize: 12 }} interval={0} />
                <YAxis tick={{ fontSize: 12 }} unit=" m" />
                <Tooltip formatter={(v, n) => [`${v} min`, n]} labelFormatter={(l, p) => p?.[0]?.payload?.nombre ?? l} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="espera" name="Espera" stackId="t" fill="#f59e0b">
                  {promedios.map((p) => (
                    <Cell key={p.id} fill={p.id === cuello?.id ? '#dc2626' : '#f59e0b'} />
                  ))}
                </Bar>
                <Bar dataKey="atencion" name="Atención" stackId="t" fill="#0f766e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Tarjeta>

        <Tarjeta titulo="Detección de cuello de botella" subtitulo="Etapa con mayor tiempo promedio de espera">
          {cuello ? (
            <div>
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-red-700">Etapa crítica</p>
                <p className="mt-1 text-2xl font-bold text-red-800">{cuello.nombre}</p>
                <p className="mt-1 text-sm text-red-900">
                  Espera promedio de <strong>{cuello.espera} min</strong> y atención de {cuello.atencion} min ({cuello.n} registros).
                </p>
              </div>
              <ol className="mt-3 space-y-1 text-sm">
                {[...promedios]
                  .filter((p) => p.n > 0)
                  .sort((a, b) => b.espera - a.espera)
                  .slice(0, 4)
                  .map((p, i) => (
                    <li key={p.id} className="flex justify-between">
                      <span className={i === 0 ? 'font-semibold text-red-700' : 'text-slate-600'}>
                        {i + 1}. {p.etapa}
                      </span>
                      <span className="font-mono tabular-nums text-slate-700">{p.espera} min</span>
                    </li>
                  ))}
              </ol>
              <p className="mt-3 text-xs text-slate-500">Indicador operativo para apoyar la gestión de recursos; no prioriza pacientes.</p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Sin datos suficientes.</p>
          )}
        </Tarjeta>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Tarjeta titulo="Distribución por servicio" subtitulo="Pacientes activos">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={porServicio} dataKey="valor" nameKey="nombre" innerRadius={50} outerRadius={85} paddingAngle={2}>
                  {porServicio.map((d) => (
                    <Cell key={d.nombre} fill={COLORES_SERVICIO[SERVICIOS.indexOf(d.nombre)]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`${v} pacientes`]} />
                <Legend wrapperStyle={{ fontSize: 12 }} layout="vertical" align="right" verticalAlign="middle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Tarjeta>

        <Tarjeta titulo="Pacientes por etapa" subtitulo="Carga actual del flujo">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={porEtapa} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="etapa" tick={{ fontSize: 12 }} interval={0} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="pacientes" name="Pacientes" fill="#0284c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Tarjeta>
      </div>

      <PanelUmbrales umbrales={umbrales} onCambiar={onUmbrales} />
    </div>
  )
}
