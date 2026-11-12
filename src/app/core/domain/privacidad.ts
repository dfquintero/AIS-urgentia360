import { Episodio } from '../models/urgencias.models';
import { estadoPublico } from './indicadores';

/**
 * Código de verificación impreso en el tiquete (simulado): evita que un acompañante consulte
 * turnos ajenos probando números consecutivos.
 */
export function codigoVerificacion(turno: string): string {
  let h = 0x811c9dc5;
  for (const c of `urgentia360:${turno}`) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return String(h % 10_000).padStart(4, '0');
}

export type ResultadoConsulta =
  | { tipo: 'activo'; turno: string; estado: string }
  | { tipo: 'finalizado'; turno: string }
  | { tipo: 'no-encontrado' };

/** Consulta del acompañante: exige el código completo del turno y su código de verificación. */
export function consultarTurno(episodios: readonly Episodio[], turno: string, verificacion: string): ResultadoConsulta {
  const codigo = turno.trim().toUpperCase();
  const e = episodios.find((x) => x.turno.toUpperCase() === codigo);
  if (!e || codigoVerificacion(e.turno) !== verificacion.trim()) return { tipo: 'no-encontrado' };
  if (e.egreso != null) return { tipo: 'finalizado', turno: e.turno };
  return { tipo: 'activo', turno: e.turno, estado: estadoPublico(e) };
}
