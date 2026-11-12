# Urgentia 360 · Seguimiento operativo de urgencias

Prototipo académico (solo frontend) para el seguimiento operativo de un servicio de urgencias. Usa
datos simulados en memoria, no tiene backend y la "red interna cifrada" es solo una etiqueta visual.

> El sistema **no toma decisiones clínicas**. El triage es obligatorio y siempre lo realiza el
> profesional de salud; la aplicación solo registra la clasificación.

## Ejecución

Requiere Node.js 22.22+ o 24 LTS.

```bash
npm install
npm start          # http://localhost:4200
npm test           # pruebas unitarias del flujo (Vitest)
npm run build      # build de producción en dist/
```

## Stack

- Angular 22: componentes standalone, signals y control flow.
- Angular Material con tema generado a partir de la paleta Keralty.
- ngx-echarts / ECharts (carga diferida, solo en Coordinación).
- angularx-qrcode para QR legibles por lectores reales.
- Tipografía del sistema operativo (sin fuentes web).

## Flujo de atención (máquina de estados)

`Punto 0 (turno) → Triage (obligatorio) → Admisión → Consulta → [Ayudas diagnósticas] → Valoración/Observación (revaloración opcional) → Egreso`

Cada escaneo QR alterna entre **entrada** (requiere responsable) y **salida** de la etapa actual. No se
puede salir de Triage sin clasificación (I–V).

## Vistas

| Ruta | Usuarios | Contenido |
|---|---|---|
| `#/operacion` | Medicina, enfermería, admisiones | Generar turno, escáner QR, tablero con alertas, bitácora |
| `#/coordinacion` | Coordinación | KPIs, tiempos por etapa, cuello de botella, servicios, umbrales |
| `#/acompanantes` | Acompañantes | Sala de espera y consulta móvil por código de turno, sin datos clínicos |

## Estructura

Organización por funcionalidades con componentes contenedores (páginas) y de presentación:

```
src/app/
  core/       modelos, catálogos, datos simulados, dominio (flujo, indicadores), servicios (reloj, store)
  shared/     componentes de presentación y pipes reutilizables
  features/   operacion/, coordinacion/, acompanantes/ (página + components/)
src/theme/    paleta de Angular Material generada desde los colores Keralty
```

## Identidad visual

Colores tomados del Manual de Identidad Corporativa de Keralty (azul corporativo `#002F87`,
azul `#0071A3`, verde `#00B288`). Proyecto académico sin afiliación oficial con Keralty; no se usa
el logotipo de la marca.
