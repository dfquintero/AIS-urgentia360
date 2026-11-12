import { inject } from '@angular/core';
import { CanMatchFn, Router, Routes } from '@angular/router';
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

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: vistaInicial },
  {
    path: 'cuellos',
    title: 'Cuellos de botella · Urgentia 360',
    canMatch: [accesoPorRol],
    providers: [graficos],
    loadComponent: () => import('./features/cuellos/cuellos.page').then((m) => m.CuellosPage),
  },
  {
    path: 'operacion',
    title: 'Operación · Urgentia 360',
    canMatch: [accesoPorRol],
    loadComponent: () => import('./features/operacion/operacion.page').then((m) => m.OperacionPage),
  },
  {
    path: 'coordinacion',
    title: 'Coordinación · Urgentia 360',
    canMatch: [accesoPorRol],
    providers: [graficos],
    loadComponent: () => import('./features/coordinacion/coordinacion.page').then((m) => m.CoordinacionPage),
  },
  { path: 'trazabilidad', title: 'Trazabilidad · Urgentia 360', canMatch: [accesoPorRol], loadComponent: trazabilidad },
  { path: 'trazabilidad/:id', title: 'Trazabilidad · Urgentia 360', canMatch: [accesoPorRol], loadComponent: trazabilidad },
  {
    path: 'acompanantes',
    title: 'Acompañantes · Urgentia 360',
    canMatch: [accesoPorRol],
    loadComponent: () => import('./features/acompanantes/acompanantes.page').then((m) => m.AcompanantesPage),
  },
  { path: '**', redirectTo: vistaInicial },
];
