import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgxEchartsDirective } from 'ngx-echarts';
import { CeldaCalor, percentil } from '../../../core/domain/cuellos';

@Component({
  selector: 'app-grafico-mapa-horas',
  imports: [NgxEchartsDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div echarts class="grafico grafico-alto" [options]="opciones()"></div>`,
})
export class GraficoMapaHoras {
  readonly celdas = input.required<CeldaCalor[]>();

  protected readonly opciones = computed(() => {
    const celdas = this.celdas();
    const filas = [...new Set(celdas.map((c) => c.fila))].reverse();
    const columnas = [...new Set(celdas.map((c) => c.columna))];
    // Escala hasta el p95 para que valores extremos aislados no apaguen el resto del mapa.
    const maximo = Math.max(1, percentil(celdas.map((c) => c.valor ?? 0).filter((v) => v > 0), 0.95) ?? 1);
    return {
      animation: false,
      textStyle: { fontFamily: 'inherit' },
      tooltip: {
        formatter: (p: { data: [number, number, number | null, number] }) =>
          `${filas[p.data[1]]} · llegada ${columnas[p.data[0]]}:00<br/>Espera promedio: ${p.data[2] ?? '—'} min (n = ${p.data[3]})`,
      },
      grid: { left: 96, right: 16, top: 8, bottom: 72 },
      xAxis: { type: 'category', data: columnas, name: 'Hora de llegada', nameLocation: 'middle', nameGap: 28, splitArea: { show: true } },
      yAxis: { type: 'category', data: filas, splitArea: { show: true } },
      visualMap: {
        min: 0,
        max: Math.ceil(maximo),
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: 0,
        text: ['más espera (min)', 'menos'],
        inRange: { color: ['#E6F2FF', '#F2A900', '#C62828'] },
      },
      series: [
        {
          type: 'heatmap',
          data: celdas
            .filter((c) => c.valor != null)
            .map((c) => [columnas.indexOf(c.columna), filas.indexOf(c.fila), c.valor, c.n]),
          emphasis: { itemStyle: { borderColor: '#002F87', borderWidth: 1 } },
        },
      ],
    };
  });
}
