import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { GRUPOS_EDAD, NIVELES_TRIAGE, TIPOS_DEMANDA } from '../../core/data/catalogos';
import { cargaVsEspera, cortePorGrupo, desgloseOrdenes, mapaCalorHoras, rankingEtapas, resumenCuello } from '../../core/domain/cuellos';
import { UrgenciasStore } from '../../core/services/urgencias.store';
import { HoraPipe } from '../../shared/pipes/hora.pipe';
import { MinutosPipe } from '../../shared/pipes/minutos.pipe';
import { GraficoCarga } from './components/grafico-carga';
import { GraficoMapaHoras } from './components/grafico-mapa-horas';
import { GraficoOrdenes } from './components/grafico-ordenes';
import { TablaCalor } from './components/tabla-calor';

type Ventana = 'periodo' | '72h' | '24h';
const HORA = 3_600_000;
const VENTANAS: Record<Ventana, number> = { periodo: Infinity, '72h': 72 * HORA, '24h': 24 * HORA };

@Component({
  selector: 'app-cuellos-page',
  imports: [MatButtonToggleModule, MatCardModule, HoraPipe, MinutosPipe, GraficoCarga, GraficoMapaHoras, GraficoOrdenes, TablaCalor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cuellos.page.html',
})
export class CuellosPage {
  protected readonly store = inject(UrgenciasStore);
  protected readonly ventana = signal<Ventana>('periodo');

  /** Recalcula como máximo una vez por minuto simulado: los agregados no cambian segundo a segundo. */
  private readonly ahora = computed(() => Math.floor(this.store.ahora() / 60_000) * 60_000);

  protected readonly episodios = computed(() => {
    const desde = this.ahora() - VENTANAS[this.ventana()];
    return this.store.episodios().filter((e) => e.historial[0].llegada >= desde);
  });

  protected readonly ranking = computed(() => rankingEtapas(this.episodios(), this.store.activos(), this.ahora()));
  protected readonly maximoRanking = computed(() => Math.max(1, ...this.ranking().map((r) => r.p90 ?? 0)));
  protected readonly horas = computed(() => mapaCalorHoras(this.episodios(), this.ahora()));
  protected readonly porTriage = computed(() => cortePorGrupo(this.episodios(), this.ahora(), (e) => e.triage, NIVELES_TRIAGE));
  protected readonly porDemanda = computed(() => cortePorGrupo(this.episodios(), this.ahora(), (e) => e.demanda, TIPOS_DEMANDA));
  protected readonly porEdad = computed(() => cortePorGrupo(this.episodios(), this.ahora(), (e) => e.grupoEdad, GRUPOS_EDAD));
  protected readonly ordenes = computed(() => {
    const ids = new Set(this.episodios().map((e) => e.id));
    return desgloseOrdenes(this.store.ordenes().filter((o) => ids.has(o.episodioId)), this.ahora());
  });
  protected readonly carga = computed(() => cargaVsEspera(this.episodios(), this.store.capacidad, this.ahora()).slice(-18));
  protected readonly resumen = computed(() => resumenCuello(this.ranking(), this.horas(), this.porTriage()));
}
