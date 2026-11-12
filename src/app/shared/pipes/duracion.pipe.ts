import { Pipe, PipeTransform } from '@angular/core';
import { formatoDuracion } from '../../core/domain/indicadores';

@Pipe({ name: 'duracion' })
export class DuracionPipe implements PipeTransform {
  transform(ms: number): string {
    return formatoDuracion(ms);
  }
}
