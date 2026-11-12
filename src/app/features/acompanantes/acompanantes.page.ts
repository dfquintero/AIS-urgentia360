import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { estadoPublico } from '../../core/domain/indicadores';
import { UrgenciasStore } from '../../core/services/urgencias.store';
import { ConsultaTurno, ResultadoConsulta } from './components/consulta-turno';
import { SalaEspera, TurnoPublico } from './components/sala-espera';

@Component({
  selector: 'app-acompanantes-page',
  imports: [ConsultaTurno, SalaEspera],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="pagina pila">
      <header class="encabezado-pagina">
        <div>
          <h1>Acompañantes</h1>
          <p class="texto-suave">Vista demostrativa limitada: solo código de turno y estado genérico</p>
        </div>
      </header>
      <div class="grid-acompanantes">
        <app-sala-espera [turnos]="turnos()" [actualizado]="store.ahora()" />
        <app-consulta-turno [(consulta)]="consulta" [resultado]="resultado()" />
      </div>
    </section>
  `,
})
export class AcompanantesPage {
  protected readonly store = inject(UrgenciasStore);
  protected readonly consulta = signal('');

  protected readonly turnos = computed<TurnoPublico[]>(() =>
    this.store.activos().map((e) => ({ turno: e.turno, estado: estadoPublico(e) })),
  );

  protected readonly resultado = computed<ResultadoConsulta | null>(() => {
    if (!this.consulta().trim()) return null;
    const episodio = this.store.buscar(this.consulta());
    if (!episodio) return { tipo: 'no-encontrado' };
    if (episodio.egreso != null) return { tipo: 'finalizado', turno: episodio.turno };
    return { tipo: 'activo', turno: episodio.turno, estado: estadoPublico(episodio) };
  });
}
