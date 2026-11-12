import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { codigoTurno } from '../../core/data/datos-simulados';
import { estadoPublico } from '../../core/domain/indicadores';
import { UrgenciasStore } from '../../core/services/urgencias.store';
import { ConsultaTurno, ResultadoConsulta } from './components/consulta-turno';
import { SalaEspera, TurnoPublico } from './components/sala-espera';

/** Acepta "U-019", "u019" o "19". */
function normalizarTurno(texto: string): string | null {
  const digitos = texto.trim().toUpperCase().replace(/^U-?/, '');
  return /^\d{1,4}$/.test(digitos) ? codigoTurno(Number(digitos)) : null;
}

@Component({
  selector: 'app-acompanantes-page',
  imports: [ConsultaTurno, SalaEspera],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="pagina pila">
      <header class="encabezado-pagina">
        <div>
          <h1>Acompañantes</h1>
          <p class="texto-suave">Información pública del estado de los turnos</p>
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
    this.store.activos().map((p) => ({ turno: p.turno, estado: estadoPublico(p) })),
  );

  protected readonly resultado = computed<ResultadoConsulta | null>(() => {
    if (!this.consulta().trim()) return null;
    const turno = normalizarTurno(this.consulta());
    const activo = this.store.activos().find((p) => p.turno === turno);
    if (activo) return { tipo: 'activo', turno: activo.turno, estado: estadoPublico(activo) };
    if (this.store.egresados().some((p) => p.turno === turno)) return { tipo: 'finalizado', turno: turno! };
    return { tipo: 'no-encontrado' };
  });
}
