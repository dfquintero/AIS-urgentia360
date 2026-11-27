import { ChangeDetectionStrategy, Component, computed, effect, inject, untracked } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { RelojService } from './core/services/reloj.service';
import { PERFILES, RolService, RolUsuario, Vista } from './core/services/rol.service';
import { UrgenciasStore } from './core/services/urgencias.store';
import { HoraPipe } from './shared/pipes/hora.pipe';
import { AvisoClinico } from './shared/ui/aviso-clinico';
import { RedCifrada } from './shared/ui/red-cifrada';

@Component({
  selector: 'app-root',
  imports: [MatButtonModule, MatMenuModule, MatTabsModule, RouterLink, RouterLinkActive, RouterOutlet, HoraPipe, AvisoClinico, RedCifrada],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (esInicio()) {
      <router-outlet />
    } @else {
    <header class="barra">
      <a class="barra-marca" routerLink="/inicio" aria-label="Ir a la página de inicio">
        <span class="marca-simbolo" aria-hidden="true"></span>
        <span class="marca-nombre">Urgentia 360</span>
      </a>
      <div class="barra-estado">
        @if (reloj.fueraDelPeriodo()) {
          <span class="fuente-datos aviso-corte" title="La base sintética termina en el corte; después solo hay registros manuales">Fin de la reproducción</span>
        }
        <span class="reloj" aria-label="Hora simulada de la reproducción">{{ reloj.ahora() | hora: 'reloj' }}</span>
        <button class="boton-barra boton-icono" mat-stroked-button type="button" (click)="reloj.pausado.set(!reloj.pausado())" [attr.aria-label]="reloj.pausado() ? 'Reanudar' : 'Pausar'">
          {{ reloj.pausado() ? '▶' : '❚❚' }}
        </button>
        <button class="boton-barra" mat-stroked-button type="button" [matMenuTriggerFor]="menuReloj" aria-label="Velocidad y saltos de la reproducción">
          {{ reloj.velocidad() }}× ▾
        </button>
        <mat-menu #menuReloj="matMenu">
          <div class="menu-titulo">Velocidad</div>
          @for (v of reloj.velocidades; track v) {
            <button mat-menu-item type="button" (click)="reloj.velocidad.set(v)">{{ v === reloj.velocidad() ? '● ' : '' }}{{ v }}×</button>
          }
          <div class="menu-titulo">Ir a…</div>
          @for (m of reloj.marcas; track m.ts) {
            <button mat-menu-item type="button" (click)="reloj.irA(m.ts)">{{ m.etiqueta }}</button>
          }
          <button mat-menu-item type="button" (click)="store.reiniciarRegistros()">Descartar registros manuales</button>
        </mat-menu>
        <button class="boton-barra boton-rol" mat-stroked-button type="button" [matMenuTriggerFor]="menuRol" aria-label="Cambiar rol simulado">
          {{ roles.perfil().nombre }} ▾
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

    <footer class="pie pila-sm">
      <div class="pie-insignias">
        <app-red-cifrada />
        <span class="fuente-datos" title="Sede ficticia: flujo de referencia inspirado en la Clínica Universitaria Colombia (CUC)">{{ store.sede }} · ficticia</span>
        <span class="fuente-datos" [title]="store.fuente">{{ store.esRespaldo ? 'Datos de respaldo' : 'Base sintética UNAL–Kantera' }}</span>
        <span class="fuente-datos">Rol simulado: {{ roles.perfil().nombre }}</span>
      </div>
      <span>
        {{ store.sede }}: sede ficticia, flujo de referencia inspirado en la Clínica Universitaria Colombia (CUC); no
        reproduce sus volúmenes, dotación ni procesos. Proyecto académico (UNAL) sin afiliación oficial con Keralty. Paleta basada en su manual de identidad corporativa.
        {{ store.fuente }}: datos 100 % sintéticos; los sistemas citados (Sofía, Athenea, LIS, PACS/RIS) son referencias
        conceptuales, sin integración.
      </span>
    </footer>
    }
  `,
})
export class App {
  protected readonly reloj = inject(RelojService);
  protected readonly store = inject(UrgenciasStore);
  protected readonly roles = inject(RolService);
  private readonly router = inject(Router);
  protected readonly perfiles = PERFILES;
  private readonly pestanas: { vista: Vista; ruta: string; titulo: string }[] = [
    { vista: 'resumen', ruta: '/resumen', titulo: 'Resumen' },
    { vista: 'etapas', ruta: '/etapas', titulo: 'Etapas' },
    { vista: 'horarios', ruta: '/horarios', titulo: 'Horarios' },
    { vista: 'perfiles', ruta: '/perfiles', titulo: 'Perfiles' },
    { vista: 'ayudas', ruta: '/ayudas', titulo: 'Ayudas Dx' },
    { vista: 'ans', ruta: '/ans', titulo: 'ANS' },
    { vista: 'pacientes', ruta: '/pacientes', titulo: 'Pacientes' },
    { vista: 'registro', ruta: '/registro', titulo: 'Registro QR' },
    { vista: 'trazabilidad', ruta: '/trazabilidad', titulo: 'Trazabilidad' },
    { vista: 'configuracion', ruta: '/configuracion', titulo: 'Configuración' },
    { vista: 'acompanantes', ruta: '/acompanantes', titulo: 'Acompañantes' },
  ];
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );
  protected readonly esInicio = computed(() => /^\/(inicio|vision)\b/.test(this.url()));
  private pausaAntesDeInicio: boolean | null = null;

  constructor() {
    // La reproducción no avanza mientras se ven las páginas públicas (inicio y visión); al entrar se restaura el estado anterior.
    effect(() => {
      const inicio = this.esInicio();
      untracked(() => {
        if (inicio && this.pausaAntesDeInicio == null) {
          this.pausaAntesDeInicio = this.reloj.pausado();
          this.reloj.pausado.set(true);
        } else if (!inicio && this.pausaAntesDeInicio != null) {
          this.reloj.pausado.set(this.pausaAntesDeInicio);
          this.pausaAntesDeInicio = null;
        }
      });
    });
  }
  protected readonly pestanasVisibles = computed(() => this.pestanas.filter((t) => this.roles.puedeVer(t.vista)));

  protected cambiarRol(rol: RolUsuario): void {
    this.roles.rol.set(rol);
    this.router.navigate(['/', this.roles.vistaInicial()]);
  }
}
