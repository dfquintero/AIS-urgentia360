# Urgentia 360 · Seguimiento operativo de urgencias

Prototipo académico (solo frontend) para el seguimiento operativo de un servicio de urgencias. Usa
datos simulados en memoria, no tiene backend y la "red interna cifrada" es solo una etiqueta visual.

> El sistema **no toma decisiones clínicas**. El triage es obligatorio y siempre lo realiza el
> profesional de salud; la aplicación solo registra la clasificación.

---

## Cómo visualizar el prototipo

### 1. Requisitos

| Herramienta | Versión | Para qué |
|---|---|---|
| [Node.js](https://nodejs.org/) | **24 LTS** (o 22.22+) | Ejecutar Angular y npm |
| [Git](https://git-scm.com/) | Cualquiera reciente | Descargar el repositorio |
| Navegador | Chrome, Edge, Firefox o Safari actualizados | Ver la aplicación |

Instalación de Node.js según el sistema operativo:

- **Windows:** descargar el instalador "LTS" desde <https://nodejs.org/> y ejecutarlo con las opciones por defecto.
  También sirve `winget install OpenJS.NodeJS.LTS`.
- **macOS:** instalador "LTS" desde <https://nodejs.org/> o `brew install node@24`.
- **Linux:** usar [nvm](https://github.com/nvm-sh/nvm): `nvm install 24 && nvm use 24`.

Comprobar la instalación en una terminal nueva:

```bash
node -v   # debe mostrar v24.x (o v22.22 o superior)
npm -v
```

> Con Node 20 o anterior el comando `npm start` falla: Angular 22 no es compatible.

### 2. Descargar el proyecto

```bash
git clone https://github.com/dfquintero/AIS-urgentia360.git
cd AIS-urgentia360
npm install
```

> Mientras el PR #2 no esté fusionado en `main`, cambiar antes a su rama:
> `git checkout devin/1794522849-angular-urgencias`.

`npm install` descarga las dependencias en `node_modules/` (solo se hace una vez, tarda 1–2 minutos).

### 3. Opción A — modo desarrollo (recomendada para revisar)

```bash
npm start
```

Cuando la terminal muestre `Local: http://localhost:4200/`, abrir esa dirección en el navegador.
La página se recarga sola si se edita el código. Para detener el servidor: `Ctrl + C`.

### 4. Opción B — versión compilada (como quedaría publicada)

```bash
npm run build
npx http-server dist/urgentia360/browser -p 8080
```

Abrir <http://localhost:8080/>. Alternativa sin instalar nada adicional, si se tiene Python:
`python -m http.server 8080 -d dist/urgentia360/browser`.

El contenido de `dist/urgentia360/browser/` es un sitio estático: puede subirse tal cual a cualquier
hosting estático (GitHub Pages, Netlify, un servidor web interno). Las rutas usan `#`
(`/#/operacion`), así que no requiere configurar el servidor.

### 5. Ver la vista móvil de acompañantes

- **En el computador:** abrir las herramientas de desarrollador (`F12`), activar la barra de
  dispositivos (`Ctrl + Shift + M`, en Mac `Cmd + Shift + M`) y elegir un teléfono, por ejemplo iPhone 12.
- **En un celular real** conectado a la misma red Wi-Fi:
  ```bash
  npm start -- --host 0.0.0.0
  ```
  y abrir en el celular `http://<IP-del-computador>:4200/#/acompanantes`
  (la IP se consulta con `ipconfig` en Windows o `ip addr` / `ifconfig` en Linux y macOS).
  Puede ser necesario permitir el puerto 4200 en el firewall.

---

## Recorrido sugerido para una demostración

Al abrir la aplicación ya hay 18 pacientes activos en distintas etapas y 12 egresados.

1. **Acelerar el reloj:** en el encabezado, elegir `30×` para ver avanzar los tiempos y las alertas.
2. **Operación** (`#/operacion`):
   1. Pulsar **+ Generar turno (Punto 0)**. Se crea un turno nuevo con su QR y queda cargado en el escáner.
   2. Pulsar **Registrar salida**: el paciente pasa a Triage (la única salida posible de Punto 0).
   3. Elegir un responsable y pulsar **Registrar entrada** a Triage.
   4. Intentar salir de Triage: el botón está deshabilitado hasta escoger la clasificación (I–V)
      que asigna el profesional. Elegirla y registrar la salida → pasa a Admisión.
   5. Hacer clic en un paciente del tablero que esté en **Consulta** y registrar su salida: se puede
      escoger **Ayudas diagnósticas** o pasar directo a **Valoración**.
   6. Con un paciente en **Valoración**, elegir **Revaloración** o **Egreso**.
   7. Los QR del escáner son reales: pueden leerse con la cámara del celular.
3. **Coordinación** (`#/coordinacion`): revisar los indicadores, el cuello de botella resaltado en rojo
   y la distribución por servicio. Mover los umbrales de una etapa y volver a Operación: las alertas
   amarillas y rojas del tablero cambian de inmediato.
4. **Acompañantes** (`#/acompanantes`): la sala de espera solo muestra códigos de turno y un estado
   genérico. En la vista móvil, escribir un código (por ejemplo `U-019` o simplemente `19`).

Los datos viven en memoria: **al recargar la página todo vuelve al estado inicial**.

---

## Problemas comunes

| Síntoma | Solución |
|---|---|
| `The Angular CLI requires a minimum Node.js version` | Actualizar Node a 24 LTS (ver Requisitos) y abrir una terminal nueva. |
| `'ng' no se reconoce` o `command not found` | Ejecutar `npm install` antes de `npm start`; no hace falta instalar Angular CLI global. |
| `Port 4200 is already in use` | Cerrar el otro servidor o usar `npm start -- --port 4300`. |
| En Windows, PowerShell bloquea `npm` por la política de ejecución | Usar `cmd` o ejecutar `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`. |
| Página en blanco al abrir `index.html` con doble clic | El sitio debe servirse por HTTP: usar la Opción A o la Opción B. |

---

## Pruebas

```bash
npm test -- --watch=false   # pruebas unitarias del flujo y los indicadores (Vitest)
npm run build               # verifica que la aplicación compile
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
