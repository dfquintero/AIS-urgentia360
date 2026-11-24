import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Alternativa, CentroRed, ETIQUETA_PRIORIDAD, franjaHoraria, hitosRecorrido, Prioridad, Punto, serviciosRequeridos, Solicitud, textoOcupacion } from '../../../core/domain/red';
import { PerfilLocal } from '../../../core/services/perfil-local.service';
import { MapaBogota } from './mapa-bogota';

const LETRAS = 'ABCDEFGHIJ';

@Component({
  selector: 'app-pantalla-recorrido',
  imports: [MapaBogota],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (prioridad(); as p) {
      <h2 class="app-titulo">No siempre el punto más cercano es el más oportuno.</h2>
      <p class="app-prioridad" [class]="'app-prioridad app-prioridad-' + p">Prioridad orientativa: <strong>{{ etiqueta[p] }}</strong></p>
      @if (p === 'vital') {
        <a class="app-emergencia" href="tel:123">Llama a la línea 123: una ambulancia puede ser más segura que ir por tus medios.</a>
      }
      <div class="app-tabla" role="table" aria-label="Comparación de alternativas">
        <div class="app-tabla-fila app-tabla-encabezado" role="row">
          <span role="columnheader">Alternativa</span><span role="columnheader">Desplaz.</span><span role="columnheader">Espera est.</span><span role="columnheader">Total est.</span>
        </div>
        @for (a of filas(); track a.centro.id) {
          <div class="app-tabla-fila" role="row" [class.app-mejor]="$first">
            <span role="cell">
              <strong>{{ a.letra }}</strong> · {{ a.centro.nombre }}
              <small class="app-detalle">{{ textoOcupacion(a.ocupacion) }} · {{ a.centro.consultorios }} consultorios{{ a.faltantes.length ? ' · sin ' + a.faltantes.join(', ') : '' }}</small>
            </span>
            <span role="cell">{{ a.desplazamiento }} min</span>
            <span role="cell">{{ a.espera }} min</span>
            <span role="cell"><strong>{{ a.total }} min</strong></span>
          </div>
        }
      </div>
      <p class="app-conclusion">
        La alternativa {{ filas()[0].letra }} presenta el menor total estimado en este ejemplo{{ masCercana() ? '' : ', aunque no es la más cercana' }}.
      </p>
      <p class="app-suave app-criterios">
        Espera calculada con: prioridad <strong>{{ etiqueta[p] }}</strong> · síntoma <strong>{{ solicitud().sintoma }}</strong>{{ requeridos().length ? ' (requiere ' + requeridos().join(', ') + ')' : '' }}
        · franja <strong>{{ franja().nombre }}</strong> ({{ hora() }}:00). Cada centro tiene su propia ocupación por hora, consultorios y servicios.
      </p>
      <app-mapa-bogota [centros]="centros()" [origen]="origen()" [destacado]="filas()[0].centro.id" [mostrarRuta]="true" />
      <h3 class="app-subtitulo">Tu recorrido estimado</h3>
      <ol class="app-linea">
        @for (h of hitos(); track h.etiqueta) {
          <li><span class="app-reloj">{{ h.hora }}</span> {{ h.etiqueta }}</li>
        }
      </ol>
      @if (perfil(); as pf) {
        <h3 class="app-subtitulo">Ficha para compartir al llegar</h3>
        <dl class="app-ficha">
          <dt>Paciente</dt><dd>{{ pf.alias || '—' }}{{ pf.edad != null ? ' · ' + pf.edad + ' años' : '' }}</dd>
          <dt>Sangre</dt><dd>{{ pf.tipoSangre || '—' }}</dd>
          <dt>Alergias</dt><dd>{{ pf.alergias || 'Ninguna registrada' }}</dd>
          <dt>Crónicas</dt><dd>{{ pf.condiciones || '—' }}</dd>
          <dt>Medicamentos</dt><dd>{{ pf.medicamentos || '—' }}</dd>
          <dt>Contacto</dt><dd>{{ pf.contactoNombre || '—' }} {{ pf.contactoTelefono }}</dd>
        </dl>
      }
      <p class="app-aviso">Escenario hipotético para demostrar el concepto. No representa tiempos reales ni recomienda una institución.</p>
    } @else {
      <h2 class="app-titulo">Recorrido</h2>
      <p class="app-suave">Primero responde el prediagnóstico orientativo para estimar la espera en cada centro.</p>
      <button type="button" class="app-boton app-primario" (click)="irAPrediagnostico.emit()">Ir al prediagnóstico</button>
    }
  `,
})
export class PantallaRecorrido {
  readonly centros = input.required<readonly CentroRed[]>();
  readonly origen = input.required<Punto>();
  readonly alternativas = input.required<readonly Alternativa[]>();
  readonly prioridad = input<Prioridad | null>(null);
  readonly perfil = input<PerfilLocal | null>(null);
  readonly salida = input.required<Date>();
  readonly solicitud = input.required<Solicitud>();
  readonly hora = input.required<number>();
  readonly irAPrediagnostico = output<void>();

  protected readonly etiqueta = ETIQUETA_PRIORIDAD;
  protected readonly requeridos = computed(() => serviciosRequeridos(this.solicitud()));
  protected readonly franja = computed(() => franjaHoraria(this.hora()));
  protected readonly textoOcupacion = textoOcupacion;
  protected readonly filas = computed(() => this.alternativas().slice(0, 3).map((a, i) => ({ ...a, letra: LETRAS[i] })));
  protected readonly masCercana = computed(() => {
    const min = Math.min(...this.alternativas().map((a) => a.desplazamiento));
    return this.filas()[0]?.desplazamiento === min;
  });
  protected readonly hitos = computed(() => {
    const mejor = this.alternativas()[0];
    const p = this.prioridad();
    if (!mejor || !p) return [];
    const formato = new Intl.DateTimeFormat('es-CO', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'America/Bogota' });
    return hitosRecorrido(mejor, p).map((h) => ({ ...h, hora: formato.format(this.salida().getTime() + h.minuto * 60_000) }));
  });
}
