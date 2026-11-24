import { inject, Type } from '@angular/core';
import { CanMatchFn, Route, Router, Routes } from '@angular/router';
import { provideEchartsCore } from 'ngx-echarts';
import { RolService } from './core/services/rol.service';

/** Restringe cada vista al rol simulado activo y redirige a la vista inicial del rol. */
const accesoPorRol: CanMatchFn = (route) => {
  const roles = inject(RolService);
  return roles.puedeVer(route.path?.split('/')[0] ?? '') || inject(Router).createUrlTree(['/', roles.vistaInicial()]);
};

const vistaInicial = () => `/${inject(RolService).vistaInicial()}`;

const graficos = provideEchartsCore({ echarts: () => import('./core/graficos/echarts-config').then((m) => m.echarts) });

const trazabilidad = () => import('./features/trazabilidad/trazabilidad.page').then((m) => m.TrazabilidadPage);

const analisis = (path: string, title: string, pagina: () => Promise<Type<unknown>>, conGraficos = true): Route => ({
  path,
  title: `${title} · Urgentia 360`,
  canMatch: [accesoPorRol],
  providers: conGraficos ? [graficos] : [],
  loadComponent: pagina,
});

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'inicio' },
  {
    path: 'inicio',
    title: 'Urgentia 360 · Trazabilidad operativa de urgencias',
    loadComponent: () => import('./features/inicio/inicio.page').then((m) => m.InicioPage),
  },
  {
    path: 'vision',
    title: 'Urgentia 360 · App conceptual de red',
    loadComponent: () => import('./features/vision/vision.page').then((m) => m.VisionPage),
  },
  analisis('resumen', 'Resumen', () => import('./features/analisis/resumen.page').then((m) => m.ResumenPage), false),
  analisis('etapas', 'Etapas', () => import('./features/analisis/etapas.page').then((m) => m.EtapasPage)),
  analisis('horarios', 'Horarios', () => import('./features/analisis/horarios.page').then((m) => m.HorariosPage)),
  analisis('perfiles', 'Perfiles', () => import('./features/analisis/perfiles.page').then((m) => m.PerfilesPage)),
  analisis('ayudas', 'Ayudas diagnósticas', () => import('./features/analisis/ayudas.page').then((m) => m.AyudasPage)),
  analisis('ans', 'ANS', () => import('./features/ans/ans.page').then((m) => m.AnsPage)),
  analisis('pacientes', 'Pacientes', () => import('./features/operacion/pacientes.page').then((m) => m.PacientesPage), false),
  analisis('registro', 'Registro QR', () => import('./features/operacion/registro.page').then((m) => m.RegistroPage), false),
  analisis('trazabilidad', 'Trazabilidad', trazabilidad, false),
  analisis('trazabilidad/:id', 'Trazabilidad', trazabilidad, false),
  analisis('configuracion', 'Configuración', () => import('./features/configuracion/configuracion.page').then((m) => m.ConfiguracionPage), false),
  analisis('acompanantes', 'Acompañantes', () => import('./features/acompanantes/acompanantes.page').then((m) => m.AcompanantesPage), false),
  // Rutas anteriores a la división en pestañas.
  { path: 'cuellos', redirectTo: 'etapas' },
  { path: 'coordinacion', redirectTo: 'resumen' },
  { path: 'operacion', redirectTo: 'pacientes' },
  { path: '**', redirectTo: vistaInicial },
];
