import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { ETAPAS, NIVELES_TRIAGE } from '../../../core/data/catalogos';
import { EtapaId, FilaTablero, NivelTriageId } from '../../../core/models/urgencias.models';
import { DuracionPipe } from '../../../shared/pipes/duracion.pipe';
import { InsigniaAlerta } from '../../../shared/ui/insignia-alerta';
import { InsigniaTriage } from '../../../shared/ui/insignia-triage';

type FiltroAlerta = 'todas' | 'alerta' | 'rojo';

const PESO_ALERTA = { rojo: 0, amarillo: 1, ok: 2 } as const;

@Component({
  selector: 'app-tablero-pacientes',
  imports: [MatButtonToggleModule, MatCardModule, MatSelectModule, MatTableModule, RouterLink, DuracionPipe, InsigniaAlerta, InsigniaTriage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tablero-pacientes.html',
})
export class TableroPacientes {
  readonly filas = input.required<FilaTablero[]>();
  readonly seleccionado = input('');
  readonly seleccionar = output<string>();

  protected readonly etapas = ETAPAS.filter((e) => e.id !== 'punto0' && e.id !== 'egreso');
  protected readonly niveles = NIVELES_TRIAGE;
  protected readonly columnas = ['episodio', 'perfil', 'etapa', 'responsable', 'tiempo', 'alerta'];
  protected readonly filtroEtapa = signal<EtapaId | 'todas'>('todas');
  protected readonly filtroTriage = signal<NivelTriageId | 'todas'>('todas');
  protected readonly filtroAlerta = signal<FiltroAlerta>('todas');

  protected readonly visibles = computed(() => {
    const etapa = this.filtroEtapa();
    const triage = this.filtroTriage();
    const alerta = this.filtroAlerta();
    return this.filas()
      .filter((f) => etapa === 'todas' || f.etapa.id === etapa)
      .filter((f) => triage === 'todas' || f.episodio.triage === triage)
      .filter((f) => alerta === 'todas' || (alerta === 'rojo' ? f.alerta.nivel === 'rojo' : f.alerta.nivel !== 'ok'))
      .sort((a, b) => PESO_ALERTA[a.alerta.nivel] - PESO_ALERTA[b.alerta.nivel] || b.tiempoMs - a.tiempoMs);
  });

  protected readonly trackFila = (_: number, f: FilaTablero) => f.episodio.id;
}
