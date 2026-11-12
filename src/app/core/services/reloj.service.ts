import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { DatasetService } from './dataset.service';

const HORA = 3_600_000;

export interface MarcaTiempo {
  etiqueta: string;
  ts: number;
}

/**
 * Reloj de reproducción: recorre los eventos ficticios de la base sintética (no hay datos en vivo).
 * Arranca 4 horas antes del corte de la simulación para mostrar episodios activos.
 */
@Injectable({ providedIn: 'root' })
export class RelojService {
  private readonly dataset = inject(DatasetService).dataset;

  readonly velocidades = [1, 10, 60, 300] as const;
  readonly ahora = signal(this.dataset.corte - 4 * HORA);
  readonly velocidad = signal<number>(10);
  readonly pausado = signal(false);

  readonly marcas: readonly MarcaTiempo[] = [
    { etiqueta: 'Inicio del periodo (1 oct)', ts: this.dataset.inicio + 8 * HORA },
    { etiqueta: 'Pico del 7 oct, 12:00', ts: this.dataset.inicio + (6 * 24 + 12) * HORA },
    { etiqueta: '14 oct, 20:00 (inicio demo)', ts: this.dataset.corte - 4 * HORA },
    { etiqueta: 'Corte de la simulación (15 oct)', ts: this.dataset.corte },
  ];

  constructor() {
    const id = setInterval(() => {
      if (!this.pausado()) this.ahora.update((t) => t + 1000 * this.velocidad());
    }, 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(id));
  }

  irA(ts: number): void {
    this.ahora.set(ts);
  }
}
