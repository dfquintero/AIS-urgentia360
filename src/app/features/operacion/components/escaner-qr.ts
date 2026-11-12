import { ChangeDetectionStrategy, Component, computed, input, linkedSignal, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { ETAPA_POR_ID, ETIQUETA_TRANSICION, NIVELES_TRIAGE, PERSONAL } from '../../../core/data/catalogos';
import { accionPendiente, etapaActual, opcionesSiguiente, requiereTriage } from '../../../core/domain/flujo';
import { EtapaId, NivelTriageId, Paciente, SolicitudEscaneo } from '../../../core/models/urgencias.models';
import { InsigniaTriage } from '../../../shared/ui/insignia-triage';
import { QrPaciente } from '../../../shared/ui/qr-paciente';

@Component({
  selector: 'app-escaner-qr',
  imports: [
    FormsModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatInputModule,
    MatRadioModule,
    MatSelectModule,
    InsigniaTriage,
    QrPaciente,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './escaner-qr.html',
})
export class EscanerQr {
  readonly pacientes = input.required<Paciente[]>();
  readonly codigo = model('');
  readonly escanear = output<SolicitudEscaneo>();

  protected readonly niveles = NIVELES_TRIAGE;

  protected readonly paciente = computed(() => {
    const c = this.codigo().trim().toUpperCase();
    return c ? this.pacientes().find((p) => p.qr === c || p.turno === c) : undefined;
  });
  protected readonly etapa = computed(() => {
    const p = this.paciente();
    return p ? ETAPA_POR_ID[etapaActual(p)] : null;
  });
  protected readonly accion = computed(() => {
    const p = this.paciente();
    return p ? accionPendiente(p) : null;
  });
  protected readonly personal = computed(() => {
    const e = this.etapa();
    return e ? PERSONAL[e.rol] : [];
  });
  protected readonly opciones = computed(() => {
    const p = this.paciente();
    return p && this.accion() === 'salida' ? opcionesSiguiente(p) : [];
  });
  protected readonly pideTriage = computed(() => {
    const p = this.paciente();
    return p ? requiereTriage(p) : false;
  });
  protected readonly sugerencias = computed(() => {
    const c = this.codigo().trim().toUpperCase();
    return this.pacientes()
      .filter((p) => !c || p.qr.includes(c) || p.turno.includes(c))
      .slice(0, 8);
  });

  private readonly claveEscaneo = computed(() => `${this.paciente()?.id}|${this.accion()}`);
  protected readonly responsable = linkedSignal<string, string | null>({
    source: this.claveEscaneo,
    computation: () => null,
  });
  protected readonly triage = linkedSignal<string, NivelTriageId | null>({
    source: this.claveEscaneo,
    computation: () => null,
  });
  protected readonly siguiente = linkedSignal<EtapaId | null>(() => this.opciones()[0] ?? null);

  protected readonly puedeRegistrar = computed(() => {
    if (!this.paciente()) return false;
    if (this.accion() === 'entrada') return !!this.responsable();
    return !this.pideTriage() || !!this.triage();
  });

  protected etiquetaDestino(destino: EtapaId): string {
    return ETIQUETA_TRANSICION[`${this.etapa()?.id}>${destino}`] ?? ETAPA_POR_ID[destino].nombre;
  }

  protected escaneoAleatorio(): void {
    const lista = this.pacientes();
    if (lista.length) this.codigo.set(lista[Math.floor(Math.random() * lista.length)].qr);
  }

  protected registrar(): void {
    this.escanear.emit({
      codigo: this.codigo(),
      responsable: this.responsable(),
      triage: this.triage(),
      siguiente: this.siguiente() ?? undefined,
    });
  }
}
