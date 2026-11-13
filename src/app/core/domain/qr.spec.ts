import { codigoDesdeQr } from './qr';

describe('codigoDesdeQr', () => {
  it('devuelve el código tal como lo genera el QR del paciente', () => {
    expect(codigoDesdeQr('TURNO-FICT-00085')).toBe('TURNO-FICT-00085');
    expect(codigoDesdeQr(' dem-urg-00198 \n')).toBe('DEM-URG-00198');
  });

  it('extrae el código cuando el QR trae texto alrededor', () => {
    expect(codigoDesdeQr('https://ejemplo.org/#/turno/TURNO-FICT-00012?x=1')).toBe('TURNO-FICT-00012');
  });

  it('deja pasar otros textos para que la consulta responda «no encontrado»', () => {
    expect(codigoDesdeQr('hola')).toBe('HOLA');
  });
});
