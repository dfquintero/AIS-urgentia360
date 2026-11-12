import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';
import { EventoEpisodio } from '../../../core/models/urgencias.models';
import { HoraPipe } from '../../../shared/pipes/hora.pipe';

@Component({
  selector: 'app-bitacora',
  imports: [MatCardModule, RouterLink, HoraPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-card appearance="outlined">
      <mat-card-header>
        <mat-card-title>Bitácora de eventos</mat-card-title>
        <mat-card-subtitle>Reproducción de la base sintética y registros manuales</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        @if (eventos().length) {
          <ul class="bitacora">
            @for (e of eventos(); track e.id) {
              <li class="evento" [class.evento-manual]="e.origen !== 'Simulación'">
                <span class="evento-hora">{{ e.ts | hora: 'fecha-hora' }}</span>
                <a class="enlace" [routerLink]="['/trazabilidad', e.episodioId]">{{ e.episodioId }}</a>
                <span>{{ e.tipo }}</span>
                <span class="texto-suave">· {{ e.sistema }}</span>
                @if (e.origen !== 'Simulación') {
                  <span class="insignia insignia-manual">QR manual</span>
                }
              </li>
            }
          </ul>
        } @else {
          <p class="texto-suave">Aún no hay eventos.</p>
        }
      </mat-card-content>
    </mat-card>
  `,
})
export class Bitacora {
  readonly eventos = input.required<EventoEpisodio[]>();
}
