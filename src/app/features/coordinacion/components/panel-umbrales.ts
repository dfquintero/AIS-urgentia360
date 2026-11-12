import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSliderModule } from '@angular/material/slider';
import { ETAPAS, METAS_TRIAGE_NORMATIVAS, NIVELES_TRIAGE, UMBRALES_INICIALES } from '../../../core/data/catalogos';
import { EtapaId, MetasTriage, NivelTriageId, Umbral, Umbrales } from '../../../core/models/urgencias.models';

export interface CambioUmbral {
  etapa: EtapaId;
  umbral: Umbral;
}

export interface CambioMeta {
  nivel: NivelTriageId;
  minutos: number | null;
}

@Component({
  selector: 'app-panel-umbrales',
  imports: [MatButtonModule, MatCardModule, MatSliderModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './panel-umbrales.html',
})
export class PanelUmbrales {
  readonly umbrales = input.required<Umbrales>();
  readonly metas = input.required<MetasTriage>();
  readonly cambio = output<CambioUmbral>();
  readonly cambioMeta = output<CambioMeta>();
  readonly restablecer = output<void>();

  protected readonly etapas = ETAPAS.filter((e) => e.id !== 'punto0' && e.id !== 'egreso').map((e) => ({
    ...e,
    maximo: UMBRALES_INICIALES[e.id].rojo * 2,
  }));
  protected readonly niveles = NIVELES_TRIAGE;
  protected readonly normativas = METAS_TRIAGE_NORMATIVAS;

  protected actualizar(etapa: EtapaId, campo: keyof Umbral, valor: number | string): void {
    const numero = Number(valor);
    if (!Number.isFinite(numero)) return;
    this.cambio.emit({ etapa, umbral: { ...this.umbrales()[etapa], [campo]: numero } });
  }

  protected actualizarMeta(nivel: NivelTriageId, valor: string): void {
    const numero = Number(valor);
    this.cambioMeta.emit({ nivel, minutos: valor.trim() === '' || !Number.isFinite(numero) ? null : numero });
  }
}
