import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'hora' })
export class HoraPipe implements PipeTransform {
  transform(ts: number | null | undefined, conSegundos = true): string {
    if (ts == null) return '—';
    return new Date(ts).toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      ...(conSegundos ? { second: '2-digit' } : {}),
    });
  }
}
