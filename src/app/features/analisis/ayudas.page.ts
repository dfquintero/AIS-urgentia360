import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { AnalisisService } from '../../core/services/analisis.service';
import { MinutosPipe } from '../../shared/pipes/minutos.pipe';
import { TarjetaKpi } from '../../shared/ui/tarjeta-kpi';
import { FiltrosAnalisis } from './components/filtros-analisis';
import { GraficoOrdenes } from './components/grafico-ordenes';

@Component({
  selector: 'app-ayudas-page',
  imports: [MatCardModule, MinutosPipe, TarjetaKpi, FiltrosAnalisis, GraficoOrdenes],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="pagina pila">
      <header class="encabezado-pagina">
        <div>
          <h1>Ayudas diagnósticas</h1>
          <p class="texto-suave">En qué paso se pierde el tiempo: solicitud → toma → resultado → revisión</p>
        </div>
      </header>
      <app-filtros-analisis />

      <div class="grid-kpi">
        <app-tarjeta-kpi titulo="Órdenes sin revisar" [valor]="a.resumenOrdenes().pendientes" />
        <app-tarjeta-kpi titulo="Solicitud → resultado" [valor]="(a.resumenOrdenes().solicitudAResultado | minutos)" detalle="Promedio" tono="amarillo" />
      </div>

      <div class="grid-coordinacion">
        <mat-card appearance="outlined" class="ancho-doble">
          <mat-card-header>
            <mat-card-title>Minutos promedio por paso</mat-card-title>
            <mat-card-subtitle>Laboratorio frente a imagen</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <app-grafico-ordenes [pasos]="a.ordenes()" />
          </mat-card-content>
        </mat-card>
        <mat-card appearance="outlined">
          <mat-card-header>
            <mat-card-title>Órdenes detenidas ahora</mat-card-title>
            <mat-card-subtitle>Por paso pendiente</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content class="tabla-contenedor">
            <table class="tabla-simple">
              <thead><tr><th>Tipo</th><th>Sin toma</th><th>Sin resultado</th><th>Sin revisión</th></tr></thead>
              <tbody>
                @for (o of a.ordenes(); track o.tipo) {
                  <tr>
                    <td><strong>{{ o.tipo }}</strong></td>
                    <td class="numero">{{ o.pendientes.toma }}</td>
                    <td class="numero">{{ o.pendientes.resultado }}</td>
                    <td class="numero">{{ o.pendientes.revision }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </mat-card-content>
        </mat-card>
      </div>
    </section>
  `,
})
export class AyudasPage {
  protected readonly a = inject(AnalisisService);
}
