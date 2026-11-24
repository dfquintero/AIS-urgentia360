import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSelectModule } from '@angular/material/select';
import { NIVELES_TRIAGE } from '../../../core/data/catalogos';
import { AnalisisService } from '../../../core/services/analisis.service';
import { UrgenciasStore } from '../../../core/services/urgencias.store';
import { HoraPipe } from '../../../shared/pipes/hora.pipe';

/** Filtros compartidos: se conservan al cambiar entre pestañas de análisis. */
@Component({
  selector: 'app-filtros-analisis',
  imports: [MatButtonToggleModule, MatSelectModule, HoraPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="filtros-analisis" role="search" aria-label="Filtros de análisis">
      <mat-button-toggle-group hideSingleSelectionIndicator [value]="a.ventana()" (change)="a.ventana.set($event.value)" aria-label="Ventana de análisis">
        <mat-button-toggle value="periodo">Todo el periodo</mat-button-toggle>
        <mat-button-toggle value="72h">72 h</mat-button-toggle>
        <mat-button-toggle value="24h">24 h</mat-button-toggle>
      </mat-button-toggle-group>
      <mat-form-field subscriptSizing="dynamic">
        <mat-label>Triage</mat-label>
        <mat-select [value]="a.triage()" (valueChange)="a.triage.set($event)">
          <mat-option value="todas">Todos</mat-option>
          @for (n of niveles; track n) {
            <mat-option [value]="n">Triage {{ n }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
      <mat-form-field subscriptSizing="dynamic">
        <mat-label>Franja de llegada</mat-label>
        <mat-select [value]="a.franja()" (valueChange)="a.franja.set($event)">
          <mat-option value="todas">Todas</mat-option>
          <mat-option value="Pico simulado">Pico simulado</mat-option>
          <mat-option value="Valle simulado">Valle simulado</mat-option>
        </mat-select>
      </mat-form-field>
      <span class="texto-suave crece">{{ a.episodios().length }} episodios · hasta {{ store.ahora() | hora: 'fecha-hora' }}</span>
    </div>
  `,
})
export class FiltrosAnalisis {
  protected readonly a = inject(AnalisisService);
  protected readonly store = inject(UrgenciasStore);
  protected readonly niveles = NIVELES_TRIAGE;
}
