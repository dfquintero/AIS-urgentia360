import { Injectable, signal } from '@angular/core';
import { DatasetCrudo, generarDatasetRespaldo, parsearDataset } from '../data/dataset';
import { Dataset } from '../models/urgencias.models';

/** Carga la base sintética (archivo estático, sin backend) o, si no existe, genera datos de respaldo. */
@Injectable({ providedIn: 'root' })
export class DatasetService {
  private readonly datos = signal<Dataset | null>(null);

  async cargar(url = 'datos/urgentia360.json'): Promise<void> {
    try {
      const respuesta = await fetch(url);
      if (!respuesta.ok) throw new Error(String(respuesta.status));
      this.datos.set(parsearDataset((await respuesta.json()) as DatasetCrudo));
    } catch {
      this.datos.set(generarDatasetRespaldo());
    }
  }

  get dataset(): Dataset {
    const datos = this.datos();
    if (!datos) throw new Error('La base de datos sintética aún no se ha cargado.');
    return datos;
  }
}
