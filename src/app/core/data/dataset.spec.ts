import { generarDatasetRespaldo } from './dataset';

describe('base de datos sintética', () => {
  it('genera datos de respaldo con la estructura de la base y episodios abiertos al corte', () => {
    const d = generarDatasetRespaldo();
    expect(d.esRespaldo).toBe(true);
    expect(d.episodios).toHaveLength(360);
    expect(d.capacidad).toHaveLength(84);
    expect(d.episodios.some((e) => e.egreso == null)).toBe(true);
    expect(d.eventos.every((e, i, l) => i === 0 || l[i - 1].ts <= e.ts)).toBe(true);
    expect(d.ordenes.every((o) => o.solicitud <= d.corte)).toBe(true);
  });

});
