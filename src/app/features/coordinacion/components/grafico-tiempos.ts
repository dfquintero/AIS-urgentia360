import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgxEchartsDirective } from 'ngx-echarts';
import { PromedioEtapa } from '../../../core/models/urgencias.models';

@Component({
  selector: 'app-grafico-tiempos',
  imports: [NgxEchartsDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div echarts class="grafico" [options]="opciones()"></div>`,
})
export class GraficoTiempos {
  readonly promedios = input.required<PromedioEtapa[]>();
  readonly cuello = input<string | null>(null);

  protected readonly opciones = computed(() => {
    const datos = this.promedios();
    return {
      animation: false,
      textStyle: { fontFamily: 'inherit' },
      tooltip: { trigger: 'axis', valueFormatter: (v: number) => `${v} min` },
      legend: { bottom: 0 },
      grid: { left: 8, right: 8, top: 16, bottom: 40, containLabel: true },
      xAxis: { type: 'category', data: datos.map((d) => d.etapa), axisLabel: { interval: 0 } },
      yAxis: { type: 'value', name: 'min' },
      series: [
        {
          name: 'Espera',
          type: 'bar',
          stack: 'tiempo',
          data: datos.map((d) => ({
            value: d.espera,
            itemStyle: { color: d.id === this.cuello() ? '#C62828' : '#F2A900' },
          })),
        },
        { name: 'Atención', type: 'bar', stack: 'tiempo', itemStyle: { color: '#0071A3' }, data: datos.map((d) => d.atencion) },
      ],
    };
  });
}
