import { DestroyRef, Injectable, inject, signal } from '@angular/core';

/** Reloj simulado de la sala; puede acelerarse para observar cómo evolucionan las alertas. */
@Injectable({ providedIn: 'root' })
export class RelojService {
  readonly velocidades = [1, 10, 30, 60] as const;
  readonly ahora = signal(Date.now());
  readonly velocidad = signal<number>(1);

  constructor() {
    const id = setInterval(() => this.ahora.update((t) => t + 1000 * this.velocidad()), 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(id));
  }
}
