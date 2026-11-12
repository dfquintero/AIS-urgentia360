import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { RelojService } from './core/services/reloj.service';
import { UrgenciasStore } from './core/services/urgencias.store';
import { HoraPipe } from './shared/pipes/hora.pipe';
import { AvisoClinico } from './shared/ui/aviso-clinico';
import { RedCifrada } from './shared/ui/red-cifrada';

@Component({
  selector: 'app-root',
  imports: [MatButtonModule, MatButtonToggleModule, MatMenuModule, MatTabsModule, RouterLink, RouterLinkActive, RouterOutlet, HoraPipe, AvisoClinico, RedCifrada],
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
        <span class="fuente-datos" title="Sede ficticia: flujo de referencia inspirado en la Clínica Universitaria Colombia (CUC)">{{ store.sede }} · ficticia</span>
        <span class="fuente-datos" [title]="store.fuente">{{ store.esRespaldo ? 'Datos de respaldo' : 'Base sintética UNAL–Kantera' }}</span>
        <span class="reloj" aria-label="Hora simulada de la reproducción">{{ reloj.ahora() | hora: 'reloj' }}</span>
        <button class="boton-barra" mat-stroked-button type="button" (click)="reloj.pausado.set(!reloj.pausado())">
          {{ reloj.pausado() ? '▶ Reanudar' : '❚❚ Pausa' }}
        </button>
        <mat-button-toggle-group class="velocidad" hideSingleSelectionIndicator [value]="reloj.velocidad()" (change)="reloj.velocidad.set($event.value)" aria-label="Velocidad de la reproducción">
          @for (v of reloj.velocidades; track v) {
            <mat-button-toggle [value]="v">{{ v }}×</mat-button-toggle>
          }
        </mat-button-toggle-group>
        <button class="boton-barra" mat-stroked-button type="button" [matMenuTriggerFor]="menu">Ir a…</button>
        <mat-menu #menu="matMenu">
          @for (m of reloj.marcas; track m.ts) {
            <button mat-menu-item type="button" (click)="reloj.irA(m.ts)">{{ m.etiqueta }}</button>
          }
          <button mat-menu-item type="button" (click)="store.reiniciarRegistros()">Descartar registros manuales</button>
        </mat-menu>
      </div>
    </header>

    <nav mat-tab-nav-bar class="navegacion" [tabPanel]="panel" mat-stretch-tabs="false">
      @for (t of pestanas; track t.ruta) {
        <a mat-tab-link [routerLink]="t.ruta" routerLinkActive #rla="routerLinkActive" [active]="rla.isActive">{{ t.titulo }}</a>
      }
    </nav>

    <mat-tab-nav-panel #panel>
      <app-aviso-clinico />
      <router-outlet />
    </mat-tab-nav-panel>

    <footer class="pie">
      {{ store.sede }}: sede ficticia, flujo de referencia inspirado en la Clínica Universitaria Colombia (CUC); no
      reproduce sus volúmenes, dotación ni procesos. Proyecto académico (UNAL) sin afiliación oficial con Keralty. Paleta basada en su manual de identidad corporativa.
      {{ store.fuente }}: datos 100 % sintéticos; los sistemas citados (Sofía, Athenea, LIS, PACS/RIS) son referencias
      conceptuales, sin integración.
    </footer>
  `,
})
export class App {
  protected readonly reloj = inject(RelojService);
  protected readonly store = inject(UrgenciasStore);
  protected readonly pestanas = [
    { ruta: '/operacion', titulo: 'Operación' },
    { ruta: '/coordinacion', titulo: 'Coordinación' },
    { ruta: '/trazabilidad', titulo: 'Trazabilidad' },
    { ruta: '/acompanantes', titulo: 'Acompañantes' },
  ];
}
