import { ETAPAS } from '../data/catalogos';
import { NivelAlerta, Paciente, PromedioEtapa, Umbrales } from '../models/urgencias.models';
import { registroActual } from './flujo';

const MIN = 60_000;

export const tiempoEnEtapa = (p: Paciente, ahora: number): number =>
  Math.max(0, ahora - registroActual(p).llegada);

export function nivelAlerta(p: Paciente, ahora: number, umbrales: Umbrales): NivelAlerta {
  const minutos = tiempoEnEtapa(p, ahora) / MIN;
  const u = umbrales[registroActual(p).etapa];
  if (minutos >= u.rojo) return 'rojo';
  if (minutos >= u.amarillo) return 'amarillo';
  return 'ok';
}

export function formatoDuracion(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const dos = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${dos(m)}:${dos(s)}` : `${dos(m)}:${dos(s)}`;
}

const redondear = (n: number) => Math.round(n * 10) / 10;

/** Promedio de espera (llegada → entrada) y atención (entrada → salida) por etapa, en minutos. */
export function promediosPorEtapa(pacientes: readonly Paciente[], ahora: number): PromedioEtapa[] {
  const acumulado = new Map(ETAPAS.map((e) => [e.id, { espera: 0, atencion: 0, n: 0 }]));
  for (const p of pacientes) {
    for (const r of p.historial) {
      const a = acumulado.get(r.etapa)!;
      a.espera += ((r.entrada ?? ahora) - r.llegada) / MIN;
      a.atencion += r.entrada ? ((r.salida ?? ahora) - r.entrada) / MIN : 0;
      a.n += 1;
    }
  }
  return ETAPAS.map((e) => {
    const a = acumulado.get(e.id)!;
    const espera = a.n ? redondear(a.espera / a.n) : 0;
    const atencion = a.n ? redondear(a.atencion / a.n) : 0;
    return { id: e.id, etapa: e.corto, nombre: e.nombre, espera, atencion, total: redondear(espera + atencion), n: a.n };
  });
}

/** Etapa con mayor tiempo promedio de espera. */
export function cuelloDeBotella(promedios: readonly PromedioEtapa[]): PromedioEtapa | null {
  return promedios
    .filter((p) => p.n > 0)
    .reduce<PromedioEtapa | null>((max, p) => (!max || p.espera > max.espera ? p : max), null);
}

/** Estado genérico para acompañantes: sin nombres ni información clínica. */
export function estadoPublico(p: Paciente): string {
  const r = registroActual(p);
  if (r.etapa === 'ayudas') return 'En ayudas diagnósticas';
  if (r.etapa === 'egreso') return 'En proceso de salida';
  if (!r.entrada || r.etapa === 'punto0') return 'En espera';
  if (r.etapa === 'admision') return 'En admisión';
  return 'En valoración';
}
