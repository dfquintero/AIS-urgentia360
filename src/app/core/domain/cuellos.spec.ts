import { Episodio, OrdenDiagnostica, RegistroEtapa } from '../models/urgencias.models';
import { cortePorGrupo, desgloseOrdenes, horaBogota, mapaCalorHoras, percentil, rankingEtapas, resumenCuello } from './cuellos';

const MIN = 60_000;
// 2026-10-01 00:00 en Bogotá.
const T0 = Date.parse('2026-10-01T00:00:00-05:00');
const r = (etapa: RegistroEtapa['etapa'], llegada: number, entrada: number | null): RegistroEtapa => ({
  etapa,
  llegada: T0 + llegada * MIN,
  entrada: entrada == null ? null : T0 + entrada * MIN,
  salida: null,
  responsable: null,
});
const ep = (id: string, triage: Episodio['triage'], historial: RegistroEtapa[]): Episodio => ({
  id, turno: id, triage, grupoEdad: '18-39', demanda: 'General', responsable: 'MED', historial,
});

describe('cuellos de botella', () => {
  it('calcula percentiles con interpolación', () => {
    expect(percentil([10, 20, 30, 40], 0.5)).toBe(25);
    expect(percentil([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 0.9)).toBe(9.1);
    expect(percentil([], 0.5)).toBeNull();
  });

  it('convierte a hora de Bogotá', () => {
    expect(horaBogota(T0)).toBe(0);
    expect(horaBogota(T0 + 17 * 60 * MIN)).toBe(17);
  });

  const episodios = [
    ep('A', 'III', [r('triage', 0, 10), r('valoracion', 20, 140)]),
    ep('B', 'III', [r('triage', 0, 5), r('valoracion', 15, 115)]),
    ep('C', 'II', [r('triage', 0, 2), r('valoracion', 10, 20)]),
    ep('D', 'III', [r('triage', 0, 4), r('valoracion', 30, null)]),
  ];
  const ahora = T0 + 130 * MIN;

  it('ordena las etapas por espera y cuenta la cola actual', () => {
    const ranking = rankingEtapas(episodios, episodios, ahora);
    expect(ranking[0].id).toBe('valoracion');
    expect(ranking[0].enCola).toBe(1);
    expect(ranking[0].mediana).toBe(100);
  });

  it('agrupa por hora de llegada y por triage y genera un resumen', () => {
    const horas = mapaCalorHoras(episodios, ahora);
    expect(horas.find((c) => c.fila === 'Valoración' && c.columna === '00')?.n).toBe(4);
    const triage = cortePorGrupo(episodios, ahora, (e) => e.triage, ['II', 'III']);
    expect(triage.find((c) => c.fila === 'II' && c.columna === 'Valoración')?.valor).toBe(10);
    const texto = resumenCuello(rankingEtapas(episodios, episodios, ahora), horas, triage)!;
    expect(texto).toContain('primera valoración médica');
    expect(texto).toContain('Triage III');
  });

  it('desglosa las órdenes por paso y cuenta pendientes', () => {
    const o = (tipo: string, t: (number | null)[]): OrdenDiagnostica => ({
      id: tipo + t[0], episodioId: 'A', tipo, descripcion: '', sistema: '',
      solicitud: T0 + t[0]! * MIN, toma: t[1] == null ? null : T0 + t[1] * MIN,
      disponible: t[2] == null ? null : T0 + t[2] * MIN, revisado: t[3] == null ? null : T0 + t[3] * MIN,
    });
    const [lab] = desgloseOrdenes([o('Laboratorio', [0, 10, 70, 80]), o('Laboratorio', [0, 20, null, null])], T0 + 100 * MIN);
    expect(lab).toEqual({ tipo: 'Laboratorio', solicitudAToma: 15, tomaAResultado: 60, resultadoARevision: 10, pendientes: { toma: 0, resultado: 1, revision: 0 } });
  });

  it('no acumula espera después del egreso de un episodio que nunca fue atendido en la etapa', () => {
    const cerrado: Episodio = { ...ep('E', 'IV', [r('triage', 0, 5), r('ayudas', 10, null)]), egreso: T0 + 40 * MIN };
    const [ayudas] = rankingEtapas([cerrado], [], T0 + 5000 * MIN).filter((x) => x.id === 'ayudas');
    expect(ayudas.promedio).toBe(30);
  });
});
