import { Injectable, computed, signal } from '@angular/core';

export type RolUsuario = 'demo' | 'recepcion' | 'atencion' | 'coordinacion' | 'acompanante';
export type Vista =
  | 'resumen'
  | 'etapas'
  | 'horarios'
  | 'perfiles'
  | 'ayudas'
  | 'ans'
  | 'pacientes'
  | 'registro'
  | 'trazabilidad'
  | 'configuracion'
  | 'acompanantes';

const ANALISIS: readonly Vista[] = ['resumen', 'etapas', 'horarios', 'perfiles', 'ayudas', 'ans'];
const OPERACION: readonly Vista[] = ['pacientes', 'registro', 'trazabilidad'];

export interface PerfilRol {
  id: RolUsuario;
  nombre: string;
  descripcion: string;
  vistas: readonly Vista[];
  configuraUmbrales: boolean;
}

// Matriz funcional SUGERIDA por el equipo (datos mínimos por rol): no es un esquema de permisos aprobado.
export const PERFILES: readonly PerfilRol[] = [
  {
    id: 'demo',
    nombre: 'Demostración',
    descripcion: 'Todas las vistas, para presentar el prototipo',
    vistas: [...ANALISIS, ...OPERACION, 'configuracion', 'acompanantes'],
    configuraUmbrales: true,
  },
  {
    id: 'recepcion',
    nombre: 'Recepción',
    descripcion: 'Celador, recepcionista o enfermera de entrada: genera turno y QR con datos básicos',
    vistas: ['registro'],
    configuraUmbrales: false,
  },
  {
    id: 'atencion',
    nombre: 'Atención clínica',
    descripcion: 'Enfermería, médico y personal diagnóstico: pacientes y su trazabilidad',
    vistas: OPERACION,
    configuraUmbrales: false,
  },
  {
    id: 'coordinacion',
    nombre: 'Coordinación de urgencias',
    descripcion: 'Cola, indicadores, demoras y umbrales',
    vistas: [...ANALISIS, ...OPERACION, 'configuracion'],
    configuraUmbrales: true,
  },
  {
    id: 'acompanante',
    nombre: 'Acompañante',
    descripcion: 'Información limitada: código de turno y estado genérico',
    vistas: ['acompanantes'],
    configuraUmbrales: false,
  },
];

// Responsable registrado por defecto en cada escaneo cuando no se elige uno: identifica el rol, no a una persona.
export const RESPONSABLE_POR_ROL: Readonly<Record<RolUsuario, string>> = {
  demo: 'Registro QR',
  recepcion: 'Recepción · Punto',
  atencion: 'Equipo asistencial',
  coordinacion: 'Coordinación',
  acompanante: 'Registro QR',
};

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
