import { useState } from 'react'
import Bitacora from '../components/Bitacora'
import EscanerQR from '../components/EscanerQR'
import FlujoEtapas from '../components/FlujoEtapas'
import QRSimulado from '../components/QRSimulado'
import TableroPacientes from '../components/TableroPacientes'
import Tarjeta from '../components/Tarjeta'

export default function Operacion({ pacientes, ahora, umbrales, bitacora, onGenerarTurno, onRegistrar }) {
  const [ultimoTurno, setUltimoTurno] = useState(null)
  const [lectura, setLectura] = useState(null)

  return (
    <div className="space-y-4">
      <FlujoEtapas pacientes={pacientes} ahora={ahora} umbrales={umbrales} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="min-w-0 space-y-4 lg:col-span-1">
          <Tarjeta titulo="Punto 0 · Generación de turno" subtitulo="Integración conceptual con digiturno: el turno se emite con su QR.">
            <button
              type="button"
              onClick={() => setUltimoTurno(onGenerarTurno())}
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Generar nuevo turno
            </button>
            {ultimoTurno && (
              <div className="mt-3 flex items-center gap-3 rounded-lg border border-dashed border-slate-300 p-3">
                <QRSimulado codigo={ultimoTurno.qr} tamano={72} />
                <div className="text-sm">
                  <p className="text-xs text-slate-500">Turno emitido</p>
                  <p className="font-mono text-xl font-bold">{ultimoTurno.turno}</p>
                  <p className="font-mono text-[11px] text-slate-500">{ultimoTurno.qr}</p>
                  <button
                    type="button"
                    onClick={() => setLectura({ id: ultimoTurno.id, n: Date.now() })}
                    className="mt-1 text-xs font-medium text-teal-700 hover:underline"
                  >
                    Escanear este QR
                  </button>
                </div>
              </div>
            )}
            <p className="mt-3 text-xs text-slate-500">
              Siguiente paso obligatorio: <strong>Triage</strong>. El flujo no permite pasar a Admisión sin clasificación.
            </p>
          </Tarjeta>

          <EscanerQR pacientes={pacientes} onRegistrar={onRegistrar} lecturaExterna={lectura} />
          <Bitacora eventos={bitacora} />
        </div>

        <div className="min-w-0 lg:col-span-2">
          <TableroPacientes
            pacientes={pacientes}
            ahora={ahora}
            umbrales={umbrales}
            onSeleccionar={(p) => setLectura({ id: p.id, n: Date.now() })}
          />
        </div>
      </div>
    </div>
  )
}
