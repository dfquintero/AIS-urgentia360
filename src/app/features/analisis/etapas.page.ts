import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { AnalisisService } from '../../core/services/analisis.service';
import { MinutosPipe } from '../../shared/pipes/minutos.pipe';
import { FiltrosAnalisis } from './components/filtros-analisis';
import { GraficoTiempos } from './components/grafico-tiempos';

@Component({
  selector: 'app-etapas-page',
  imports: [MatCardModule, MinutosPipe, FiltrosAnalisis, GraficoTiempos],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="pagina pila">
      <header class="encabezado-pagina">
        <div>
          <h1>Etapas</h1>
          <p class="texto-suave">Dónde se acumula la espera · el p90 muestra la cola larga que el promedio esconde</p>
        </div>
      </header>
      <app-filtros-analisis />

      <mat-card appearance="outlined">
        <mat-card-header>
          <mat-card-title>Ranking de etapas por espera</mat-card-title>
          <mat-card-subtitle>Espera = llegada a la etapa → inicio de atención (en conducta: hasta el egreso)</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content class="tabla-contenedor">
          <table class="tabla-simple tabla-ranking">
            <thead>
              <tr><th>#</th><th>Etapa</th><th>Promedio</th><th>Mediana</th><th>p90</th><th class="col-barra">Mediana → p90</th><th>En cola ahora</th><th>n</th></tr>
            </thead>
            <tbody>
              @for (r of a.ranking(); track r.id; let i = $index) {
                <tr [class.fila-cuello]="i === 0">
                  <td>{{ i + 1 }}</td>
                  <td><strong>{{ r.nombre }}</strong></td>
                  <td class="numero">{{ r.promedio | minutos }}</td>
                  <td class="numero">{{ r.mediana | minutos }}</td>
                  <td class="numero">{{ r.p90 | minutos }}</td>
                  <td class="col-barra">
                    <div class="barra-rango">
                      <span class="barra-mediana" [style.width.%]="((r.mediana ?? 0) / maximo()) * 100"></span>
                      <span class="barra-p90" [style.width.%]="(((r.p90 ?? 0) - (r.mediana ?? 0)) / maximo()) * 100"></span>
                    </div>
                  </td>
                  <td class="numero">{{ r.enCola }}</td>
                  <td class="texto-suave">{{ r.n }}</td>
                </tr>
              }
            </tbody>
          </table>
        </mat-card-content>
      </mat-card>

      <mat-card appearance="outlined">
        <mat-card-header>
          <mat-card-title>Espera y atención por etapa</mat-card-title>
          <mat-card-subtitle>
            Promedio en minutos.
            @if (a.cuello(); as c) {
              Mayor espera: <strong class="texto-alerta">{{ c.nombre }}</strong> (en rojo).
            }
          </mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <app-grafico-tiempos [promedios]="a.promedios()" [cuello]="a.cuello()?.id ?? null" />
        </mat-card-content>
      </mat-card>
    </section>
  `,
})
export class EtapasPage {
  protected readonly a = inject(AnalisisService);
  protected readonly maximo = computed(() => Math.max(1, ...this.a.ranking().map((r) => r.p90 ?? 0)));
}
