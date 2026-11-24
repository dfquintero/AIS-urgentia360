import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { Episodio, SolicitudEscaneo } from '../../core/models/urgencias.models';
import { UrgenciasStore } from '../../core/services/urgencias.store';
import { HoraPipe } from '../../shared/pipes/hora.pipe';
import { QrPaciente } from '../../shared/ui/qr-paciente';
import { Bitacora } from './components/bitacora';
import { EscanerQr } from './components/escaner-qr';

@Component({
  selector: 'app-registro-page',
  imports: [MatButtonModule, MatCardModule, HoraPipe, QrPaciente, Bitacora, EscanerQr],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="pagina pila">
      <header class="encabezado-pagina">
        <div>
          <h1>Registro QR</h1>
          <p class="texto-suave">Generar turno y registrar entradas y salidas de etapa sobre episodios activos</p>
        </div>
        <button mat-flat-button type="button" (click)="generarTurno()">+ Generar turno (Punto 0)</button>
      </header>

      <div class="grid-operacion">
        <app-escaner-qr [episodios]="store.activos()" [(codigo)]="codigo" (escanear)="escanear($event)" />
        <div class="pila">
          @if (ultimoTurno(); as t) {
            <mat-card appearance="outlined">
              <mat-card-header>
                <mat-card-title>Último turno generado</mat-card-title>
                <mat-card-subtitle>Integración conceptual con digiturno</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content class="turno-generado">
                <app-qr-paciente [codigo]="t.turno" [tamano]="128" />
                <div class="pila-sm">
                  <span class="turno-grande">{{ t.turno }}</span>
                  <span>{{ t.id }} · {{ t.demanda }}</span>
                  <span class="texto-suave">Generado a las {{ t.historial[0].llegada | hora: 'fecha-hora' }}</span>
                  <span class="texto-suave">Siguiente etapa obligatoria: Triage</span>
                </div>
              </mat-card-content>
            </mat-card>
          }
          <app-bitacora [eventos]="store.eventosRecientes()" />
        </div>
      </div>
    </section>
  `,
})
export class RegistroPage {
  protected readonly store = inject(UrgenciasStore);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly codigo = signal(inject(ActivatedRoute).snapshot.queryParamMap.get('codigo') ?? '');
  protected readonly ultimoTurno = signal<Episodio | null>(null);

  protected generarTurno(): void {
    const episodio = this.store.generarTurno();
    this.ultimoTurno.set(episodio);
    this.codigo.set(episodio.turno);
    this.snackBar.open(`Turno ${episodio.turno} generado. Siguiente paso obligatorio: Triage.`, 'OK', { duration: 3000 });
  }

  protected escanear(solicitud: SolicitudEscaneo): void {
    const resultado = this.store.escanear(solicitud);
    if (resultado.ok) {
      this.snackBar.open(`${resultado.episodio.turno}: ${resultado.texto}`, 'OK', { duration: 3500 });
      this.codigo.set('');
    } else {
      this.snackBar.open(resultado.error, 'Cerrar', { duration: 6000, panelClass: 'snack-error' });
    }
  }
}
