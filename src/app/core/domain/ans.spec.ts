import { Episodio, RegistroEtapa } from '../models/urgencias.models';
import { DEFINICIONES_ANS, diaBogota, evaluarAns, metasAnsIniciales, tendenciaDiaria } from './ans';

const MIN = 60_000;
const T0 = Date.parse('2026-10-01T00:00:00-05:00');
const r = (etapa: RegistroEtapa['etapa'], llegada: number, entrada: number | null, salida: number | null = null): RegistroEtapa => ({
  etapa, llegada: T0 + llegada * MIN, entrada: entrada == null ? null : T0 + entrada * MIN, salida: salida == null ? null : T0 + salida * MIN, responsable: null,
});
const ep = (triage: Episodio['triage'], turno: number, finTriage: number, medico: number | null): Episodio => ({
  id: `E${turno}`, turno: `T${turno}`, triage, grupoEdad: '18-39', demanda: 'General', responsable: 'M',
  historial: [r('punto0', turno, turno, turno), r('triage', turno, turno + 2, finTriage), r('admision', finTriage, finTriage, finTriage), r('valoracion', finTriage, medico)],
});
const def = (id: string) => DEFINICIONES_ANS.find((d) => d.id === id)!;

describe('ANS', () => {
  it('diferencia normativos, operativos y contractuales; III–V por definir', () => {
    const metas = metasAnsIniciales();
    expect(metas['T-II']).toBe(30);
    expect(metas['T-III']).toBeNull();
    expect(DEFINICIONES_ANS.map((d) => d.tipo)).toEqual(expect.arrayContaining(['Normativo', 'Operativo', 'Contractual']));
  });

  it('calcula el porcentaje de cumplimiento de Triage II', () => {
    const episodios = [ep('II', 0, 5, 20), ep('II', 0, 5, 50), ep('II', 0, 5, 35), ep('III', 0, 5, 100), ep('II', 0, 5, null)];
    expect(evaluarAns(def('T-II'), 30, episodios)).toEqual({ medidos: 3, cumplen: 2, cumplimiento: 66.7 });
  });

  it('sin meta definida no calcula cumplimiento', () => {
    expect(evaluarAns(def('T-III'), null, [ep('III', 0, 5, 100)]).cumplimiento).toBeNull();
    expect(evaluarAns(def('CONTRATO-EPS'), 60, [ep('III', 0, 5, 100)]).medidos).toBe(0);
  });

  it('agrupa la tendencia por día de Bogotá', () => {
    expect(diaBogota(T0 + 23 * 60 * MIN)).toBe(T0);
    const t = tendenciaDiaria(def('T-II'), 30, [ep('II', 0, 5, 20), ep('II', 24 * 60, 24 * 60 + 5, 24 * 60 + 60)]);
    expect(t.map((x) => x.cumplimiento)).toEqual([100, 0]);
  });
});
