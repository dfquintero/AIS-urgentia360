import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgxEchartsDirective } from 'ngx-echarts';
import { BloqueCarga } from '../../../core/domain/cuellos';

const FORMATO = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', timeZone: 'America/Bogota' });

@Component({
  selector: 'app-grafico-carga',
  imports: [NgxEchartsDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div echarts class="grafico" [options]="opciones()"></div>`,
})
export class GraficoCarga {
  readonly bloques = input.required<BloqueCarga[]>();

  protected readonly opciones = computed(() => {
    const b = this.bloques();
    return {
      animation: false,
      textStyle: { fontFamily: 'inherit' },
      tooltip: { trigger: 'axis' },
      legend: { bottom: 0 },
      grid: { left: 48, right: 56, top: 28, bottom: 56 },
      xAxis: { type: 'category', data: b.map((x) => FORMATO.format(x.inicio)), axisLabel: { fontSize: 10 } },
      yAxis: [
        { type: 'value', name: 'turnos / médico' },
        { type: 'value', name: 'min', position: 'right' },
      ],
      series: [
        {
          name: 'Turnos por médico simulado',
          type: 'bar',
          data: b.map((x) => ({ value: x.turnosPorMedico, itemStyle: { color: x.pico ? '#0071A3' : '#8ACEFF' } })),
        },
        { name: 'Espera a valoración médica', type: 'line', yAxisIndex: 1, smooth: true, itemStyle: { color: '#C62828' }, data: b.map((x) => x.esperaMedico) },
      ],
    };
  });
}
