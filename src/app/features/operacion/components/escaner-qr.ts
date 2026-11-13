import { ChangeDetectionStrategy, Component, computed, input, linkedSignal, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { DESTINOS_EGRESO, ETAPA_POR_ID, ETIQUETA_TRANSICION, NIVELES_TRIAGE, PERSONAL } from '../../../core/data/catalogos';
import {
  accionPendiente,
  coincideCodigo,
  etapaActual,
  opcionesSiguiente,
  requiereDestino,
  requiereTriage,
} from '../../../core/domain/flujo';
import { DestinoEgreso, EtapaId, Episodio, NivelTriageId, SolicitudEscaneo } from '../../../core/models/urgencias.models';
import { InsigniaTriage } from '../../../shared/ui/insignia-triage';
import { LectorQr } from '../../../shared/ui/lector-qr';
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
    LectorQr,
    QrPaciente,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './escaner-qr.html',
})
export class EscanerQr {
  readonly episodios = input.required<Episodio[]>();
  readonly codigo = model('');
  readonly escanear = output<SolicitudEscaneo>();

  protected readonly niveles = NIVELES_TRIAGE;
  protected readonly destinos = DESTINOS_EGRESO;

  protected readonly episodio = computed(() => this.episodios().find((e) => coincideCodigo(e, this.codigo())));
  protected readonly etapa = computed(() => {
    const e = this.episodio();
    return e ? ETAPA_POR_ID[etapaActual(e)] : null;
  });
  protected readonly accion = computed(() => {
    const e = this.episodio();
    return e ? accionPendiente(e) : null;
  });
  protected readonly personal = computed(() => {
    const e = this.etapa();
    return e ? PERSONAL[e.rol] : [];
  });
  protected readonly opciones = computed(() => {
    const e = this.episodio();
    return e ? opcionesSiguiente(e) : [];
  });
  protected readonly pideTriage = computed(() => {
    const e = this.episodio();
    return e ? requiereTriage(e) : false;
  });
  protected readonly pideDestino = computed(() => {
    const e = this.episodio();
    return e ? requiereDestino(e) : false;
  });
  protected readonly sugerencias = computed(() => {
    const c = this.codigo().trim().toUpperCase();
    return this.episodios()
      .filter((e) => !c || e.turno.includes(c) || e.id.includes(c))
      .slice(0, 8)
      .map((e) => ({ id: e.id, turno: e.turno, etapa: ETAPA_POR_ID[etapaActual(e)].corto }));
  });

  // Las selecciones pertenecen al escaneo en curso: se reinician al cambiar de episodio o de acción.
  private readonly claveEscaneo = computed(() => `${this.episodio()?.id}|${this.etapa()?.id}|${this.accion()}`);
  protected readonly responsable = linkedSignal<string, string | null>({ source: this.claveEscaneo, computation: () => null });
  protected readonly triage = linkedSignal<string, NivelTriageId | null>({ source: this.claveEscaneo, computation: () => null });
  protected readonly destino = linkedSignal<string, DestinoEgreso | null>({ source: this.claveEscaneo, computation: () => null });
  protected readonly siguiente = linkedSignal<string, EtapaId | null>({
    source: computed(() => `${this.claveEscaneo()}|${this.opciones().join(',')}`),
    computation: () => this.opciones()[0] ?? null,
  });

  protected readonly puedeRegistrar = computed(() => {
    if (!this.episodio()) return false;
    if (this.accion() === 'entrada') return !!this.responsable();
    if (this.pideTriage()) return !!this.triage();
    if (this.pideDestino()) return !!this.destino();
    return true;
  });

  protected etiquetaDestino(destino: EtapaId): string {
    return ETIQUETA_TRANSICION[`${this.etapa()?.id}>${destino}`] ?? ETAPA_POR_ID[destino].nombre;
  }

  protected escaneoAleatorio(): void {
    const lista = this.episodios();
    if (lista.length) this.codigo.set(lista[Math.floor(Math.random() * lista.length)].turno);
  }

  protected registrar(): void {
    this.escanear.emit({
      codigo: this.codigo(),
      responsable: this.responsable(),
      triage: this.triage(),
      destino: this.destino(),
      siguiente: this.siguiente() ?? undefined,
    });
  }
}
