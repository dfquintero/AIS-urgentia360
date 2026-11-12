import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSliderModule } from '@angular/material/slider';
import { ETAPAS, UMBRALES_INICIALES } from '../../../core/data/catalogos';
import { EtapaId, Umbral, Umbrales } from '../../../core/models/urgencias.models';

export interface CambioUmbral {
  etapa: EtapaId;
  umbral: Umbral;
}

@Component({
  selector: 'app-panel-umbrales',
  imports: [MatButtonModule, MatCardModule, MatSliderModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './panel-umbrales.html',
})
export class PanelUmbrales {
  readonly umbrales = input.required<Umbrales>();
  readonly cambio = output<CambioUmbral>();
  readonly restablecer = output<void>();

  protected readonly etapas = ETAPAS.map((e) => ({ ...e, maximo: UMBRALES_INICIALES[e.id].rojo * 2 }));

  protected actualizar(etapa: EtapaId, campo: keyof Umbral, valor: number | string): void {
    const numero = Number(valor);
    if (!Number.isFinite(numero)) return;
    this.cambio.emit({ etapa, umbral: { ...this.umbrales()[etapa], [campo]: numero } });
  }
}
