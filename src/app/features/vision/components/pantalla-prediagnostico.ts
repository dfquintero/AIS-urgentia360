import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Duracion, SENALES_ALARMA, SINTOMAS } from '../../../core/domain/red';
import { PerfilLocal } from '../../../core/services/perfil-local.service';

export interface RespuestasPrediagnostico {
  alarmas: string[];
  sintoma: string;
  dolor: number;
  duracion: Duracion;
}

@Component({
  selector: 'app-pantalla-prediagnostico',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 class="app-titulo">Prediagnóstico orientativo</h2>
    <p class="app-aviso">No es un diagnóstico. El triage siempre lo asigna un profesional de salud al llegar.</p>
    <form class="app-form" (ngSubmit)="enviar()">
      <fieldset>
        <legend>¿Tienes alguna de estas señales de alarma?</legend>
        @for (s of alarmas; track s) {
          <label class="app-check"><input type="checkbox" [name]="s" [(ngModel)]="marcadas[s]" /> {{ s }}</label>
        }
      </fieldset>
      @if (hayAlarma()) {
        <a class="app-emergencia" href="tel:123">Llama ya a la línea de emergencias 123</a>
      }
      <label>Síntoma principal
        <select name="sintoma" [(ngModel)]="sintoma">
          @for (s of sintomas; track s) {
            <option [value]="s">{{ s }}</option>
          }
        </select>
      </label>
      <label>Intensidad del dolor: <strong>{{ dolor }}/10</strong>
        <input name="dolor" type="range" min="0" max="10" [(ngModel)]="dolor" />
      </label>
      <fieldset>
        <legend>¿Desde cuándo?</legend>
        <div class="app-fila">
          @for (d of duraciones; track d.id) {
            <label class="app-opcion" [class.app-opcion-activa]="duracion === d.id">
              <input type="radio" name="duracion" [value]="d.id" [(ngModel)]="duracion" /> {{ d.texto }}
            </label>
          }
        </div>
      </fieldset>
      <p class="app-suave">
        @if (perfil(); as p) {
          Se tendrá en cuenta tu perfil: {{ p.edad ?? '—' }} años{{ p.embarazo ? ', embarazo' : '' }}{{ p.condiciones ? ', ' + p.condiciones : '' }}.
        } @else {
          Sin perfil guardado: completa «Perfil» para incluir edad y enfermedades crónicas.
        }
      </p>
      <button type="submit" class="app-boton app-primario">Generar recorrido →</button>
    </form>
  `,
})
export class PantallaPrediagnostico {
  readonly perfil = input<PerfilLocal | null>(null);
  readonly generar = output<RespuestasPrediagnostico>();

  protected readonly alarmas = SENALES_ALARMA;
  protected readonly sintomas = SINTOMAS;
  protected readonly duraciones: { id: Duracion; texto: string }[] = [
    { id: 'horas', texto: 'Horas' },
    { id: 'dias', texto: '1–3 días' },
    { id: 'semana', texto: 'Más de 3 días' },
  ];
  protected marcadas: Record<string, boolean> = {};
  protected sintoma: string = SINTOMAS[0];
  protected dolor = 3;
  protected duracion: Duracion = 'horas';

  protected hayAlarma(): boolean {
    return Object.values(this.marcadas).some(Boolean);
  }

  protected enviar(): void {
    this.generar.emit({
      alarmas: Object.keys(this.marcadas).filter((k) => this.marcadas[k]),
      sintoma: this.sintoma,
      dolor: Number(this.dolor),
      duracion: this.duracion,
    });
  }
}
