import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CeldaCalor } from '../../../core/domain/cuellos';
import { MinutosPipe } from '../../../shared/pipes/minutos.pipe';

/** Tabla de doble entrada coloreada según la espera (más oscuro = más espera). */
@Component({
  selector: 'app-tabla-calor',
  imports: [MinutosPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tabla-contenedor">
      <table class="tabla-calor">
        <thead>
          <tr>
            <th>{{ etiquetaFilas() }}</th>
            @for (c of columnas(); track c) { <th>{{ c }}</th> }
          </tr>
        </thead>
        <tbody>
          @for (f of filas(); track f) {
            <tr>
              <th>{{ prefijo() }}{{ f }}</th>
              @for (c of columnas(); track c) {
                @let celda = indice().get(f + '|' + c);
                <td [style.background]="color(celda?.valor ?? null)" [class.celda-oscura]="(celda?.valor ?? 0) > maximo() * 0.55" [attr.title]="'n = ' + (celda?.n ?? 0)">
                  {{ celda?.valor | minutos }}
                </td>
              }
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class TablaCalor {
  readonly celdas = input.required<CeldaCalor[]>();
  readonly etiquetaFilas = input('');
  readonly prefijo = input('');

  protected readonly filas = computed(() => [...new Set(this.celdas().map((c) => c.fila))]);
  protected readonly columnas = computed(() => [...new Set(this.celdas().map((c) => c.columna))]);
  protected readonly indice = computed(() => new Map(this.celdas().map((c) => [`${c.fila}|${c.columna}`, c])));
  protected readonly maximo = computed(() => Math.max(1, ...this.celdas().map((c) => c.valor ?? 0)));

  protected color(valor: number | null): string {
    if (valor == null) return '#f4f7fb';
    const t = Math.min(1, valor / this.maximo());
    return `rgba(198, 40, 40, ${0.08 + t * 0.8})`;
  }
}
