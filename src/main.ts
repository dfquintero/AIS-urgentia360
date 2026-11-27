import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

const DURACION_MINIMA_MS = 1400;
const inicio = performance.now();

/** Oculta la pantalla de bienvenida de index.html cuando la app ya cargó y pasó la duración mínima. */
function ocultarSplash(): void {
  const splash = document.getElementById('splash');
  if (!splash) return;
  const espera = Math.max(0, DURACION_MINIMA_MS - (performance.now() - inicio));
  setTimeout(() => {
    splash.classList.add('splash-fuera');
    setTimeout(() => splash.remove(), 700);
  }, espera);
}

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err))
  .finally(ocultarSplash);
