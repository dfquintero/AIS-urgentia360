import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { ETAPA_POR_ID } from '../../../core/data/catalogos';
import { estadoPublico, tiemposClave } from '../../../core/domain/indicadores';
import { Alerta, Episodio, EventoEpisodio } from '../../../core/models/urgencias.models';
import { OrdenVisible } from '../../../core/services/urgencias.store';
import { HoraPipe } from '../../../shared/pipes/hora.pipe';
import { MinutosPipe } from '../../../shared/pipes/minutos.pipe';
import { InsigniaAlerta } from '../../../shared/ui/insignia-alerta';
import { InsigniaTriage } from '../../../shared/ui/insignia-triage';
import { QrPaciente } from '../../../shared/ui/qr-paciente';
import { TarjetaKpi } from '../../../shared/ui/tarjeta-kpi';

const MIN = 60_000;

@Component({
  selector: 'app-detalle-episodio',
  imports: [MatCardModule, HoraPipe, MinutosPipe, InsigniaAlerta, InsigniaTriage, QrPaciente, TarjetaKpi],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './detalle-episodio.html',
})
export class DetalleEpisodio {
  readonly episodio = input.required<Episodio>();
  readonly eventos = input.required<EventoEpisodio[]>();
  readonly ordenes = input.required<OrdenVisible[]>();
  readonly alerta = input<Alerta | null>(null);
  readonly ahora = input.required<number>();

  protected readonly estado = computed(() => estadoPublico(this.episodio()));
  protected readonly tiempos = computed(() => tiemposClave(this.episodio()));
  protected readonly hitos = computed(() =>
    this.episodio().historial
      .filter((r) => r.etapa !== 'punto0')
      .map((r) => ({
        ...r,
        nombre: ETAPA_POR_ID[r.etapa].nombre,
        sistema: ETAPA_POR_ID[r.etapa].sistema,
        espera: ((r.entrada ?? this.ahora()) - r.llegada) / MIN,
        atencion: r.entrada != null ? ((r.salida ?? this.ahora()) - r.entrada) / MIN : null,
      })),
  );
}
