import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NivelAlerta } from '../../core/models/urgencias.models';

const TEXTO: Record<NivelAlerta, string> = { ok: 'En tiempo', amarillo: 'Alerta', rojo: 'Crítico' };

@Component({
  selector: 'app-insignia-alerta',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="insignia alerta-{{ nivel() }}">{{ texto() }}</span>`,
})
export class InsigniaAlerta {
  readonly nivel = input.required<NivelAlerta>();
  protected readonly texto = computed(() => TEXTO[this.nivel()]);
}
