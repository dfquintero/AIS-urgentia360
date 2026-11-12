import { Episodio } from '../models/urgencias.models';
import { codigoVerificacion, consultarTurno } from './privacidad';

const ep = (n: number, egreso?: number): Episodio => ({
  id: `DEM-URG-${n}`, turno: `TURNO-FICT-${String(n).padStart(5, '0')}`, triage: 'III', grupoEdad: '18-39', demanda: 'General', responsable: 'M',
  historial: [{ etapa: 'valoracion', llegada: 0, entrada: null, salida: null, responsable: null }], egreso,
});

describe('consulta de acompañantes', () => {
  const episodios = [ep(198), ep(199, 10)];
  const pin = codigoVerificacion('TURNO-FICT-00198');

  it('genera un código de 4 dígitos estable y distinto entre turnos', () => {
    expect(pin).toMatch(/^\d{4}$/);
    expect(codigoVerificacion('TURNO-FICT-00198')).toBe(pin);
    expect(codigoVerificacion('TURNO-FICT-00199')).not.toBe(pin);
  });

  it('muestra solo el estado genérico con código completo y verificación correcta', () => {
    expect(consultarTurno(episodios, ' turno-fict-00198 ', pin)).toEqual({ tipo: 'activo', turno: 'TURNO-FICT-00198', estado: 'En espera de valoración' });
  });

  it('no revela nada con el número corto, sin verificación o con verificación ajena', () => {
    expect(consultarTurno(episodios, '198', pin).tipo).toBe('no-encontrado');
    expect(consultarTurno(episodios, 'TURNO-FICT-00198', '').tipo).toBe('no-encontrado');
    expect(consultarTurno(episodios, 'TURNO-FICT-00199', pin).tipo).toBe('no-encontrado');
  });

  it('informa atención finalizada solo al dueño del tiquete', () => {
    expect(consultarTurno(episodios, 'TURNO-FICT-00199', codigoVerificacion('TURNO-FICT-00199')).tipo).toBe('finalizado');
  });
});
