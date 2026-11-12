import { avanzarReloj } from './reloj.service';

describe('reloj de reproducción', () => {
  it('se detiene exactamente en el corte al cruzarlo', () => {
    expect(avanzarReloj(900, 300, 1000)).toEqual({ t: 1000, llegoAlCorte: true });
  });

  it('avanza normalmente antes del corte y después de reanudar manualmente', () => {
    expect(avanzarReloj(100, 300, 1000)).toEqual({ t: 400, llegoAlCorte: false });
    expect(avanzarReloj(1000, 300, 1000)).toEqual({ t: 1300, llegoAlCorte: false });
  });
});
