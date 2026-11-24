import { ChangeDetectionStrategy, Component, ElementRef, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ETAPAS } from '../../core/data/catalogos';
import { PERFILES, RolService, RolUsuario } from '../../core/services/rol.service';
import { CarruselDiapositivas } from './components/carrusel-diapositivas';

const IMG = 'landing/';

const CIFRAS = [
  { valor: '360', etiqueta: 'episodios sintéticos' },
  { valor: '4.240', etiqueta: 'eventos trazados' },
  { valor: '8', etiqueta: 'etapas del turno al egreso' },
  { valor: '11', etiqueta: 'vistas por rol' },
];

const MODULOS = [
  {
    etiqueta: 'Cuellos de botella',
    titulo: 'Dónde, cuándo y para quién se acumula la espera.',
    texto: 'Ranking de etapas con mediana y p90, mapa por hora de llegada, cortes por triage, demanda y edad, y el paso exacto en que se detienen las ayudas diagnósticas.',
    puntos: ['Etapas', 'Horarios', 'Perfiles', 'Ayudas Dx'],
    imagen: 'app-etapas.webp',
    alt: 'Pestaña Etapas: ranking de etapas por espera con mediana, p90 y pacientes en cola',
    tipo: 'pantalla',
  },
  {
    etiqueta: 'Gestión de ANS',
    titulo: 'Cumplimiento visible, indicador por indicador.',
    texto: 'Separa obligaciones normativas (Triage I y II, Res. 5596), metas operativas institucionales y ANS contractuales, con tendencia diaria y objetivo configurable.',
    puntos: ['Normativos', 'Operativos', 'Contractuales'],
    imagen: 'app-ans.webp',
    alt: 'Pestaña ANS: tabla de cumplimiento por indicador y tendencia diaria',
    tipo: 'pantalla',
  },
  {
    etiqueta: 'Trazabilidad',
    titulo: 'Cada paciente, de extremo a extremo.',
    texto: 'Llegada, entrada y salida de cada etapa con su fuente (Digiturno, HIS, LIS, PACS/RIS) y responsable: una línea de tiempo consistente por episodio.',
    puntos: ['Hitos', 'Órdenes', 'Línea de tiempo'],
    imagen: 'app-trazabilidad.webp',
    alt: 'Pestaña Trazabilidad: QR del turno, tiempos clave e hitos por etapa',
    tipo: 'pantalla',
  },
  {
    etiqueta: 'Registro con QR',
    titulo: 'Un escaneo marca cada etapa.',
    texto: 'El personal lee el QR del tiquete o la manilla con la cámara del dispositivo y registra la entrada o la salida. El triage se exige siempre antes de continuar.',
    puntos: ['Cámara del dispositivo', 'Triage obligatorio', 'Bitácora'],
    imagen: 'qr.webp',
    alt: 'Ilustración: un celular escanea el código QR de la manilla de un paciente',
    tipo: 'foto',
  },
  {
    etiqueta: 'Acompañantes',
    titulo: 'Tranquilidad para la familia, privacidad para todos.',
    texto: 'El acompañante consulta solo su turno con el código del tiquete y una verificación: ve un estado general, sin datos clínicos ni información de otros pacientes.',
    puntos: ['Solo el turno propio', 'Sin datos clínicos'],
    imagen: 'movil-acompanantes.webp',
    alt: 'Vista móvil de acompañantes con el estado general de un turno',
    tipo: 'movil',
  },
] as const;

const PASOS = [
  { titulo: 'Captura', texto: 'Digiturno genera el turno y el QR; cada escaneo registra entrada y salida de etapa.' },
  { titulo: 'Trazabilidad', texto: 'Los eventos se ordenan en una línea de tiempo por episodio, con fuente y responsable.' },
  { titulo: 'Decisión', texto: 'Indicadores, alertas configurables y cuellos de botella para orientar mejoras operativas.' },
];

@Component({
  selector: 'app-inicio-page',
  imports: [CarruselDiapositivas],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './inicio.page.html',
})
export class InicioPage {
  private readonly roles = inject(RolService);
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly img = IMG;
  protected readonly cifras = CIFRAS;
  protected readonly modulos = MODULOS;
  protected readonly pasos = PASOS;
  protected readonly etapas = ETAPAS;
  protected readonly perfiles = PERFILES;

  protected entrar(rol: RolUsuario): void {
    this.roles.rol.set(rol);
    this.router.navigate(['/', this.roles.vistaInicial()]);
  }

  protected ir(seccion: string): void {
    this.host.nativeElement.querySelector(`#${seccion}`)?.scrollIntoView({ behavior: 'smooth' });
  }
}
