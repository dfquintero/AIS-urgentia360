import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgxEchartsDirective } from 'ngx-echarts';
import { PasoOrden } from '../../../core/domain/cuellos';

@Component({
  selector: 'app-grafico-ordenes',
  imports: [NgxEchartsDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div echarts class="grafico" [options]="opciones()"></div>`,
})
export class GraficoOrdenes {
  readonly pasos = input.required<PasoOrden[]>();

  protected readonly opciones = computed(() => {
    const p = this.pasos();
    const serie = (name: string, color: string, f: (x: PasoOrden) => number | null) => ({
      name, type: 'bar', stack: 'total', itemStyle: { color }, label: { show: true, formatter: '{c}' }, data: p.map(f),
    });
    return {
      animation: false,
      textStyle: { fontFamily: 'inherit' },
      tooltip: { trigger: 'axis', valueFormatter: (v: number) => `${v} min` },
      legend: { bottom: 0 },
      grid: { left: 90, right: 16, top: 8, bottom: 48 },
      xAxis: { type: 'value', name: 'min' },
      yAxis: { type: 'category', data: p.map((x) => x.tipo) },
      series: [
        serie('Solicitud → toma', '#8ACEFF', (x) => x.solicitudAToma),
        serie('Toma → resultado', '#0071A3', (x) => x.tomaAResultado),
        serie('Resultado → revisión médica', '#C62828', (x) => x.resultadoARevision),
      ],
    };
  });
}
