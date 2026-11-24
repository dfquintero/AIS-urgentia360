import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { DefinicionAns } from '../../core/domain/ans';
import { AnalisisService } from '../../core/services/analisis.service';
import { UrgenciasStore } from '../../core/services/urgencias.store';
import { PanelUmbrales } from './components/panel-umbrales';

@Component({
  selector: 'app-configuracion-page',
  imports: [MatCardModule, PanelUmbrales],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="pagina pila">
      <header class="encabezado-pagina">
        <div>
          <h1>Configuración</h1>
          <p class="texto-suave">Umbrales de alerta y metas, en un solo lugar · valores ilustrativos hasta validación institucional</p>
        </div>
      </header>

      <app-panel-umbrales
        [umbrales]="store.umbrales()"
        [metas]="store.metasTriage()"
        (cambio)="store.actualizarUmbral($event.etapa, $event.umbral)"
        (cambioMeta)="store.actualizarMetaTriage($event.nivel, $event.minutos)"
        (restablecer)="store.restablecerUmbrales()"
      />

      <mat-card appearance="outlined">
        <mat-card-header>
          <mat-card-title>Metas operativas de ANS</mat-card-title>
          <mat-card-subtitle>Institucionales y por definir: escriba un valor para simular su seguimiento en la pestaña ANS</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content class="pila">
          <label class="objetivo-ans">
            Objetivo de cumplimiento
            <input type="number" min="1" max="100" [value]="store.objetivoAns()" (change)="cambiarObjetivo($any($event.target).value)" aria-label="Objetivo de cumplimiento en porcentaje" />
            %
          </label>
          <table class="tabla-simple">
            <thead><tr><th>Indicador</th><th>Meta (min)</th></tr></thead>
            <tbody>
              @for (d of operativas(); track d.id) {
                <tr>
                  <td><strong>{{ d.nombre }}</strong><span class="texto-suave bloque">{{ d.descripcion }}</span></td>
                  <td>
                    <input class="meta-ans" type="number" min="0" placeholder="Por definir" [value]="a.metaAns(d) ?? ''" (change)="cambiarMeta(d, $any($event.target).value)" [attr.aria-label]="'Meta ' + d.nombre" />
                  </td>
                </tr>
              }
            </tbody>
          </table>
          <span class="texto-suave">Las metas de Triage III a V se editan arriba, junto con los umbrales. Los ANS contractuales no están disponibles.</span>
        </mat-card-content>
      </mat-card>
    </section>
  `,
})
export class ConfiguracionPage {
  protected readonly store = inject(UrgenciasStore);
  protected readonly a = inject(AnalisisService);
  protected readonly operativas = computed(() => this.a.ans().map((f) => f.d).filter((d) => d.editable && !d.id.startsWith('T-')));

  protected cambiarMeta(d: DefinicionAns, valor: string): void {
    const numero = valor.trim() === '' ? null : Number(valor);
    if (numero == null || Number.isFinite(numero)) this.a.actualizarMetaAns(d, numero);
  }

  protected cambiarObjetivo(valor: string): void {
    const n = Number(valor);
    if (Number.isFinite(n)) this.store.objetivoAns.set(Math.min(100, Math.max(1, Math.round(n))));
  }
}
