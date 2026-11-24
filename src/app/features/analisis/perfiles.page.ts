import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { AnalisisService } from '../../core/services/analisis.service';
import { FiltrosAnalisis } from './components/filtros-analisis';
import { GraficoServicios } from './components/grafico-servicios';
import { TablaCalor } from './components/tabla-calor';

type Corte = 'triage' | 'demanda' | 'edad';

@Component({
  selector: 'app-perfiles-page',
  imports: [MatButtonToggleModule, MatCardModule, FiltrosAnalisis, GraficoServicios, TablaCalor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="pagina pila">
      <header class="encabezado-pagina">
        <div>
          <h1>Perfiles</h1>
          <p class="texto-suave">Para quién se acumula la espera en cada etapa</p>
        </div>
      </header>
      <app-filtros-analisis />

      <div class="grid-coordinacion">
        <mat-card appearance="outlined" class="ancho-doble">
          <mat-card-header>
            <mat-card-title>Espera promedio por etapa</mat-card-title>
            <mat-card-subtitle>Pase el cursor sobre una celda para ver el número de casos</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content class="pila">
            <mat-button-toggle-group hideSingleSelectionIndicator [value]="corte()" (change)="corte.set($event.value)" aria-label="Corte">
              <mat-button-toggle value="triage">Triage</mat-button-toggle>
              <mat-button-toggle value="demanda">Tipo de demanda</mat-button-toggle>
              <mat-button-toggle value="edad">Grupo de edad</mat-button-toggle>
            </mat-button-toggle-group>
            <app-tabla-calor [celdas]="celdas()" [etiquetaFilas]="etiqueta()" [prefijo]="corte() === 'triage' ? 'T-' : ''" />
          </mat-card-content>
        </mat-card>

        <mat-card appearance="outlined">
          <mat-card-header>
            <mat-card-title>Tipo de demanda</mat-card-title>
            <mat-card-subtitle>Episodios (tipología simulada)</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <app-grafico-servicios [datos]="a.demanda()" />
          </mat-card-content>
        </mat-card>
      </div>
    </section>
  `,
})
export class PerfilesPage {
  protected readonly a = inject(AnalisisService);
  protected readonly corte = signal<Corte>('triage');
  protected readonly celdas = computed(() =>
    this.corte() === 'triage' ? this.a.porTriage() : this.corte() === 'demanda' ? this.a.porDemanda() : this.a.porEdad(),
  );
  protected readonly etiqueta = computed(() => ({ triage: 'Triage', demanda: 'Tipo de demanda', edad: 'Grupo de edad' })[this.corte()]);
}
