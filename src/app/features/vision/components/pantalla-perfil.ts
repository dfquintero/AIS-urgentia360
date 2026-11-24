import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PERFIL_VACIO, PerfilLocal, PerfilLocalService } from '../../../core/services/perfil-local.service';

@Component({
  selector: 'app-pantalla-perfil',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 class="app-titulo">Mi perfil</h2>
    <p class="app-aviso">Se guarda solo en este dispositivo. No se envía a ningún servidor.</p>
    <form class="app-form" (ngSubmit)="guardar()">
      <label>Nombre o alias<input name="alias" [(ngModel)]="borrador.alias" autocomplete="off" placeholder="Ej.: Ana" /></label>
      <div class="app-fila">
        <label class="app-crece">Edad<input name="edad" type="number" min="0" max="120" [(ngModel)]="borrador.edad" /></label>
        <label class="app-crece">Tipo de sangre
          <select name="sangre" [(ngModel)]="borrador.tipoSangre">
            <option value="">—</option>
            @for (t of sangre; track t) {
              <option [value]="t">{{ t }}</option>
            }
          </select>
        </label>
      </div>
      <label class="app-check"><input type="checkbox" name="embarazo" [(ngModel)]="borrador.embarazo" /> Embarazo en curso</label>
      <label>Alergias<input name="alergias" [(ngModel)]="borrador.alergias" placeholder="Ej.: penicilina" /></label>
      <label>Enfermedades crónicas<input name="condiciones" [(ngModel)]="borrador.condiciones" placeholder="Ej.: diabetes, hipertensión" /></label>
      <label>Medicamentos actuales<input name="medicamentos" [(ngModel)]="borrador.medicamentos" /></label>
      <div class="app-fila">
        <label class="app-crece">Contacto de emergencia<input name="contacto" [(ngModel)]="borrador.contactoNombre" /></label>
        <label class="app-crece">Teléfono<input name="telefono" type="tel" [(ngModel)]="borrador.contactoTelefono" /></label>
      </div>
      <div class="app-fila">
        <button type="submit" class="app-boton app-primario">Guardar perfil</button>
        <button type="button" class="app-boton" (click)="borrar()">Borrar</button>
      </div>
      @if (mensaje) {
        <p class="app-suave" role="status">{{ mensaje }}</p>
      }
    </form>
  `,
})
export class PantallaPerfil {
  private readonly servicio = inject(PerfilLocalService);
  protected readonly sangre = ['O+', 'O−', 'A+', 'A−', 'B+', 'B−', 'AB+', 'AB−'];
  protected borrador: PerfilLocal = { ...(this.servicio.perfil() ?? PERFIL_VACIO) };
  protected mensaje = '';

  protected guardar(): void {
    this.servicio.guardar(this.borrador);
    this.mensaje = 'Perfil guardado en este dispositivo.';
  }

  protected borrar(): void {
    this.servicio.borrar();
    this.borrador = { ...PERFIL_VACIO };
    this.mensaje = 'Perfil borrado.';
  }
}
