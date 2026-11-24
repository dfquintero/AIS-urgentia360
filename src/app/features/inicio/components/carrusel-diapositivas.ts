import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

export interface Diapositiva {
  archivo: string;
  mini: string;
  texto: string;
}

const CARPETA = 'diapositivas/';
const UMBRAL_DESLIZAR = 50;

/** Carrusel de las diapositivas exportadas; el mismo visor pasa a pantalla completa. */
@Component({
  selector: 'app-carrusel-diapositivas',
  imports: [MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown)': 'tecla($event)',
    '(document:fullscreenchange)': 'alSalirDePantallaCompleta()',
  },
  template: `
    <div class="carrusel" [class.carrusel-completo]="completo()" role="region" aria-roledescription="carrusel" aria-label="Presentación de Urgentia 360" tabindex="0">
      @if (actual(); as d) {
        <div class="carrusel-visor" (pointerdown)="inicioToque = $event.clientX" (pointerup)="finToque($event.clientX)">
          <img [src]="carpeta + d.archivo" [alt]="'Diapositiva ' + (indice() + 1) + ': ' + d.texto" width="1920" height="1080" draggable="false" />
          <button type="button" class="carrusel-flecha carrusel-izq" (click)="anterior()" [disabled]="indice() === 0" aria-label="Diapositiva anterior">‹</button>
          <button type="button" class="carrusel-flecha carrusel-der" (click)="siguiente()" [disabled]="indice() === total() - 1" aria-label="Diapositiva siguiente">›</button>
        </div>
        <div class="carrusel-barra">
          <span class="carrusel-contador" aria-live="polite">{{ indice() + 1 }} / {{ total() }}</span>
          <button mat-stroked-button type="button" (click)="alternarCompleto()">
            {{ completo() ? 'Salir de pantalla completa' : 'Pantalla completa' }}
          </button>
        </div>
        <div class="carrusel-minis">
          @for (m of diapositivas(); track m.archivo; let i = $index) {
            <button type="button" class="carrusel-mini" [class.activa]="i === indice()" (click)="indice.set(i)" [attr.aria-label]="'Ir a la diapositiva ' + (i + 1)" [attr.aria-current]="i === indice() ? 'true' : null">
              <img [src]="carpeta + m.mini" alt="" width="384" height="216" loading="lazy" />
            </button>
          }
        </div>
      } @else if (error()) {
        <p class="texto-suave">No se pudieron cargar las diapositivas.</p>
      } @else {
        <p class="texto-suave">Cargando presentación…</p>
      }
    </div>
  `,
})
export class CarruselDiapositivas {
  protected readonly carpeta = CARPETA;
  protected readonly diapositivas = signal<Diapositiva[]>([]);
  protected readonly error = signal(false);
  protected readonly indice = signal(0);
  protected readonly completo = signal(false);
  protected readonly total = computed(() => this.diapositivas().length);
  protected readonly actual = computed<Diapositiva | undefined>(() => this.diapositivas()[this.indice()]);
  protected inicioToque: number | null = null;

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    fetch(`${CARPETA}diapositivas.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: Diapositiva[]) => this.diapositivas.set(d))
      .catch(() => this.error.set(true));

    // Precarga la siguiente para que el cambio de diapositiva sea inmediato.
    effect(() => {
      const siguiente = this.diapositivas()[this.indice() + 1];
      if (siguiente) new Image().src = CARPETA + siguiente.archivo;
    });
  }

  protected anterior(): void {
    this.indice.update((i) => Math.max(0, i - 1));
  }

  protected siguiente(): void {
    this.indice.update((i) => Math.min(this.total() - 1, i + 1));
  }

  protected finToque(x: number): void {
    if (this.inicioToque == null) return;
    const dx = x - this.inicioToque;
    this.inicioToque = null;
    if (dx > UMBRAL_DESLIZAR) this.anterior();
    else if (dx < -UMBRAL_DESLIZAR) this.siguiente();
  }

  protected alternarCompleto(): void {
    if (this.completo()) {
      this.completo.set(false);
      if (document.fullscreenElement) void document.exitFullscreen();
      return;
    }
    this.completo.set(true);
    // Donde no existe la API (p. ej. Safari en iPhone) queda el visor fijo a toda la ventana.
    const carrusel = this.host.nativeElement.querySelector<HTMLElement>('.carrusel');
    carrusel?.requestFullscreen?.().catch(() => undefined);
  }

  protected alSalirDePantallaCompleta(): void {
    if (!document.fullscreenElement) this.completo.set(false);
  }

  protected tecla(evento: KeyboardEvent): void {
    const enFoco = this.host.nativeElement.contains(document.activeElement);
    if (!this.completo() && !enFoco) return;
    const acciones: Record<string, () => void> = {
      ArrowLeft: () => this.anterior(),
      ArrowRight: () => this.siguiente(),
      Home: () => this.indice.set(0),
      End: () => this.indice.set(this.total() - 1),
      Escape: () => this.completo() && this.alternarCompleto(),
    };
    const accion = acciones[evento.key];
    if (accion) {
      evento.preventDefault();
      accion();
    }
  }
}
