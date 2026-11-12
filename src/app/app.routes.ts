import { Routes } from '@angular/router';
import { provideEchartsCore } from 'ngx-echarts';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'operacion' },
  {
    path: 'operacion',
    title: 'Operación · Urgentia 360',
    loadComponent: () => import('./features/operacion/operacion.page').then((m) => m.OperacionPage),
  },
  {
    path: 'coordinacion',
    title: 'Coordinación · Urgentia 360',
    providers: [
      provideEchartsCore({ echarts: () => import('./core/graficos/echarts-config').then((m) => m.echarts) }),
    ],
    loadComponent: () => import('./features/coordinacion/coordinacion.page').then((m) => m.CoordinacionPage),
  },
  {
    path: 'acompanantes',
    title: 'Acompañantes · Urgentia 360',
    loadComponent: () => import('./features/acompanantes/acompanantes.page').then((m) => m.AcompanantesPage),
  },
  {
    path: 'trazabilidad',
    title: 'Trazabilidad · Urgentia 360',
    loadComponent: () => import('./features/trazabilidad/trazabilidad.page').then((m) => m.TrazabilidadPage),
  },
  {
    path: 'trazabilidad/:id',
    title: 'Trazabilidad · Urgentia 360',
    loadComponent: () => import('./features/trazabilidad/trazabilidad.page').then((m) => m.TrazabilidadPage),
  },
  { path: '**', redirectTo: 'operacion' },
];
