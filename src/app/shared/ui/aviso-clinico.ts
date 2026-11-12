import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-aviso-clinico',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="aviso" role="note">
      <strong>Herramienta de apoyo operativo.</strong>
      No toma decisiones clínicas ni debe usarse para negar o retrasar la atención (Resolución 5596 de 2015): el
      triage es obligatorio y lo realiza siempre el profesional de salud. Datos 100 % sintéticos que no representan
      a la Clínica Universitaria Colombia ni a Keralty; umbrales ilustrativos hasta validación institucional.
    </div>
  `,
})
export class AvisoClinico {}
