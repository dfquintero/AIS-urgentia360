import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

@Component({
  selector: 'app-aviso-clinico',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="aviso aviso-compacto" role="note">
      <strong>Apoyo operativo:</strong> no toma decisiones clínicas; el triage es obligatorio y lo realiza el profesional. Datos sintéticos.
      <button type="button" class="enlace-boton" [attr.aria-expanded]="abierto()" (click)="abierto.set(!abierto())">
        {{ abierto() ? 'Menos' : 'Más información' }}
      </button>
      @if (abierto()) {
        <span class="bloque">
          No debe usarse para negar o retrasar la atención (Resolución 5596 de 2015). Los datos son 100 % sintéticos y no
          representan a la Clínica Universitaria Colombia ni a Keralty; los umbrales son ilustrativos hasta validación institucional.
        </span>
      }
    </div>
  `,
})
export class AvisoClinico {
  protected readonly abierto = signal(false);
}
