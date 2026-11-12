import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'minutos' })
export class MinutosPipe implements PipeTransform {
  transform(valor: number | null | undefined): string {
    if (valor == null) return '—';
    const total = Math.round(valor);
    if (total < 60) return `${total} min`;
    return `${Math.floor(total / 60)} h ${String(total % 60).padStart(2, '0')} min`;
  }
}
