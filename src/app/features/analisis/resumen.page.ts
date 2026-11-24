import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';
import { AnalisisService } from '../../core/services/analisis.service';
import { MinutosPipe } from '../../shared/pipes/minutos.pipe';
import { FlujoEtapas } from '../../shared/ui/flujo-etapas';
import { TarjetaKpi } from '../../shared/ui/tarjeta-kpi';
import { FiltrosAnalisis } from './components/filtros-analisis';

@Component({
  selector: 'app-resumen-page',
  imports: [MatCardModule, RouterLink, MinutosPipe, FlujoEtapas, TarjetaKpi, FiltrosAnalisis],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="pagina pila">
      <header class="encabezado-pagina">
        <div>
          <h1>Resumen</h1>
          <p class="texto-suave">Dónde se acumula la espera ahora y cómo van los ANS</p>
        </div>
      </header>
      <app-filtros-analisis />

      @if (a.resumen(); as texto) {
        <div class="resumen-cuello" role="status">
          <strong>Hallazgo principal.</strong> {{ texto }}
          <a class="enlace" routerLink="/etapas">Ver etapas →</a>
        </div>
      }

      <div class="grid-kpi">
        <app-tarjeta-kpi titulo="Episodios activos" [valor]="a.filas().length" [detalle]="a.episodios().length + ' en el periodo'" />
        <app-tarjeta-kpi
          titulo="En alerta"
          [valor]="a.alertas().rojo + a.alertas().amarillo"
          [detalle]="a.alertas().rojo + ' críticos'"
          [tono]="a.alertas().rojo ? 'rojo' : a.alertas().amarillo ? 'amarillo' : 'verde'"
        />
        <app-tarjeta-kpi titulo="Fin triage → médico" [valor]="(a.tiempos().finTriageAMedico | minutos)" detalle="Promedio" tono="amarillo" />
        <app-tarjeta-kpi titulo="Estancia promedio" [valor]="(a.tiempos().estancia | minutos)" detalle="Turno → egreso" tono="verde" />
        <app-tarjeta-kpi titulo="Órdenes sin revisar" [valor]="a.resumenOrdenes().pendientes" [detalle]="'Solicitud → resultado: ' + (a.resumenOrdenes().solicitudAResultado | minutos)" />
      </div>

      <app-flujo-etapas [filas]="a.filas()" />

      <div class="grid-resumen">
        <mat-card appearance="outlined">
          <mat-card-header>
            <mat-card-title>Etapas con más espera</mat-card-title>
            <mat-card-subtitle>Ordenadas por espera promedio</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content class="tabla-contenedor">
            <table class="tabla-simple">
              <thead><tr><th>Etapa</th><th>Mediana</th><th>p90</th><th>En cola</th></tr></thead>
              <tbody>
                @for (r of top(); track r.id; let i = $index) {
                  <tr [class.fila-cuello]="i === 0">
                    <td><strong>{{ r.nombre }}</strong></td>
                    <td class="numero">{{ r.mediana | minutos }}</td>
                    <td class="numero">{{ r.p90 | minutos }}</td>
                    <td class="numero">{{ r.enCola }}</td>
                  </tr>
                }
              </tbody>
            </table>
            <a class="enlace" routerLink="/etapas">Ver todas las etapas →</a>
          </mat-card-content>
        </mat-card>

        <mat-card appearance="outlined">
          <mat-card-header>
            <mat-card-title>ANS con meta definida</mat-card-title>
            <mat-card-subtitle>Todo el periodo transcurrido</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content class="tabla-contenedor">
            <table class="tabla-simple">
              <thead><tr><th>Indicador</th><th>Cumplimiento</th><th>Estado</th></tr></thead>
              <tbody>
                @for (f of ansMedibles(); track f.d.id) {
                  <tr>
                    <td><strong>{{ f.d.nombre }}</strong></td>
                    <td class="numero">{{ f.cumplimiento }} %</td>
                    <td><span class="insignia estado-ans estado-{{ f.estado === 'Cumple' ? 'ok' : 'rojo' }}">{{ f.estado }}</span></td>
                  </tr>
                } @empty {
                  <tr><td colspan="3" class="texto-suave">Sin metas definidas.</td></tr>
                }
              </tbody>
            </table>
            <a class="enlace" routerLink="/ans">Ver ANS →</a>
          </mat-card-content>
        </mat-card>
      </div>
    </section>
  `,
})
export class ResumenPage {
  protected readonly a = inject(AnalisisService);
  protected readonly top = computed(() => this.a.ranking().slice(0, 3));
  protected readonly ansMedibles = computed(() => this.a.ans().filter((f) => f.cumplimiento != null));
}
