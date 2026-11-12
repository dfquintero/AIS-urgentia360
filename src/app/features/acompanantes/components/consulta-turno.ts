import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { ResultadoConsulta } from '../../../core/domain/privacidad';

@Component({
  selector: 'app-consulta-turno',
  imports: [FormsModule, MatInputModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="movil" aria-label="Vista móvil para acompañantes">
      <div class="movil-pantalla pila">
        <h2 class="movil-titulo">Consulta de turno</h2>
        <p class="texto-suave">Escriba los dos códigos impresos en el tiquete del digiturno.</p>
        <mat-form-field subscriptSizing="dynamic">
          <mat-label>Código de turno</mat-label>
          <input matInput [(ngModel)]="turno" placeholder="TURNO-FICT-00198" autocomplete="off" />
        </mat-form-field>
        <mat-form-field subscriptSizing="dynamic">
          <mat-label>Código de verificación</mat-label>
          <input matInput [(ngModel)]="verificacion" inputmode="numeric" maxlength="4" placeholder="4 dígitos" autocomplete="off" />
        </mat-form-field>
        @switch (resultado()?.tipo) {
          @case ('activo') {
            <div class="movil-resultado">
              <span class="turno-grande">{{ $any(resultado()).turno }}</span>
              <span class="movil-estado">{{ $any(resultado()).estado }}</span>
            </div>
          }
          @case ('finalizado') {
            <div class="movil-resultado">
              <span class="turno-grande">{{ $any(resultado()).turno }}</span>
              <span class="movil-estado">Atención finalizada</span>
            </div>
          }
          @case ('no-encontrado') {
            <p class="texto-alerta">No encontramos un turno con esos datos. Verifique los códigos del tiquete.</p>
          }
        }
        <p class="movil-nota">Solo se muestra el estado general del turno consultado: no se listan otros pacientes ni información clínica. Para más detalles acérquese al punto de información.</p>
      </div>
    </div>
  `,
})
export class ConsultaTurno {
  readonly turno = model('');
  readonly verificacion = model('');
  readonly resultado = input<ResultadoConsulta | null>(null);
}
