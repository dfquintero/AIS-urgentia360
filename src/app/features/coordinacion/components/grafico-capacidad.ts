import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgxEchartsDirective } from 'ngx-echarts';

export interface PuntoCapacidad {
  etiqueta: string;
  turnos: number;
  medicos: number;
  enfermeria: number;
  pico: boolean;
}

@Component({
  selector: 'app-grafico-capacidad',
  imports: [NgxEchartsDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div echarts class="grafico" [options]="opciones()"></div>`,
})
export class GraficoCapacidad {
  readonly datos = input.required<PuntoCapacidad[]>();

  protected readonly opciones = computed(() => {
    const d = this.datos();
    return {
      animation: false,
      textStyle: { fontFamily: 'inherit' },
      tooltip: { trigger: 'axis' },
      legend: { bottom: 0 },
      grid: { left: 44, right: 12, top: 24, bottom: 56 },
      xAxis: { type: 'category', data: d.map((p) => p.etiqueta), axisLabel: { fontSize: 10 } },
      yAxis: { type: 'value', minInterval: 1 },
      series: [
        {
          name: 'Turnos generados',
          type: 'bar',
          itemStyle: { color: '#0071A3' },
          data: d.map((p) => ({ value: p.turnos, itemStyle: { color: p.pico ? '#0071A3' : '#8ACEFF' } })),
        },
        { name: 'Médicos simulados', type: 'line', smooth: true, itemStyle: { color: '#00B288' }, data: d.map((p) => p.medicos) },
        { name: 'Enfermería simulada', type: 'line', smooth: true, itemStyle: { color: '#002F87' }, data: d.map((p) => p.enfermeria) },
      ],
    };
  });
}
