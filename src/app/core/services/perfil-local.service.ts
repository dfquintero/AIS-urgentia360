import { Injectable, signal } from '@angular/core';

export interface PerfilLocal {
  alias: string;
  edad: number | null;
  embarazo: boolean;
  tipoSangre: string;
  alergias: string;
  condiciones: string;
  medicamentos: string;
  contactoNombre: string;
  contactoTelefono: string;
}

export const PERFIL_VACIO: PerfilLocal = {
  alias: '', edad: null, embarazo: false, tipoSangre: '', alergias: '', condiciones: '', medicamentos: '', contactoNombre: '', contactoTelefono: '',
};

const CLAVE = 'urgentia360.perfil-local';

/** Perfil médico de la app conceptual: se guarda solo en el navegador del dispositivo (localStorage). */
@Injectable({ providedIn: 'root' })
export class PerfilLocalService {
  readonly perfil = signal<PerfilLocal | null>(this.leer());

  guardar(perfil: PerfilLocal): void {
    this.perfil.set({ ...perfil });
    try {
      localStorage.setItem(CLAVE, JSON.stringify(perfil));
    } catch {
      // Sin almacenamiento disponible (modo privado): el perfil vive solo en memoria.
    }
  }

  borrar(): void {
    this.perfil.set(null);
    try {
      localStorage.removeItem(CLAVE);
    } catch {
      // Ignorado: no hay nada que borrar.
    }
  }

  private leer(): PerfilLocal | null {
    try {
      const crudo = localStorage.getItem(CLAVE);
      return crudo ? { ...PERFIL_VACIO, ...JSON.parse(crudo) } : null;
    } catch {
      return null;
    }
  }
}
