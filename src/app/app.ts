import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { RelojService } from './core/services/reloj.service';
import { PERFILES, RolService, RolUsuario } from './core/services/rol.service';
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
        <button class="boton-barra boton-rol" mat-stroked-button type="button" [matMenuTriggerFor]="menuRol" aria-label="Cambiar rol simulado">
          Rol: {{ roles.perfil().nombre }} ▾
        </button>
        <mat-menu #menuRol="matMenu">
          @for (p of perfiles; track p.id) {
            <button mat-menu-item type="button" (click)="cambiarRol(p.id)">
              <span class="pila-xs">
                <strong>{{ p.nombre }}</strong>
                <span class="texto-suave">{{ p.descripcion }}</span>
              </span>
            </button>
          }
        </mat-menu>
        <app-red-cifrada />
        <span class="fuente-datos" title="Sede ficticia: flujo de referencia inspirado en la Clínica Universitaria Colombia (CUC)">{{ store.sede }} · ficticia</span>
        <span class="fuente-datos" [title]="store.fuente">{{ store.esRespaldo ? 'Datos de respaldo' : 'Base sintética UNAL–Kantera' }}</span>
        @if (reloj.fueraDelPeriodo()) {
          <span class="fuente-datos aviso-corte" title="La base sintética termina en el corte; después solo hay registros manuales">Fin de la reproducción (corte)</span>
        }
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
      @for (t of pestanasVisibles(); track t.ruta) {
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
  protected readonly roles = inject(RolService);
  private readonly router = inject(Router);
  protected readonly perfiles = PERFILES;
  private readonly pestanas = [
    { vista: 'cuellos', ruta: '/cuellos', titulo: 'Cuellos de botella' },
    { vista: 'ans', ruta: '/ans', titulo: 'ANS' },
    { vista: 'operacion', ruta: '/operacion', titulo: 'Operación' },
    { vista: 'coordinacion', ruta: '/coordinacion', titulo: 'Coordinación' },
    { vista: 'trazabilidad', ruta: '/trazabilidad', titulo: 'Trazabilidad' },
    { vista: 'acompanantes', ruta: '/acompanantes', titulo: 'Acompañantes (demo)' },
  ];
  protected readonly pestanasVisibles = computed(() => this.pestanas.filter((t) => this.roles.puedeVer(t.vista)));

  protected cambiarRol(rol: RolUsuario): void {
    this.roles.rol.set(rol);
    this.router.navigate(['/', this.roles.vistaInicial()]);
  }
}
