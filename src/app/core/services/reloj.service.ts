import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { DatasetService } from './dataset.service';

const HORA = 3_600_000;

/** Avanza el reloj y se detiene exactamente en el corte si lo cruza durante la reproducción. */
export function avanzarReloj(t: number, pasoMs: number, corte: number): { t: number; llegoAlCorte: boolean } {
  const siguiente = t + pasoMs;
  return t < corte && siguiente >= corte ? { t: corte, llegoAlCorte: true } : { t: siguiente, llegoAlCorte: false };
}

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
  readonly corte = this.dataset.corte;
  /** Después del corte no hay eventos de la base: solo registros manuales. */
  readonly fueraDelPeriodo = computed(() => this.ahora() >= this.corte);

  readonly marcas: readonly MarcaTiempo[] = [
    { etiqueta: 'Inicio del periodo (1 oct)', ts: this.dataset.inicio + 8 * HORA },
    { etiqueta: 'Pico del 7 oct, 12:00', ts: this.dataset.inicio + (6 * 24 + 12) * HORA },
    { etiqueta: '14 oct, 20:00 (inicio demo)', ts: this.dataset.corte - 4 * HORA },
    { etiqueta: 'Corte de la simulación (15 oct)', ts: this.dataset.corte },
  ];

  constructor() {
    const id = setInterval(() => {
      if (this.pausado()) return;
      const { t, llegoAlCorte } = avanzarReloj(this.ahora(), 1000 * this.velocidad(), this.corte);
      this.ahora.set(t);
      if (llegoAlCorte) this.pausado.set(true);
    }, 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(id));
  }

  irA(ts: number): void {
    this.ahora.set(ts);
  }
}
