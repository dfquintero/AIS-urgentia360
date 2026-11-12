import { Injectable, computed, signal } from '@angular/core';

export type RolUsuario = 'demo' | 'asistencial' | 'coordinacion' | 'analista' | 'acompanante';
export type Vista = 'cuellos' | 'operacion' | 'coordinacion' | 'trazabilidad' | 'acompanantes';

export interface PerfilRol {
  id: RolUsuario;
  nombre: string;
  descripcion: string;
  vistas: readonly Vista[];
  configuraUmbrales: boolean;
}

// Matriz funcional SUGERIDA por Kantera (respuesta 12): no es un esquema de permisos aprobado.
export const PERFILES: readonly PerfilRol[] = [
  {
    id: 'demo',
    nombre: 'Demostración',
    descripcion: 'Todas las vistas, para presentar el prototipo',
    vistas: ['cuellos', 'operacion', 'coordinacion', 'trazabilidad', 'acompanantes'],
    configuraUmbrales: true,
  },
  {
    id: 'asistencial',
    nombre: 'Médico / Enfermería',
    descripcion: 'Estado de pacientes y alertas pertinentes',
    vistas: ['operacion', 'trazabilidad'],
    configuraUmbrales: false,
  },
  {
    id: 'coordinacion',
    nombre: 'Coordinación de urgencias',
    descripcion: 'Cola, capacidad, demoras y umbrales',
    vistas: ['cuellos', 'operacion', 'coordinacion', 'trazabilidad'],
    configuraUmbrales: true,
  },
  {
    id: 'analista',
    nombre: 'Directivo / Analista',
    descripcion: 'Solo indicadores agregados',
    vistas: ['cuellos', 'coordinacion'],
    configuraUmbrales: false,
  },
  {
    id: 'acompanante',
    nombre: 'Acompañante',
    descripcion: 'Información limitada: código de turno y estado genérico',
    vistas: ['acompanantes'],
    configuraUmbrales: false,
  },
];

const PERFIL_POR_ID = Object.fromEntries(PERFILES.map((p) => [p.id, p])) as Record<RolUsuario, PerfilRol>;

export const perfilDe = (rol: RolUsuario): PerfilRol => PERFIL_POR_ID[rol];

/** Rol simulado (sin autenticación real): solo controla qué vistas se muestran. */
@Injectable({ providedIn: 'root' })
export class RolService {
  readonly rol = signal<RolUsuario>('demo');
  readonly perfil = computed(() => perfilDe(this.rol()));
  readonly vistaInicial = computed(() => this.perfil().vistas[0]);

  puedeVer(vista: string): boolean {
    return (this.perfil().vistas as readonly string[]).includes(vista);
  }
}
