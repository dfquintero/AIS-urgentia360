import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgxEchartsDirective } from 'ngx-echarts';

export interface DatoServicio {
  name: string;
  value: number;
}

// Gama del símbolo Keralty (manual de identidad, sección 3.6).
const PALETA = ['#002F87', '#0071A3', '#00B4E3', '#00B288', '#49C3B1', '#8CC63F', '#3E8EDE', '#4E9D2D'];

@Component({
  selector: 'app-grafico-servicios',
  imports: [NgxEchartsDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div echarts class="grafico" [options]="opciones()"></div>`,
})
export class GraficoServicios {
  readonly datos = input.required<DatoServicio[]>();

  protected readonly opciones = computed(() => ({
    animation: false,
    color: PALETA,
    textStyle: { fontFamily: 'inherit' },
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0, type: 'scroll' },
    series: [
      {
        type: 'pie',
        radius: ['45%', '72%'],
        center: ['50%', '44%'],
        label: { formatter: '{c}' },
        data: this.datos(),
      },
    ],
  }));
}
