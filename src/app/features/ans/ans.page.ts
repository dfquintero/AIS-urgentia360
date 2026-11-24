import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';
import { NgxEchartsDirective } from 'ngx-echarts';
import { tendenciaDiaria } from '../../core/domain/ans';
import { AnalisisService } from '../../core/services/analisis.service';
import { RolService } from '../../core/services/rol.service';
import { UrgenciasStore } from '../../core/services/urgencias.store';
import { HoraPipe } from '../../shared/pipes/hora.pipe';

const COLORES = ['#C62828', '#EF6C00', '#0071A3', '#00B288', '#002F87', '#8CC63F', '#49C3B1'];
const FORMATO_DIA = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', timeZone: 'America/Bogota' });

@Component({
  selector: 'app-ans-page',
  imports: [MatCardModule, RouterLink, NgxEchartsDirective, HoraPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ans.page.html',
})
export class AnsPage {
  protected readonly store = inject(UrgenciasStore);
  protected readonly roles = inject(RolService);

  private readonly a = inject(AnalisisService);
  protected readonly filas = this.a.ans;
  private readonly episodios = computed(() => (this.a.ahora() >= 0 ? this.store.episodios() : []));

  protected readonly tendencia = computed(() => {
    const medibles = this.filas().filter((f) => f.cumplimiento != null);
    const series = medibles.map((f, i) => ({ f, puntos: tendenciaDiaria(f.d, f.meta, this.episodios()), color: COLORES[i % COLORES.length] }));
    const dias = [...new Set(series.flatMap((s) => s.puntos.map((p) => p.dia)))].sort((a, b) => a - b);
    return {
      animation: false,
      textStyle: { fontFamily: 'inherit' },
      tooltip: { trigger: 'axis', valueFormatter: (v: number) => (v == null ? '—' : `${v} %`) },
      legend: { bottom: 0, type: 'scroll' },
      grid: { left: 48, right: 16, top: 24, bottom: 56 },
      xAxis: { type: 'category', data: dias.map((d) => FORMATO_DIA.format(d)) },
      yAxis: { type: 'value', min: 0, max: 100, name: '% en meta' },
      series: [
        ...series.map((s) => ({
          name: s.f.d.nombre,
          type: 'line',
          connectNulls: true,
          itemStyle: { color: s.color },
          data: dias.map((d) => s.puntos.find((p) => p.dia === d)?.cumplimiento ?? null),
        })),
        {
          name: `Objetivo ${this.store.objetivoAns()} %`,
          type: 'line',
          symbol: 'none',
          lineStyle: { type: 'dashed', color: '#5b6670' },
          itemStyle: { color: '#5b6670' },
          data: dias.map(() => this.store.objetivoAns()),
        },
      ],
    };
  });

}
