# Urgentia 360 · Seguimiento operativo de urgencias

Prototipo académico (solo frontend) para el seguimiento operativo de un servicio de urgencias, construido a partir
de la **base de datos sintética URGENTIA 360° (UNAL–Kantera 2026)**: 360 episodios ficticios, 4.240 eventos,
495 órdenes diagnósticas y 84 bloques de capacidad. No tiene backend; el "tiempo real" es una **reproducción** de
esos eventos ficticios y la "red interna cifrada" es solo una etiqueta visual.

> El sistema **no toma decisiones clínicas** ni debe usarse para negar o retrasar la atención (Resolución 5596 de
> 2015). El triage es obligatorio y siempre lo realiza el profesional de salud; la aplicación solo registra la
> clasificación. Los datos no representan a la Clínica Universitaria Colombia ni a Keralty y los umbrales son
> ilustrativos hasta validación institucional.

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

### 2.1 Base de datos sintética

El repositorio incluye `public/datos/urgentia360.json`, derivado del Excel *URGENTIA 360° – Base de Datos Sintética
UNAL–Kantera 2026* con aprobación para el proyecto académico. Si se recibe una versión nueva del Excel, se regenera así:

```bash
pip install openpyxl
python scripts/convertir_dataset.py "ruta/URGENTIA 360º - Base de Datos Sintetica. UNAL_Kantera 2026.xlsx"
```

Si el JSON no estuviera disponible, la aplicación genera **datos de respaldo** con la misma estructura y lo indica
en el encabezado ("Datos de respaldo").

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

La reproducción arranca el **14 de octubre de 2026 a las 20:00** (4 horas antes del corte de la simulación) a 10×.

1. **Rol simulado** (botón "Rol: …" del encabezado, sin login real): cada perfil ve solo sus vistas, según la
   matriz sugerida por Kantera (no es un esquema de permisos aprobado):

   | Rol | Vistas |
   |---|---|
   | Demostración | Todas |
   | Médico / Enfermería | Operación, Trazabilidad |
   | Coordinación de urgencias | Operación, Coordinación (con umbrales), Trazabilidad |
   | Directivo / Analista | Coordinación (solo indicadores agregados) |
   | Acompañante | Acompañantes |
1. **Controles del encabezado:** pausa, velocidad (1× a 300×) y **Ir a…** para saltar al inicio del periodo, a un
   pico de demanda o al corte (15 oct, 00:00), donde quedan los 10 episodios abiertos de la base.
2. **Operación** (`#/operacion`):
   1. El tablero muestra los episodios activos con su etapa, tiempo, órdenes pendientes y el motivo de la alerta
      (umbral ilustrativo de la etapa o meta normativa de Triage I/II).
   2. Pulsar **+ Generar turno (Punto 0)**: se crea un episodio nuevo en espera de triage, con su QR.
   3. Elegir un responsable (código ficticio) y **Registrar entrada** a Triage. Para salir, el botón exige la
      clasificación (I–V) que asigna el profesional.
   4. Seleccionar un episodio del tablero y registrar sus hitos: desde la primera valoración se elige
      **ayudas diagnósticas** o **definir conducta**; el egreso exige el destino (alta, hospitalización, remisión, otro).
   5. La bitácora mezcla los eventos reproducidos de la base con los registros manuales (marcados "QR manual").
3. **Coordinación** (`#/coordinacion`): filtrar por triage y franja; revisar turno→triage, fin de triage→médico,
   Triage II > 30 min (ilustrativo), órdenes sin revisar, cuello de botella y carga frente a capacidad simulada.
   Las metas de Triage III–V quedan **por definir** y pueden configurarse.
4. **Trazabilidad** (`#/trazabilidad`): los tres casos de demostración de la base (demora post-triage, órdenes sin
   resultado y episodio abierto). Cada episodio muestra hitos, órdenes y la línea de tiempo con fuente
   (Sofía/Digiturno, HIS/Athenea, LIS, PACS/RIS, todas referenciales), rol y origen del registro.
5. **Acompañantes** (`#/acompanantes`): solo código de turno y estado genérico. En la vista móvil se puede escribir
   el código completo (`TURNO-FICT-00085`) o solo el número (`85`).

Los registros manuales viven en memoria: **al recargar la página se pierden** (también desde **Ir a… → Descartar
registros manuales**).

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

`Punto 0 (turno) → Triage (obligatorio) → Admisión → Primera valoración → [Ayudas diagnósticas ⇄ Revaloración] → Definición de conducta → Egreso`

Cada escaneo QR alterna entre **entrada** (requiere responsable) y **salida** de la etapa actual. No se
puede salir de Triage sin clasificación (I–V) ni egresar sin destino. Un episodio registrado manualmente deja
de seguir la reproducción desde ese instante.

## Vistas

| Ruta | Usuarios | Contenido |
|---|---|---|
| `#/operacion` | Medicina, enfermería, admisiones | Generar turno, escáner QR, tablero con alertas, bitácora |
| `#/coordinacion` | Coordinación, analistas | KPIs, tiempos por etapa, cuello de botella, demanda, capacidad, umbrales y metas |
| `#/trazabilidad` | Coordinación, analistas | Episodio de extremo a extremo y casos de demostración |
| `#/acompanantes` | Acompañantes | Sala de espera y consulta móvil por código de turno, sin datos clínicos |

## Estructura

Organización por funcionalidades con componentes contenedores (páginas) y de presentación:

```
src/app/
  core/       modelos, catálogos, carga de la base sintética, dominio (flujo, indicadores), servicios (reloj, store)
  shared/     componentes de presentación y pipes reutilizables
  features/   operacion/, coordinacion/, trazabilidad/, acompanantes/ (página + components/)
scripts/      convertir_dataset.py: Excel UNAL–Kantera → public/datos/urgentia360.json
src/theme/    paleta de Angular Material generada desde los colores Keralty
```

## Identidad visual

Colores tomados del Manual de Identidad Corporativa de Keralty (azul corporativo `#002F87`,
azul `#0071A3`, verde `#00B288`). Proyecto académico sin afiliación oficial con Keralty; no se usa
el logotipo de la marca.
