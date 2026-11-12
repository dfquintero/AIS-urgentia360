import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';

export type ResultadoConsulta =
  | { tipo: 'activo'; turno: string; estado: string }
  | { tipo: 'finalizado'; turno: string }
  | { tipo: 'no-encontrado' };

@Component({
  selector: 'app-consulta-turno',
  imports: [FormsModule, MatInputModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="movil" aria-label="Vista móvil para acompañantes">
      <div class="movil-pantalla pila">
        <h2 class="movil-titulo">Consulta de turno</h2>
        <p class="texto-suave">Escriba el código impreso en el tiquete del digiturno.</p>
        <mat-form-field subscriptSizing="dynamic">
          <mat-label>Código de turno</mat-label>
          <input matInput [(ngModel)]="consulta" placeholder="TURNO-FICT-00198 o 198" autocomplete="off" />
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
            <p class="texto-alerta">No encontramos ese turno. Verifique el código.</p>
          }
        }
        <p class="movil-nota">Por privacidad no se muestran nombres ni información clínica. Para más detalles acérquese al punto de información.</p>
      </div>
    </div>
  `,
})
export class ConsultaTurno {
  readonly consulta = model('');
  readonly resultado = input<ResultadoConsulta | null>(null);
}
