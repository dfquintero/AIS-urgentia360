import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-aviso-clinico',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="aviso" role="note">
      <strong>Herramienta de apoyo operativo.</strong>
      Este sistema no toma decisiones clínicas: el triage es obligatorio y lo realiza siempre el
      profesional de salud. Datos simulados con fines académicos.
    </div>
  `,
})
export class AvisoClinico {}
