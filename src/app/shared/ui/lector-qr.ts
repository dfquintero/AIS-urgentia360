import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  Injector,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { codigoDesdeQr } from '../../core/domain/qr';

type Decodificador = typeof import('jsqr').default;

const ANCHO_ANALISIS = 640;
const INTERVALO_MS = 150;

@Component({
  selector: 'app-lector-qr',
  imports: [MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (activo()) {
      <div class="lector-qr pila-sm">
        <div class="lector-visor">
          <video #video playsinline muted aria-label="Vista de la cámara"></video>
          <div class="lector-marco" aria-hidden="true"></div>
        </div>
        <span class="texto-suave">Apunte la cámara al código QR.</span>
        <button mat-stroked-button type="button" (click)="cerrar()">Cancelar</button>
      </div>
    } @else {
      <button mat-stroked-button type="button" (click)="abrir()">{{ etiqueta() }}</button>
    }
    @if (error(); as e) {
      <p class="texto-alerta">{{ e }}</p>
    }
  `,
})
export class LectorQr {
  readonly etiqueta = input('Leer QR con la cámara');
  readonly leido = output<string>();

  protected readonly activo = signal(false);
  protected readonly error = signal<string | null>(null);

  private readonly video = viewChild<ElementRef<HTMLVideoElement>>('video');
  private readonly injector = inject(Injector);
  private readonly lienzo = document.createElement('canvas');
  private flujo: MediaStream | null = null;
  private temporizador: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.cerrar());
  }

  protected async abrir(): Promise<void> {
    this.error.set(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      this.error.set(
        window.isSecureContext
          ? 'Este navegador no permite usar la cámara.'
          : 'La cámara solo está disponible en localhost o con HTTPS (npm start -- --ssl).',
      );
      return;
    }
    try {
      const [flujo, jsqr] = await Promise.all([
        navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false }),
        import('jsqr'),
      ]);
      this.flujo = flujo;
      this.activo.set(true);
      afterNextRender(() => this.iniciar(jsqr.default), { injector: this.injector });
    } catch (e) {
      this.cerrar();
      this.error.set(mensajeError(e));
    }
  }

  protected cerrar(): void {
    clearTimeout(this.temporizador);
    this.flujo?.getTracks().forEach((t) => t.stop());
    this.flujo = null;
    this.activo.set(false);
  }

  private async iniciar(decodificar: Decodificador): Promise<void> {
    const video = this.video()?.nativeElement;
    if (!video || !this.flujo) return;
    video.srcObject = this.flujo;
    try {
      await video.play();
    } catch {
      // El flujo pudo cerrarse antes de reproducirse.
    }
    const ctx = this.lienzo.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const analizar = () => {
      if (!this.flujo) return;
      if (video.readyState >= video.HAVE_ENOUGH_DATA && video.videoWidth) {
        const escala = Math.min(1, ANCHO_ANALISIS / video.videoWidth);
        const w = Math.round(video.videoWidth * escala);
        const h = Math.round(video.videoHeight * escala);
        this.lienzo.width = w;
        this.lienzo.height = h;
        ctx.drawImage(video, 0, 0, w, h);
        const qr = decodificar(ctx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: 'dontInvert' });
        if (qr?.data) {
          this.cerrar();
          this.leido.emit(codigoDesdeQr(qr.data));
          return;
        }
      }
      this.temporizador = setTimeout(analizar, INTERVALO_MS);
    };
    analizar();
  }
}

function mensajeError(e: unknown): string {
  const nombre = e instanceof DOMException ? e.name : '';
  if (nombre === 'NotAllowedError') return 'Se negó el permiso de la cámara. Habilítelo en el navegador para leer el QR.';
  if (nombre === 'NotFoundError' || nombre === 'OverconstrainedError') return 'No se encontró una cámara en este dispositivo.';
  if (nombre === 'NotReadableError') return 'La cámara está siendo usada por otra aplicación.';
  return 'No se pudo abrir la cámara.';
}
