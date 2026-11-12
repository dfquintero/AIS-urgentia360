import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { cuelloDeBotella, formatoDuracion, promediosPorEtapa } from '../../core/domain/indicadores';
import { UrgenciasStore } from '../../core/services/urgencias.store';
import { FlujoEtapas } from '../../shared/ui/flujo-etapas';
import { TarjetaKpi } from '../../shared/ui/tarjeta-kpi';
import { DatoServicio, GraficoServicios } from './components/grafico-servicios';
import { GraficoTiempos } from './components/grafico-tiempos';
import { PanelUmbrales } from './components/panel-umbrales';

@Component({
  selector: 'app-coordinacion-page',
  imports: [MatCardModule, FlujoEtapas, TarjetaKpi, GraficoServicios, GraficoTiempos, PanelUmbrales],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './coordinacion.page.html',
})
export class CoordinacionPage {
  protected readonly store = inject(UrgenciasStore);

  protected readonly promedios = computed(() =>
    promediosPorEtapa([...this.store.activos(), ...this.store.egresados()], this.store.ahora()),
  );
  protected readonly cuello = computed(() => cuelloDeBotella(this.promedios()));

  protected readonly alertas = computed(() => {
    const filas = this.store.filas();
    return {
      rojo: filas.filter((f) => f.alerta === 'rojo').length,
      amarillo: filas.filter((f) => f.alerta === 'amarillo').length,
    };
  });

  protected readonly promedioEtapa = computed(() => {
    const conDatos = this.promedios().filter((p) => p.n > 0);
    const total = conDatos.reduce((s, p) => s + p.total, 0);
    return conDatos.length ? Math.round(total / conDatos.length) : 0;
  });

  protected readonly permanenciaEgresados = computed(() => {
    const egresados = this.store.egresados();
    if (!egresados.length) return '—';
    const suma = egresados.reduce((s, p) => s + ((p.egreso ?? 0) - p.historial[0].llegada), 0);
    return formatoDuracion(suma / egresados.length);
  });

  protected readonly servicios = computed<DatoServicio[]>(() => {
    const conteo = new Map<string, number>();
    for (const p of this.store.activos()) conteo.set(p.servicio, (conteo.get(p.servicio) ?? 0) + 1);
    return [...conteo].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  });
}
