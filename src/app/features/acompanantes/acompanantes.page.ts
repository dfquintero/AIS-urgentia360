import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { consultarTurno, ResultadoConsulta } from '../../core/domain/privacidad';
import { UrgenciasStore } from '../../core/services/urgencias.store';
import { ConsultaTurno } from './components/consulta-turno';

@Component({
  selector: 'app-acompanantes-page',
  imports: [ConsultaTurno],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="pagina pila">
      <header class="encabezado-pagina">
        <div>
          <h1>Acompañantes</h1>
          <p class="texto-suave">
            Vista demostrativa limitada: cada acompañante consulta solo el turno de su paciente con el código y la
            verificación del tiquete. No se listan turnos ni estados de otros pacientes.
          </p>
        </div>
      </header>
      <app-consulta-turno [(turno)]="turno" [(verificacion)]="verificacion" [resultado]="resultado()" />
    </section>
  `,
})
export class AcompanantesPage {
  private readonly store = inject(UrgenciasStore);
  protected readonly turno = signal('');
  protected readonly verificacion = signal('');

  protected readonly resultado = computed<ResultadoConsulta | null>(() => {
    if (!this.turno().trim() || this.verificacion().trim().length < 4) return null;
    return consultarTurno(this.store.episodios(), this.turno(), this.verificacion());
  });
}
