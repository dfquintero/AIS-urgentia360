import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { NgxEchartsDirective } from 'ngx-echarts';
import { DEFINICIONES_ANS, DefinicionAns, evaluarAns, tendenciaDiaria } from '../../core/domain/ans';
import { NivelTriageId } from '../../core/models/urgencias.models';
import { RolService } from '../../core/services/rol.service';
import { UrgenciasStore } from '../../core/services/urgencias.store';
import { HoraPipe } from '../../shared/pipes/hora.pipe';

const NIVELES: Record<string, NivelTriageId> = { 'T-I': 'I', 'T-II': 'II', 'T-III': 'III', 'T-IV': 'IV', 'T-V': 'V' };
const COLORES = ['#C62828', '#EF6C00', '#0071A3', '#00B288', '#002F87', '#8CC63F', '#49C3B1'];
const FORMATO_DIA = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', timeZone: 'America/Bogota' });

@Component({
  selector: 'app-ans-page',
  imports: [MatCardModule, NgxEchartsDirective, HoraPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ans.page.html',
})
export class AnsPage {
  protected readonly store = inject(UrgenciasStore);
  protected readonly roles = inject(RolService);

  private readonly episodios = computed(() => {
    const minuto = Math.floor(this.store.ahora() / 60_000);
    return minuto >= 0 ? this.store.episodios() : [];
  });

  protected meta(d: DefinicionAns): number | null {
    const nivel = NIVELES[d.id];
    return nivel ? this.store.metasTriage()[nivel] : this.store.metasAns()[d.id];
  }

  protected readonly filas = computed(() => {
    const objetivo = this.store.objetivoAns();
    return DEFINICIONES_ANS.map((d) => {
      const meta = this.meta(d);
      const r = evaluarAns(d, meta, this.episodios());
      const estado = d.tipo === 'Contractual' ? 'No disponible' : meta == null ? 'Meta por definir' : r.cumplimiento == null ? 'Sin datos' : r.cumplimiento >= objetivo ? 'Cumple' : 'No cumple';
      return { d, meta, ...r, estado };
    });
  });

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

  protected cambiarMeta(d: DefinicionAns, valor: string): void {
    const numero = valor.trim() === '' ? null : Number(valor);
    if (numero != null && !Number.isFinite(numero)) return;
    const nivel = NIVELES[d.id];
    if (nivel) this.store.actualizarMetaTriage(nivel, numero);
    else this.store.actualizarMetaAns(d.id, numero);
  }

  protected cambiarObjetivo(valor: string): void {
    const n = Number(valor);
    if (Number.isFinite(n)) this.store.objetivoAns.set(Math.min(100, Math.max(1, Math.round(n))));
  }
}
