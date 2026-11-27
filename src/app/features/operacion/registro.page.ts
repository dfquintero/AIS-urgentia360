import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GRUPOS_EDAD, LLEGADAS_POR, TIPOS_DEMANDA } from '../../core/data/catalogos';
import { DatosRecepcion, Episodio, SolicitudEscaneo } from '../../core/models/urgencias.models';
import { RESPONSABLE_POR_ROL, RolService } from '../../core/services/rol.service';
import { UrgenciasStore } from '../../core/services/urgencias.store';
import { HoraPipe } from '../../shared/pipes/hora.pipe';
import { QrPaciente } from '../../shared/ui/qr-paciente';
import { Bitacora } from './components/bitacora';
import { EscanerQr } from './components/escaner-qr';

@Component({
  selector: 'app-registro-page',
  imports: [FormsModule, MatButtonModule, MatCardModule, MatCheckboxModule, MatFormFieldModule, MatSelectModule, HoraPipe, QrPaciente, Bitacora, EscanerQr],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="pagina pila">
      <header class="encabezado-pagina">
        <div>
          <h1>Registro QR</h1>
          <p class="texto-suave">Recepción del paciente (turno + QR) y registro de entradas y salidas de etapa</p>
        </div>
      </header>

      <div class="grid-operacion">
        <div class="pila">
          <mat-card appearance="outlined">
            <mat-card-header>
              <mat-card-title>Recibir paciente</mat-card-title>
              <mat-card-subtitle>Punto 0: genera el turno con datos básicos; no es atención clínica</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content class="pila">
              <div class="grid-form-recepcion">
                <mat-form-field subscriptSizing="dynamic">
                  <mat-label>Motivo de consulta</mat-label>
                  <mat-select [(ngModel)]="recepcion.demanda">
                    @for (d of demandas; track d) { <mat-option [value]="d">{{ d }}</mat-option> }
                  </mat-select>
                </mat-form-field>
                <mat-form-field subscriptSizing="dynamic">
                  <mat-label>Grupo de edad</mat-label>
                  <mat-select [(ngModel)]="recepcion.grupoEdad">
                    @for (g of gruposEdad; track g) { <mat-option [value]="g">{{ g }}</mat-option> }
                  </mat-select>
                </mat-form-field>
                <mat-form-field subscriptSizing="dynamic">
                  <mat-label>Cómo llega</mat-label>
                  <mat-select [(ngModel)]="recepcion.llegadaPor">
                    @for (l of llegadasPor; track l) { <mat-option [value]="l">{{ l }}</mat-option> }
                  </mat-select>
                </mat-form-field>
                <mat-checkbox [(ngModel)]="recepcion.conAcompanante" class="check-acompanante">Trae acompañante</mat-checkbox>
              </div>
              <button mat-flat-button type="button" (click)="generarTurno()">+ Generar turno y QR</button>
              <p class="texto-suave aviso-recepcion">Recepción no accede a la historia ni a otros pacientes; el triage lo asigna siempre un profesional de salud.</p>
            </mat-card-content>
          </mat-card>
          <app-escaner-qr [episodios]="store.activos()" [(codigo)]="codigo" (escanear)="escanear($event)" />
        </div>
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
                  <span>{{ t.id }} · {{ t.demanda }} · {{ t.grupoEdad }} · {{ t.llegadaPor }}{{ t.conAcompanante ? ' · con acompañante' : '' }}</span>
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
  private readonly roles = inject(RolService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly demandas = TIPOS_DEMANDA;
  protected readonly gruposEdad = GRUPOS_EDAD;
  protected readonly llegadasPor = LLEGADAS_POR;
  protected readonly recepcion: DatosRecepcion = {
    demanda: 'General',
    grupoEdad: '18-39',
    llegadaPor: 'A pie',
    conAcompanante: false,
  };

  protected readonly codigo = signal(inject(ActivatedRoute).snapshot.queryParamMap.get('codigo') ?? '');
  protected readonly ultimoTurno = signal<Episodio | null>(null);

  protected generarTurno(): void {
    const episodio = this.store.generarTurno({ ...this.recepcion });
    this.ultimoTurno.set(episodio);
    this.codigo.set(episodio.turno);
    this.snackBar.open(`Turno ${episodio.turno} generado. Siguiente paso obligatorio: Triage.`, 'OK', { duration: 3000 });
  }

  protected escanear(solicitud: SolicitudEscaneo): void {
    // Si no se elige responsable, se registra el rol activo (nunca una persona real).
    const resultado = this.store.escanear({ ...solicitud, responsable: solicitud.responsable ?? RESPONSABLE_POR_ROL[this.roles.rol()] });
    if (resultado.ok) {
      this.snackBar.open(`${resultado.episodio.turno}: ${resultado.texto}`, 'OK', { duration: 3500 });
      this.codigo.set('');
    } else {
      this.snackBar.open(resultado.error, 'Cerrar', { duration: 6000, panelClass: 'snack-error' });
    }
  }
}
