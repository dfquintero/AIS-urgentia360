import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Episodio, SolicitudEscaneo } from '../../core/models/urgencias.models';
import { UrgenciasStore } from '../../core/services/urgencias.store';
import { HoraPipe } from '../../shared/pipes/hora.pipe';
import { FlujoEtapas } from '../../shared/ui/flujo-etapas';
import { QrPaciente } from '../../shared/ui/qr-paciente';
import { Bitacora } from './components/bitacora';
import { EscanerQr } from './components/escaner-qr';
import { TableroPacientes } from './components/tablero-pacientes';

@Component({
  selector: 'app-operacion-page',
  imports: [MatButtonModule, MatCardModule, HoraPipe, FlujoEtapas, QrPaciente, Bitacora, EscanerQr, TableroPacientes],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './operacion.page.html',
})
export class OperacionPage {
  protected readonly store = inject(UrgenciasStore);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly codigo = signal('');
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
