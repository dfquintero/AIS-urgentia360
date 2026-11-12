import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { RelojService } from './core/services/reloj.service';
import { HoraPipe } from './shared/pipes/hora.pipe';
import { AvisoClinico } from './shared/ui/aviso-clinico';
import { RedCifrada } from './shared/ui/red-cifrada';

@Component({
  selector: 'app-root',
  imports: [MatButtonToggleModule, MatTabsModule, RouterLink, RouterLinkActive, RouterOutlet, HoraPipe, AvisoClinico, RedCifrada],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="barra">
      <div class="barra-marca">
        <span class="marca-simbolo" aria-hidden="true">+</span>
        <div class="pila-xs">
          <span class="marca-nombre">Urgentia 360</span>
          <span class="marca-sub">Seguimiento operativo de urgencias</span>
        </div>
      </div>
      <div class="barra-estado">
        <app-red-cifrada />
        <span class="reloj" aria-label="Hora simulada">{{ reloj.ahora() | hora }}</span>
        <mat-button-toggle-group
          class="velocidad"
          hideSingleSelectionIndicator
          [value]="reloj.velocidad()"
          (change)="reloj.velocidad.set($event.value)"
          aria-label="Velocidad del reloj simulado"
        >
          @for (v of reloj.velocidades; track v) {
            <mat-button-toggle [value]="v">{{ v }}×</mat-button-toggle>
          }
        </mat-button-toggle-group>
      </div>
    </header>

    <nav mat-tab-nav-bar class="navegacion" [tabPanel]="panel" mat-stretch-tabs="false">
      @for (t of pestanas; track t.ruta) {
        <a mat-tab-link [routerLink]="t.ruta" routerLinkActive #rla="routerLinkActive" [active]="rla.isActive">
          {{ t.titulo }}
        </a>
      }
    </nav>

    <mat-tab-nav-panel #panel>
      <app-aviso-clinico />
      <router-outlet />
    </mat-tab-nav-panel>

    <footer class="pie">
      Proyecto académico sin afiliación oficial con Keralty. Paleta basada en su manual de identidad
      corporativa. Todos los datos son simulados.
    </footer>
  `,
})
export class App {
  protected readonly reloj = inject(RelojService);
  protected readonly pestanas = [
    { ruta: '/operacion', titulo: 'Operación' },
    { ruta: '/coordinacion', titulo: 'Coordinación' },
    { ruta: '/acompanantes', titulo: 'Acompañantes' },
  ];
}
