import { ChangeDetectionStrategy, Component, ElementRef, inject, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { ETAPAS } from '../../core/data/catalogos';
import { PERFILES, RolService, RolUsuario } from '../../core/services/rol.service';
import { CarruselDiapositivas } from './components/carrusel-diapositivas';

const CARACTERISTICAS = [
  { titulo: 'Trazabilidad del turno al egreso', texto: 'Cada etapa deja una marca: llegada, entrada y salida, con su fuente y responsable, en una línea de tiempo por episodio.' },
  { titulo: 'Cuellos de botella', texto: 'Dónde, cuándo y para quién se acumula la espera: ranking con p90, mapa por hora, perfiles y ayudas diagnósticas.' },
  { titulo: 'Gestión de ANS', texto: 'Cumplimiento por indicador, separando obligaciones normativas, metas operativas y ANS contractuales.' },
  { titulo: 'Registro con QR', texto: 'El personal escanea el QR del turno con la cámara del dispositivo para registrar entradas y salidas de etapa.' },
  { titulo: 'Vistas por rol', texto: 'Operación, coordinación, analistas y acompañantes ven solo la información que necesitan.' },
  { titulo: 'Privacidad', texto: 'El acompañante consulta solo su turno con un código de verificación: sin datos clínicos ni de otros pacientes.' },
];

@Component({
  selector: 'app-inicio-page',
  imports: [MatButtonModule, CarruselDiapositivas],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="inicio-portada">
      <div class="inicio-contenido">
        <span class="inicio-marca"><span class="marca-simbolo" aria-hidden="true">+</span> Urgentia 360</span>
        <h1>Hacer visible lo invisible.</h1>
        <p class="inicio-lema">
          Trazabilidad operativa del servicio de urgencias: del turno al egreso, para identificar cuellos de botella,
          seguir los tiempos de atención y apoyar la gestión de ANS.
        </p>
        <div class="fila">
          <button mat-flat-button type="button" class="boton-claro" (click)="entrar('demo')">Entrar al prototipo</button>
          <button mat-stroked-button type="button" class="boton-barra" (click)="verPresentacion()">Ver presentación</button>
        </div>
      </div>
    </section>

    <div class="pagina pila inicio-cuerpo">
      <section class="pila" aria-labelledby="titulo-caracteristicas">
        <h2 id="titulo-caracteristicas">Características</h2>
        <div class="inicio-tarjetas">
          @for (c of caracteristicas; track c.titulo; let i = $index) {
            <article class="inicio-tarjeta">
              <span class="inicio-numero">{{ (i + 1).toString().padStart(2, '0') }}</span>
              <h3>{{ c.titulo }}</h3>
              <p>{{ c.texto }}</p>
            </article>
          }
        </div>
      </section>

      <section class="pila" aria-labelledby="titulo-flujo">
        <h2 id="titulo-flujo">El recorrido del paciente</h2>
        <ol class="inicio-flujo">
          @for (e of etapas; track e.id) {
            <li [class.flujo-obligatoria]="e.obligatoria">{{ e.corto }}</li>
          }
        </ol>
        <p class="texto-suave">El triage es obligatorio y lo realiza siempre el profesional de salud. Ayudas diagnósticas y revaloración pueden repetirse.</p>
      </section>

      <section class="pila" aria-labelledby="titulo-presentacion" #presentacion>
        <h2 id="titulo-presentacion">Presentación</h2>
        <app-carrusel-diapositivas />
      </section>

      <section class="pila" aria-labelledby="titulo-roles">
        <h2 id="titulo-roles">Entrar según el rol</h2>
        <p class="texto-suave">Rol simulado, sin autenticación real: solo cambia las pestañas visibles.</p>
        <div class="inicio-roles">
          @for (p of perfiles; track p.id) {
            <button type="button" class="inicio-rol" (click)="entrar(p.id)">
              <strong>{{ p.nombre }}</strong>
              <span class="texto-suave">{{ p.descripcion }}</span>
            </button>
          }
        </div>
      </section>

      <div class="aviso aviso-inicio" role="note">
        <strong>Proyecto académico.</strong> Herramienta de apoyo operativo que no toma decisiones clínicas ni debe usarse
        para negar o retrasar la atención (Resolución 5596 de 2015). Datos 100 % sintéticos (base UNAL–Kantera, sede
        ficticia SEDE-DEMO-01); sin afiliación oficial con Keralty.
      </div>
    </div>
  `,
})
export class InicioPage {
  private readonly roles = inject(RolService);
  private readonly router = inject(Router);
  private readonly presentacion = viewChild.required<ElementRef<HTMLElement>>('presentacion');

  protected readonly caracteristicas = CARACTERISTICAS;
  protected readonly etapas = ETAPAS;
  protected readonly perfiles = PERFILES;

  protected entrar(rol: RolUsuario): void {
    this.roles.rol.set(rol);
    this.router.navigate(['/', this.roles.vistaInicial()]);
  }

  protected verPresentacion(): void {
    this.presentacion().nativeElement.scrollIntoView({ behavior: 'smooth' });
  }
}
