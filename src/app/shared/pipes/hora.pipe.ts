import { Pipe, PipeTransform } from '@angular/core';

export type FormatoHora = 'hora' | 'hora-corta' | 'fecha-hora' | 'reloj';

const OPCIONES: Record<FormatoHora, Intl.DateTimeFormatOptions> = {
  hora: { hour: '2-digit', minute: '2-digit', second: '2-digit' },
  'hora-corta': { hour: '2-digit', minute: '2-digit' },
  'fecha-hora': { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' },
  reloj: { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' },
};

const FORMATOS = Object.fromEntries(
  Object.entries(OPCIONES).map(([k, o]) => [k, new Intl.DateTimeFormat('es-CO', { ...o, timeZone: 'America/Bogota' })]),
) as Record<FormatoHora, Intl.DateTimeFormat>;

/** Hora de Bogotá, la zona horaria de la base sintética. */
@Pipe({ name: 'hora' })
export class HoraPipe implements PipeTransform {
  transform(ts: number | null | undefined, formato: FormatoHora = 'hora'): string {
    return ts == null ? '—' : FORMATOS[formato].format(ts);
  }
}
