import { useEffect, useState } from 'react'
import { ETAPA_POR_ID, ETIQUETA_TRANSICION, NIVELES_TRIAGE, PERSONAL, elegir } from '../data/mockData'
import { accionPendiente, opcionesSiguiente, registroActual } from '../lib/flujo'
import { formatoHora } from '../lib/indicadores'
import { IconoCandado, IconoQR } from './Iconos'
import { InsigniaTriage } from './Insignias'
import QRSimulado from './QRSimulado'
import Tarjeta from './Tarjeta'

const normalizar = (c) => c.trim().toUpperCase()

export default function EscanerQR({ pacientes, onRegistrar, lecturaExterna }) {
  const [codigo, setCodigo] = useState('')
  const [pacienteId, setPacienteId] = useState(null)
  const [responsable, setResponsable] = useState('')
  const [triage, setTriage] = useState('')
  const [siguiente, setSiguiente] = useState('')
  const [mensaje, setMensaje] = useState(null)

  const paciente = pacientes.find((p) => p.id === pacienteId)

  function cargar(p) {
    const r = registroActual(p)
    setPacienteId(p.id)
    setCodigo(p.qr)
    setResponsable(r.entrada ? r.responsable : elegir(PERSONAL[ETAPA_POR_ID[r.etapa].rol]))
    setTriage('')
    setSiguiente(opcionesSiguiente(p)[0] ?? '')
    setMensaje(null)
  }

  function escanear(valor = codigo) {
    const c = normalizar(valor)
    if (!c) return
    const p = pacientes.find((x) => x.qr === c || x.turno === c)
    if (!p) {
      setPacienteId(null)
      setMensaje({ tipo: 'error', texto: `Código "${c}" no reconocido entre los pacientes activos.` })
      return
    }
    cargar(p)
  }

  function escaneoAleatorio() {
    if (!pacientes.length) return
    cargar(elegir(pacientes))
  }

  useEffect(() => {
    if (!lecturaExterna) return
    const p = pacientes.find((x) => x.id === lecturaExterna.id)
    if (p) cargar(p)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lecturaExterna])

  function confirmar() {
    const accion = accionPendiente(paciente)
    const r = registroActual(paciente)
    const resultado = onRegistrar(paciente.id, {
      responsable,
      triage: r.etapa === 'triage' && accion === 'salida' ? triage || null : null,
      siguiente: accion === 'salida' ? siguiente || null : null,
    })
    if (resultado.error) {
      setMensaje({ tipo: 'error', texto: resultado.error })
      return
    }
    setMensaje({ tipo: 'ok', texto: `${paciente.turno}: ${resultado.evento.texto}` })
    setPacienteId(null)
    setCodigo('')
  }

  const registro = paciente && registroActual(paciente)
  const etapa = registro && ETAPA_POR_ID[registro.etapa]
  const accion = paciente && accionPendiente(paciente)
  const opciones = paciente ? opcionesSiguiente(paciente) : []
  const requiereTriage = registro?.etapa === 'triage' && accion === 'salida' && !paciente.triage
  const personalEtapa = etapa ? PERSONAL[etapa.rol] : []

  return (
    <Tarjeta
      titulo="Simulador de escaneo QR"
      subtitulo="Registra entrada y salida de la etapa actual del paciente"
      acciones={<IconoQR className="h-5 w-5 text-teal-700" />}
    >
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault()
          escanear()
        }}
      >
        <label htmlFor="codigo-qr" className="sr-only">
          Código QR o turno
        </label>
        <input
          id="codigo-qr"
          list="codigos-activos"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          placeholder="QR-U013-XXXX o U-013"
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm uppercase focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
        />
        <datalist id="codigos-activos">
          {pacientes.map((p) => (
            <option key={p.id} value={p.qr}>
              {p.turno} · {ETAPA_POR_ID[registroActual(p).etapa].corto}
            </option>
          ))}
        </datalist>
        <button type="submit" className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800">
          Escanear
        </button>
      </form>
      <button type="button" onClick={escaneoAleatorio} className="mt-2 text-xs font-medium text-teal-700 hover:underline">
        Simular escaneo de un paciente aleatorio
      </button>

      {mensaje && (
        <p
          role="status"
          className={`mt-3 rounded-lg px-3 py-2 text-sm ${mensaje.tipo === 'ok' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}
        >
          {mensaje.texto}
        </p>
      )}

      {paciente && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="flex gap-3">
            <QRSimulado codigo={paciente.qr} tamano={84} />
            <div className="min-w-0 flex-1 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-base font-bold">{paciente.turno}</span>
                <InsigniaTriage nivel={paciente.triage} />
              </div>
              <p className="truncate text-slate-700">
                {paciente.nombre} · {paciente.edad} años
              </p>
              <p className="text-xs text-slate-500">
                {paciente.servicio} · {etapa.area}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Llegada a la etapa: {formatoHora(registro.llegada)}
                {registro.entrada && ` · Entrada: ${formatoHora(registro.entrada)}`}
              </p>
            </div>
          </div>

          <div className="mt-3 rounded-md bg-white p-3 ring-1 ring-slate-200">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Acción a registrar</p>
            <p className="mt-0.5 text-sm font-semibold text-slate-900">
              {accion === 'entrada' ? 'Entrada a' : 'Salida de'} {etapa.nombre}
              {registro.revaloracion > 0 && ` (revaloración #${registro.revaloracion})`}
            </p>

            <label className="mt-3 block text-xs font-medium text-slate-600">
              Responsable
              <select
                value={responsable}
                onChange={(e) => setResponsable(e.target.value)}
                disabled={accion === 'salida'}
                className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm disabled:bg-slate-100"
              >
                {personalEtapa.includes(responsable) || !responsable ? null : <option value={responsable}>{responsable}</option>}
                {personalEtapa.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>

            {requiereTriage && (
              <label className="mt-3 block text-xs font-medium text-slate-600">
                Clasificación de triage asignada por el profesional <span className="text-red-600">*</span>
                <select
                  value={triage}
                  onChange={(e) => setTriage(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                >
                  <option value="">— Seleccione —</option>
                  {NIVELES_TRIAGE.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.nombre}
                    </option>
                  ))}
                </select>
                <span className="mt-1 block font-normal text-slate-500">
                  El sistema solo registra la clasificación; no la sugiere ni la calcula.
                </span>
              </label>
            )}

            {accion === 'salida' && opciones.length > 1 && (
              <fieldset className="mt-3">
                <legend className="text-xs font-medium text-slate-600">Siguiente etapa (definida por el profesional)</legend>
                <div className="mt-1 space-y-1">
                  {opciones.map((o) => (
                    <label key={o} className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="siguiente"
                        value={o}
                        checked={siguiente === o}
                        onChange={() => setSiguiente(o)}
                        className="accent-teal-700"
                      />
                      {ETIQUETA_TRANSICION[`${registro.etapa}>${o}`] ?? ETAPA_POR_ID[o].nombre}
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            {accion === 'salida' && opciones.length === 1 && (
              <p className="mt-3 text-xs text-slate-500">Siguiente etapa: {ETAPA_POR_ID[opciones[0]].nombre}</p>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={confirmar}
                disabled={requiereTriage && !triage}
                className="rounded-lg bg-teal-700 px-3 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Confirmar {accion === 'entrada' ? 'entrada' : registro.etapa === 'egreso' ? 'egreso' : 'salida'}
              </button>
              <button
                type="button"
                onClick={() => setPacienteId(null)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
            </div>
          </div>
          <p className="mt-2 flex items-center gap-1 text-[11px] text-slate-500">
            <IconoCandado className="h-3 w-3" /> Lectura transmitida por la red interna cifrada (simulado)
          </p>
        </div>
      )}
    </Tarjeta>
  )
}
