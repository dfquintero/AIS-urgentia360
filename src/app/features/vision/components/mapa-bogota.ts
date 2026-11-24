import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { BOGOTA, CentroRed, Punto } from '../../../core/domain/red';

const x = (lon: number) => +((lon - BOGOTA.oeste) * 1000).toFixed(1);
const y = (lat: number) => +((BOGOTA.norte - lat) * 1000).toFixed(1);
const linea = (puntos: readonly (readonly [number, number])[]) => puntos.map(([lat, lon]) => `${x(lon)},${y(lat)}`).join(' ');

const BORDE_ORIENTAL = [
  [4.83, -74.03], [4.76, -74.02], [4.71, -74.025], [4.66, -74.04], [4.62, -74.05], [4.58, -74.06], [4.55, -74.08], [4.5, -74.1], [4.49, -74.13],
] as const;
const CASCO_URBANO = linea([
  ...BORDE_ORIENTAL, [4.53, -74.16], [4.57, -74.18], [4.6, -74.21], [4.63, -74.2], [4.67, -74.17], [4.7, -74.16], [4.73, -74.13], [4.77, -74.1], [4.82, -74.07],
]);
const CERROS = `${linea(BORDE_ORIENTAL)} ${x(BOGOTA.este)},${y(BOGOTA.sur)} ${x(BOGOTA.este)},${y(BOGOTA.norte)}`;
const RIO = linea([[4.84, -74.09], [4.8, -74.1], [4.74, -74.135], [4.7, -74.168], [4.66, -74.178], [4.62, -74.207], [4.58, -74.22]]);
const VIAS = [
  linea([[4.83, -74.042], [4.7, -74.055], [4.62, -74.072], [4.56, -74.1], [4.5, -74.112]]),
  linea([[4.76, -74.07], [4.7, -74.11], [4.63, -74.142], [4.56, -74.152]]),
  linea([[4.612, -74.07], [4.68, -74.14]]),
  linea([[4.612, -74.09], [4.632, -74.17], [4.62, -74.2]]),
  linea([[4.668, -74.06], [4.722, -74.12]]),
  linea([[4.69, -74.06], [4.62, -74.1], [4.58, -74.15], [4.6, -74.19]]),
];

/** Mapa esquemático de Bogotá en SVG (sin teselas ni internet). Tocar el mapa mueve el punto de partida. */
@Component({
  selector: 'app-mapa-bogota',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg class="mapa-bogota" viewBox="0 0 220 380" role="img" [attr.aria-label]="'Mapa esquemático de Bogotá con ' + centros().length + ' centros ficticios'" (click)="tocar($event)">
      <rect width="220" height="380" class="mapa-fondo" />
      <polygon [attr.points]="cerros" class="mapa-cerros" />
      <polygon [attr.points]="casco" class="mapa-casco" />
      <polyline [attr.points]="rio" class="mapa-rio" />
      @for (v of vias; track $index) {
        <polyline [attr.points]="v" class="mapa-via" />
      }
      @if (ruta(); as r) {
        <line [attr.x1]="r.x1" [attr.y1]="r.y1" [attr.x2]="r.x2" [attr.y2]="r.y2" class="mapa-ruta" />
      }
      @for (c of marcadores(); track c.id) {
        <g [attr.transform]="'translate(' + c.x + ' ' + c.y + ')'" [class.mapa-destacado]="c.id === destacado()">
          <circle r="7.5" class="mapa-centro" />
          <text class="mapa-numero" text-anchor="middle" dy="3">{{ c.n }}</text>
        </g>
      }
      <g [attr.transform]="'translate(' + origenXY().x + ' ' + origenXY().y + ')'">
        <circle r="11" class="mapa-pulso" />
        <circle r="5" class="mapa-origen" />
      </g>
      <text x="200" y="40" class="mapa-texto" text-anchor="end">Cerros</text>
      <text x="8" y="372" class="mapa-texto">Mapa esquemático · no a escala</text>
    </svg>
  `,
})
export class MapaBogota {
  readonly centros = input.required<readonly CentroRed[]>();
  readonly origen = input.required<Punto>();
  readonly destacado = input<string | null>(null);
  readonly mostrarRuta = input(false);
  readonly elegir = output<Punto>();

  protected readonly casco = CASCO_URBANO;
  protected readonly cerros = CERROS;
  protected readonly rio = RIO;
  protected readonly vias = VIAS;

  protected readonly marcadores = computed(() =>
    this.centros().map((c, i) => ({ id: c.id, n: i + 1, x: x(c.posicion.lon), y: y(c.posicion.lat) })),
  );
  protected readonly origenXY = computed(() => ({ x: x(this.origen().lon), y: y(this.origen().lat) }));
  protected readonly ruta = computed(() => {
    const destino = this.mostrarRuta() && this.marcadores().find((m) => m.id === this.destacado());
    return destino ? { x1: this.origenXY().x, y1: this.origenXY().y, x2: destino.x, y2: destino.y } : null;
  });

  protected tocar(evento: MouseEvent): void {
    const svg = evento.currentTarget as SVGSVGElement;
    const matriz = svg.getScreenCTM();
    if (!matriz) return;
    const p = new DOMPoint(evento.clientX, evento.clientY).matrixTransform(matriz.inverse());
    this.elegir.emit({ lat: BOGOTA.norte - p.y / 1000, lon: BOGOTA.oeste + p.x / 1000 });
  }
}
