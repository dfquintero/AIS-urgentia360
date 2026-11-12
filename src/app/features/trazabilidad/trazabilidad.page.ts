import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterLink } from '@angular/router';
import { esperaPostTriage } from '../../core/domain/indicadores';
import { Episodio } from '../../core/models/urgencias.models';
import { UrgenciasStore } from '../../core/services/urgencias.store';
import { DetalleEpisodio } from './components/detalle-episodio';

interface CasoDemo {
  titulo: string;
  descripcion: string;
  episodios: Episodio[];
}

const MAX_POR_CASO = 8;

@Component({
  selector: 'app-trazabilidad-page',
  imports: [FormsModule, MatButtonModule, MatCardModule, MatInputModule, RouterLink, DetalleEpisodio],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './trazabilidad.page.html',
})
export class TrazabilidadPage {
  protected readonly store = inject(UrgenciasStore);
  private readonly router = inject(Router);

  /** Parámetro de ruta :id (episodio o turno). */
  readonly id = input<string>();
  protected readonly busqueda = signal('');

  protected readonly episodio = computed(() => {
    const id = this.id();
    return id ? this.store.buscar(id) : undefined;
  });
  protected readonly eventos = computed(() => {
    const e = this.episodio();
    return e ? this.store.eventosDe(e.id) : [];
  });
  protected readonly ordenes = computed(() => {
    const e = this.episodio();
    return e ? this.store.ordenesDe(e.id) : [];
  });
  protected readonly alerta = computed(() => {
    const e = this.episodio();
    return e ? (this.store.filas().find((f) => f.episodio.id === e.id)?.alerta ?? null) : null;
  });

  protected readonly casos = computed<CasoDemo[]>(() => {
    const ahora = this.store.ahora();
    const episodios = this.store.episodios();
    const recientes = (lista: Episodio[]) => [...lista].sort((a, b) => b.historial[0].llegada - a.historial[0].llegada).slice(0, MAX_POR_CASO);
    const conPendientes = new Set(this.store.ordenesPendientes().map((o) => o.episodioId));
    return [
      {
        titulo: '1 · Atención post-triage demorada',
        descripcion: 'Triage II con más de 30 min entre fin de triage y valoración médica (ilustrativo, no evaluación clínica).',
        episodios: recientes(episodios.filter((e) => e.triage === 'II' && (esperaPostTriage(e, ahora) ?? 0) > 30)),
      },
      {
        titulo: '2 · Órdenes sin resultado revisado',
        descripcion: 'Laboratorio o imagen solicitados, en proceso o con resultado aún no revisado.',
        episodios: recientes(episodios.filter((e) => conPendientes.has(e.id))),
      },
      {
        titulo: '3 · Episodio abierto',
        descripcion: 'Episodios en atención en el instante actual de la reproducción.',
        episodios: recientes(this.store.activos()),
      },
    ];
  });

  protected buscar(): void {
    const encontrado = this.store.buscar(this.busqueda());
    if (encontrado) this.router.navigate(['/trazabilidad', encontrado.id]);
  }
}
