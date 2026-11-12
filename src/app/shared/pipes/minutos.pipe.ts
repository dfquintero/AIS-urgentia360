import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'minutos' })
export class MinutosPipe implements PipeTransform {
  transform(valor: number | null | undefined): string {
    if (valor == null) return '—';
    if (valor < 60) return `${Math.round(valor)} min`;
    const h = Math.floor(valor / 60);
    return `${h} h ${String(Math.round(valor % 60)).padStart(2, '0')} min`;
  }
}
