import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterLink } from '@angular/router';
import { UrgenciasStore } from '../../core/services/urgencias.store';
import { FlujoEtapas } from '../../shared/ui/flujo-etapas';
import { TableroPacientes } from './components/tablero-pacientes';

@Component({
  selector: 'app-pacientes-page',
  imports: [MatButtonModule, RouterLink, FlujoEtapas, TableroPacientes],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="pagina pila">
      <header class="encabezado-pagina">
        <div>
          <h1>Pacientes en urgencias</h1>
          <p class="texto-suave">Episodios activos con su etapa, tiempo y alerta · seleccione una fila para registrar un hito</p>
        </div>
        <a mat-flat-button routerLink="/registro">Registro QR</a>
      </header>
      <app-flujo-etapas [filas]="store.filas()" />
      <app-tablero-pacientes [filas]="store.filas()" (seleccionar)="registrar($event)" />
    </section>
  `,
})
export class PacientesPage {
  protected readonly store = inject(UrgenciasStore);
  private readonly router = inject(Router);

  protected registrar(turno: string): void {
    this.router.navigate(['/registro'], { queryParams: { codigo: turno } });
  }
}
