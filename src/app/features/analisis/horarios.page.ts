import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { AnalisisService } from '../../core/services/analisis.service';
import { FiltrosAnalisis } from './components/filtros-analisis';
import { GraficoCarga } from './components/grafico-carga';
import { GraficoMapaHoras } from './components/grafico-mapa-horas';

@Component({
  selector: 'app-horarios-page',
  imports: [MatCardModule, FiltrosAnalisis, GraficoCarga, GraficoMapaHoras],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="pagina pila">
      <header class="encabezado-pagina">
        <div>
          <h1>Horarios</h1>
          <p class="texto-suave">Cuándo se forma la espera y si coincide con poca capacidad simulada</p>
        </div>
      </header>
      <app-filtros-analisis />

      <mat-card appearance="outlined">
        <mat-card-header>
          <mat-card-title>Espera por etapa y hora de llegada</mat-card-title>
          <mat-card-subtitle>Espera promedio según la hora (Bogotá) en que el paciente llega a cada etapa</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <app-grafico-mapa-horas [celdas]="a.horas()" />
        </mat-card-content>
      </mat-card>

      <mat-card appearance="outlined">
        <mat-card-header>
          <mat-card-title>Demanda frente a capacidad</mat-card-title>
          <mat-card-subtitle>Turnos por médico en bloques de 4 h (claro: valle) y espera a la valoración. Dotación hipotética, no de la CUC.</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <app-grafico-carga [bloques]="a.carga()" />
        </mat-card-content>
      </mat-card>
    </section>
  `,
})
export class HorariosPage {
  protected readonly a = inject(AnalisisService);
}
