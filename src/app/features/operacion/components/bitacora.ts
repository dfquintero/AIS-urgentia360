import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { EventoBitacora } from '../../../core/models/urgencias.models';
import { HoraPipe } from '../../../shared/pipes/hora.pipe';

@Component({
  selector: 'app-bitacora',
  imports: [MatCardModule, HoraPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-card appearance="outlined">
      <mat-card-header>
        <mat-card-title>Bitácora de eventos</mat-card-title>
        <mat-card-subtitle>Registro de auditoría de la sesión</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        @if (eventos().length) {
          <ul class="bitacora">
            @for (e of eventos(); track e.id) {
              <li class="evento evento-{{ e.tipo }}">
                <span class="evento-hora">{{ e.ts | hora }}</span>
                <strong>{{ e.turno }}</strong>
                <span>{{ e.texto }}</span>
              </li>
            }
          </ul>
        } @else {
          <p class="texto-suave">Aún no hay eventos en esta sesión.</p>
        }
      </mat-card-content>
    </mat-card>
  `,
})
export class Bitacora {
  readonly eventos = input.required<EventoBitacora[]>();
}
