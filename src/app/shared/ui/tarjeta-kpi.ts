import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type TonoKpi = 'primario' | 'verde' | 'amarillo' | 'rojo';

@Component({
  selector: 'app-tarjeta-kpi',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="kpi kpi-{{ tono() }}">
      <span class="kpi-titulo">{{ titulo() }}</span>
      <span class="kpi-valor">{{ valor() }}</span>
      @if (detalle()) {
        <span class="kpi-detalle">{{ detalle() }}</span>
      }
    </div>
  `,
})
export class TarjetaKpi {
  readonly titulo = input.required<string>();
  readonly valor = input.required<string | number>();
  readonly detalle = input<string>('');
  readonly tono = input<TonoKpi>('primario');
}
