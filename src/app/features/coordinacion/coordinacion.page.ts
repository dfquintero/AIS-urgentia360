import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { NIVELES_TRIAGE } from '../../core/data/catalogos';
import { bloqueDe, cuelloDeBotella, esperaPostTriage, formatoDuracion, promedio, promediosPorEtapa, tiemposClave } from '../../core/domain/indicadores';
import { Episodio, NivelTriageId } from '../../core/models/urgencias.models';
import { RolService } from '../../core/services/rol.service';
import { UrgenciasStore } from '../../core/services/urgencias.store';
import { HoraPipe } from '../../shared/pipes/hora.pipe';
import { MinutosPipe } from '../../shared/pipes/minutos.pipe';
import { FlujoEtapas } from '../../shared/ui/flujo-etapas';
import { TarjetaKpi } from '../../shared/ui/tarjeta-kpi';
import { GraficoCapacidad, PuntoCapacidad } from './components/grafico-capacidad';
import { DatoServicio, GraficoServicios } from './components/grafico-servicios';
import { GraficoTiempos } from './components/grafico-tiempos';
import { PanelUmbrales } from './components/panel-umbrales';

const MIN = 60_000;
const BLOQUES_VISIBLES = 18;

@Component({
  selector: 'app-coordinacion-page',
  imports: [MatCardModule, MatSelectModule, HoraPipe, MinutosPipe, FlujoEtapas, TarjetaKpi, GraficoCapacidad, GraficoServicios, GraficoTiempos, PanelUmbrales],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './coordinacion.page.html',
})
export class CoordinacionPage {
  protected readonly store = inject(UrgenciasStore);
  protected readonly roles = inject(RolService);
  protected readonly niveles = NIVELES_TRIAGE;
  protected readonly filtroTriage = signal<NivelTriageId | 'todas'>('todas');
  protected readonly filtroFranja = signal<'todas' | 'Pico simulado' | 'Valle simulado'>('todas');

  private readonly cumpleFiltros = computed(() => {
    const triage = this.filtroTriage();
    const franja = this.filtroFranja();
    return (e: Episodio) =>
      (triage === 'todas' || e.triage === triage) &&
      (franja === 'todas' || bloqueDe(e.historial[0].llegada, this.store.capacidad)?.franja === franja);
  });

  /** Episodios del periodo simulado transcurrido, con los filtros aplicados. */
  protected readonly episodios = computed(() => this.store.episodios().filter(this.cumpleFiltros()));
  protected readonly filas = computed(() => this.store.filas().filter((f) => this.cumpleFiltros()(f.episodio)));
  private readonly ids = computed(() => new Set(this.episodios().map((e) => e.id)));

  protected readonly promedios = computed(() => promediosPorEtapa(this.episodios(), this.store.ahora()));
  protected readonly cuello = computed(() => cuelloDeBotella(this.promedios()));

  protected readonly alertas = computed(() => ({
    rojo: this.filas().filter((f) => f.alerta.nivel === 'rojo').length,
    amarillo: this.filas().filter((f) => f.alerta.nivel === 'amarillo').length,
  }));

  protected readonly tiempos = computed(() => {
    const t = this.episodios().map(tiemposClave);
    return {
      turnoATriage: promedio(t.map((x) => x.turnoATriage)),
      finTriageAMedico: promedio(t.map((x) => x.finTriageAMedico)),
      estancia: promedio(t.map((x) => x.estanciaTotal)),
    };
  });

  /** Comparación ilustrativa con la referencia normativa de Triage II (no evalúa cumplimiento real). */
  protected readonly triageII = computed(() => {
    const ahora = this.store.ahora();
    const casos = this.episodios().filter((e) => e.triage === 'II');
    const fuera = casos.filter((e) => (esperaPostTriage(e, ahora) ?? 0) > 30).length;
    return { total: casos.length, fuera };
  });

  protected readonly ordenes = computed(() => {
    const ids = this.ids();
    const propias = this.store.ordenes().filter((o) => ids.has(o.episodioId));
    const conResultado = propias.filter((o) => o.disponible != null && o.estado !== 'Solicitada' && o.estado !== 'En proceso');
    return {
      pendientes: propias.filter((o) => o.estado !== 'Revisada').length,
      solicitudAResultado: promedio(conResultado.map((o) => (o.disponible! - o.solicitud) / MIN)),
    };
  });

  protected readonly demanda = computed<DatoServicio[]>(() => {
    const conteo = new Map<string, number>();
    for (const e of this.episodios()) conteo.set(e.demanda, (conteo.get(e.demanda) ?? 0) + 1);
    return [...conteo].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  });

  protected readonly capacidad = computed<PuntoCapacidad[]>(() => {
    const ahora = this.store.ahora();
    const bloques = this.store.capacidad.filter((b) => b.inicio <= ahora).slice(-BLOQUES_VISIBLES);
    const formato = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', timeZone: 'America/Bogota' });
    return bloques.map((b) => {
      const fin = b.inicio + 4 * 60 * MIN;
      return {
        etiqueta: formato.format(b.inicio),
        turnos: this.episodios().filter((e) => e.historial[0].llegada >= b.inicio && e.historial[0].llegada < fin).length,
        medicos: b.medicos,
        enfermeria: b.enfermeria,
        pico: b.franja === 'Pico simulado',
      };
    });
  });

  protected readonly formatoDuracion = formatoDuracion;
}
