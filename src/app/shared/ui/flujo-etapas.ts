import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ETAPAS } from '../../core/data/catalogos';
import { FilaTablero } from '../../core/models/urgencias.models';

@Component({
  selector: 'app-flujo-etapas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ol class="flujo" aria-label="Pacientes por etapa del flujo">
      @for (e of resumen(); track e.id) {
        <li class="flujo-etapa" [class.flujo-obligatoria]="e.obligatoria">
          <span class="flujo-nombre">{{ e.corto }}</span>
          <span class="flujo-total">{{ e.total }}</span>
          <span class="flujo-alertas">
            @if (e.rojo) { <span class="punto alerta-rojo">{{ e.rojo }}</span> }
            @if (e.amarillo) { <span class="punto alerta-amarillo">{{ e.amarillo }}</span> }
            @if (e.obligatoria) { <span class="flujo-nota">Obligatorio</span> }
          </span>
        </li>
      }
    </ol>
  `,
})
export class FlujoEtapas {
  readonly filas = input.required<FilaTablero[]>();

  protected readonly resumen = computed(() =>
    ETAPAS.map((e) => {
      const enEtapa = this.filas().filter((f) => f.etapa.id === e.id);
      return {
        ...e,
        total: enEtapa.length,
        amarillo: enEtapa.filter((f) => f.alerta === 'amarillo').length,
        rojo: enEtapa.filter((f) => f.alerta === 'rojo').length,
      };
    }),
  );
}
