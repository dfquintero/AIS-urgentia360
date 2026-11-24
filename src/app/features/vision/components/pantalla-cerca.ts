import { ChangeDetectionStrategy, Component, computed, input, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CentroRed, distanciaKm, franjaHoraria, ocupacion, Punto, textoOcupacion, tiempoEnCarro } from '../../../core/domain/red';
import { MapaBogota } from './mapa-bogota';

@Component({
  selector: 'app-pantalla-cerca',
  imports: [FormsModule, MapaBogota],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 class="app-titulo">Centros cerca de ti</h2>
    <p class="app-suave">{{ fuente() }}</p>
    <div class="app-fila">
      <button type="button" class="app-boton" (click)="ubicar.emit()">◎ Usar mi ubicación</button>
      <label class="app-hora">
        Hora
        <select [(ngModel)]="hora">
          @for (h of horas; track h) {
            <option [ngValue]="h">{{ h }}:00</option>
          }
        </select>
      </label>
    </div>
    <app-mapa-bogota [centros]="centros()" [origen]="origen()" (elegir)="mover.emit($event)" />
    <p class="app-suave">Toca el mapa para cambiar el punto de partida. Tiempo en carro y ocupación estimados a las {{ hora() }}:00 (franja {{ franja() }}).</p>
    <ol class="app-lista">
      @for (f of filas(); track f.centro.id) {
        <li>
          <span class="app-numero">{{ f.n }}</span>
          <span class="app-crece">
            <strong>{{ f.centro.nombre }}</strong>
            <small>{{ f.centro.localidad }} · {{ f.km }} km · {{ f.ocupacion }}</small>
            <small>{{ f.centro.servicios.join(' · ') }}</small>
          </span>
          <span class="app-minutos">{{ f.min }} min</span>
        </li>
      }
    </ol>
  `,
})
export class PantallaCerca {
  readonly centros = input.required<readonly CentroRed[]>();
  readonly origen = input.required<Punto>();
  readonly fuente = input.required<string>();
  readonly hora = model.required<number>();
  readonly ubicar = output<void>();
  readonly mover = output<Punto>();

  protected readonly franja = computed(() => franjaHoraria(this.hora()).nombre.toLowerCase());
  protected readonly horas = Array.from({ length: 24 }, (_, h) => h);
  protected readonly filas = computed(() =>
    this.centros()
      .map((centro, i) => ({
        centro, n: i + 1,
        km: (Math.round(distanciaKm(this.origen(), centro.posicion) * 10) / 10).toLocaleString('es-CO'),
        min: tiempoEnCarro(this.origen(), centro.posicion, this.hora()),
        ocupacion: textoOcupacion(ocupacion(centro, this.hora())),
      }))
      .sort((a, b) => a.min - b.min),
  );
}
