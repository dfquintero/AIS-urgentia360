import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  compararAlternativas, dentroDeBogota, generarCentros, ORIGEN_SIMULADO, Prediagnostico, prioridadOrientativa, Punto, Solicitud,
} from '../../core/domain/red';
import { PerfilLocalService } from '../../core/services/perfil-local.service';
import { PantallaCerca } from './components/pantalla-cerca';
import { PantallaPerfil } from './components/pantalla-perfil';
import { PantallaPrediagnostico, RespuestasPrediagnostico } from './components/pantalla-prediagnostico';
import { PantallaRecorrido } from './components/pantalla-recorrido';

type Pantalla = 'cerca' | 'perfil' | 'prediagnostico' | 'recorrido';

const horaBogota = (fecha: Date) =>
  Number(new Intl.DateTimeFormat('es-CO', { hour: 'numeric', hourCycle: 'h23', timeZone: 'America/Bogota' }).format(fecha));

@Component({
  selector: 'app-vision-page',
  imports: [RouterLink, PantallaCerca, PantallaPerfil, PantallaPrediagnostico, PantallaRecorrido],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './vision.page.html',
})
export class VisionPage {
  private readonly perfiles = inject(PerfilLocalService);

  protected readonly pestanas: { id: Pantalla; icono: string; texto: string }[] = [
    { id: 'cerca', icono: '◎', texto: 'Cerca' },
    { id: 'perfil', icono: '☺', texto: 'Perfil' },
    { id: 'prediagnostico', icono: '✚', texto: 'Prediagnóstico' },
    { id: 'recorrido', icono: '➜', texto: 'Recorrido' },
  ];
  protected readonly pantalla = signal<Pantalla>('cerca');
  protected readonly centros = generarCentros();
  protected readonly origen = signal<Punto>(ORIGEN_SIMULADO);
  protected readonly fuente = signal('Punto de partida simulado en Bogotá (Salitre).');
  private readonly ahora = new Date();
  protected readonly hora = signal(horaBogota(this.ahora));
  protected readonly perfil = this.perfiles.perfil;
  private readonly respuestas = signal<RespuestasPrediagnostico | null>(null);

  protected readonly horaVisible = new Intl.DateTimeFormat('es-CO', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'America/Bogota' }).format(this.ahora);

  protected readonly prioridad = computed(() => {
    const r = this.respuestas();
    if (!r) return null;
    const p = this.perfil();
    const datos: Prediagnostico = { ...r, edad: p?.edad ?? null, embarazo: p?.embarazo ?? false, condiciones: p?.condiciones ?? '' };
    return prioridadOrientativa(datos);
  });
  protected readonly solicitud = computed<Solicitud>(() => {
    const p = this.perfil();
    return {
      prioridad: this.prioridad() ?? 'media',
      sintoma: this.respuestas()?.sintoma ?? 'Otro',
      edad: p?.edad ?? null,
      embarazo: p?.embarazo ?? false,
    };
  });
  protected readonly alternativas = computed(() => compararAlternativas(this.origen(), this.centros, this.solicitud(), this.hora()));
  protected readonly salida = computed(() => {
    const diferencia = this.hora() - horaBogota(this.ahora);
    return diferencia === 0 ? this.ahora : new Date(Math.floor(this.ahora.getTime() / 3_600_000) * 3_600_000 + diferencia * 3_600_000);
  });

  protected ubicar(): void {
    if (!navigator.geolocation) {
      this.fuente.set('Este navegador no permite la ubicación: uso un punto simulado.');
      return;
    }
    this.fuente.set('Buscando tu ubicación…');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const p = { lat: coords.latitude, lon: coords.longitude };
        if (dentroDeBogota(p)) {
          this.origen.set(p);
          this.fuente.set('Ubicación del GPS del dispositivo.');
        } else {
          this.origen.set(ORIGEN_SIMULADO);
          this.fuente.set('Estás fuera de Bogotá: uso un punto de partida simulado.');
        }
      },
      () => this.fuente.set('Sin permiso de ubicación: uso un punto de partida simulado.'),
      { timeout: 10_000, maximumAge: 60_000 },
    );
  }

  protected mover(p: Punto): void {
    this.origen.set(p);
    this.fuente.set('Punto de partida elegido en el mapa.');
  }

  protected generar(r: RespuestasPrediagnostico): void {
    this.respuestas.set(r);
    this.pantalla.set('recorrido');
  }
}
