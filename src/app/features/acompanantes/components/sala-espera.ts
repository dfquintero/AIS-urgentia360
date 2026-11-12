import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { HoraPipe } from '../../../shared/pipes/hora.pipe';

export interface TurnoPublico {
  turno: string;
  estado: string;
}

const ORDEN = ['En espera', 'En admisión', 'En valoración', 'En ayudas diagnósticas', 'En proceso de salida'];

@Component({
  selector: 'app-sala-espera',
  imports: [MatCardModule, HoraPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-card appearance="outlined" class="sala">
      <mat-card-header>
        <mat-card-title>Sala de espera · Urgencias</mat-card-title>
        <mat-card-subtitle>Actualizado {{ actualizado() | hora: false }} · solo códigos de turno, sin datos clínicos</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content class="pila">
        @for (g of grupos(); track g.estado) {
          <section>
            <h3 class="sala-estado">{{ g.estado }} <span class="texto-suave">({{ g.turnos.length }})</span></h3>
            <ul class="sala-turnos">
              @for (t of g.turnos; track t) {
                <li class="sala-turno">{{ t }}</li>
              }
            </ul>
          </section>
        }
      </mat-card-content>
    </mat-card>
  `,
})
export class SalaEspera {
  readonly turnos = input.required<TurnoPublico[]>();
  readonly actualizado = input.required<number>();

  protected readonly grupos = computed(() =>
    ORDEN.map((estado) => ({
      estado,
      turnos: this.turnos().filter((t) => t.estado === estado).map((t) => t.turno).sort(),
    })).filter((g) => g.turnos.length),
  );
}
