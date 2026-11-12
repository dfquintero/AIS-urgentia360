import { ChangeDetectionStrategy, Component } from '@angular/core';

// Indicador solo visual: el prototipo no establece ninguna conexión de red.
@Component({
  selector: 'app-red-cifrada',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="red-cifrada" title="Simulación visual: el prototipo no se conecta a ninguna red">
      <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
        <path fill="currentColor" d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5Zm-3 8V7a3 3 0 1 1 6 0v3H9Z"/>
      </svg>
      Red interna cifrada · TLS (simulado)
    </span>
  `,
})
export class RedCifrada {}
