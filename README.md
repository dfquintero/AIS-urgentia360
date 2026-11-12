# Urgentia360 · Seguimiento operativo de urgencias (mockup)

Prototipo interactivo en **React + Vite + Tailwind CSS + Recharts** para el seguimiento operativo del flujo de pacientes en un servicio de urgencias.

> **Importante:** es un mockup con **datos simulados en memoria** (no hay backend ni datos reales). La "red interna cifrada" es solo una representación visual. El sistema **no toma decisiones clínicas**: el **triage es obligatorio** y su clasificación la registra siempre el personal de salud.

## Ejecución

Requiere Node.js 18 o superior.

```bash
npm install && npm run dev
```

Abrir la URL que muestra Vite (por defecto http://localhost:5173).

Otros comandos:

```bash
npm run build     # compila a dist/
npm run preview   # sirve la versión compilada
```

## Flujo de etapas (máquina de estados)

```
Punto 0 (turno) → Triage (obligatorio) → Admisión → Consulta → Ayudas diagnósticas → Valoración / Observación → Egreso
                                                       └──────── (directo) ────────┘          ↺ revaloración
```

- Cada paciente tiene un **QR simulado**, área, servicio, responsable y, por etapa, la hora de **llegada**, **entrada** (inicio de atención) y **salida**.
- Cada escaneo del QR alterna entre *entrada* y *salida* de la etapa actual.
- No se puede salir de Triage sin registrar la clasificación (I–V) asignada por el profesional.
- Desde Consulta se puede ir a Ayudas diagnósticas o directo a Valoración; desde Valoración se puede pedir revaloración o pasar a Egreso.
- Las transiciones están definidas en `TRANSICIONES` (`src/data/mockData.js`) y se aplican en `src/lib/flujo.js`.

## Vistas

1. **Operación de urgencias** (`src/views/Operacion.jsx`): generación de turnos (Punto 0 / digiturno), simulador de escaneo QR con asignación de responsable, tablero de pacientes activos con tiempo en etapa en tiempo real y alertas amarillo/rojo, y bitácora de eventos.
2. **Coordinación / Indicadores** (`src/views/Coordinacion.jsx`): KPIs, tiempo promedio por etapa (espera + atención) con detección del cuello de botella, distribución por servicio, pacientes por etapa y panel de umbrales de alerta configurables (se aplican de inmediato al tablero de Operación).
3. **Acompañantes** (`src/views/Acompanantes.jsx`): pantalla de sala de espera con código de turno y estado genérico (sin nombres ni datos clínicos) y vista móvil para consultar el estado por código de turno.

El reloj de la simulación se puede acelerar (1×, 10×, 30×, 60×) desde el encabezado para ver cómo cambian las alertas.

## Estructura

```
src/
├── App.jsx                # estado global, reloj simulado y navegación por pestañas
├── data/mockData.js       # etapas, transiciones, umbrales, personal y pacientes simulados
├── lib/flujo.js           # máquina de estados (registro de escaneos)
├── lib/indicadores.js     # tiempos, alertas, promedios y cuello de botella
├── components/            # componentes reutilizables (escáner QR, tablero, QR simulado, etc.)
└── views/                 # Operacion, Coordinacion, Acompanantes
```
