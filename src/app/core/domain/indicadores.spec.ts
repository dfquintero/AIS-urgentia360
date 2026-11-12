import { METAS_TRIAGE_INICIALES, UMBRALES_INICIALES } from '../data/catalogos';
import { Episodio, OrdenDiagnostica, PromedioEtapa, RegistroEtapa } from '../models/urgencias.models';
import {
  alertaEpisodio,
  cuelloDeBotella,
  estadoOrden,
  estadoPublico,
  formatoDuracion,
  tiemposClave,
  vistaEnTiempo,
} from './indicadores';

const MIN = 60_000;
const r = (etapa: RegistroEtapa['etapa'], llegada: number, entrada: number | null, salida: number | null): RegistroEtapa => ({
  etapa,
  llegada: llegada * MIN,
  entrada: entrada == null ? null : entrada * MIN,
  salida: salida == null ? null : salida * MIN,
  responsable: entrada == null ? null : 'X',
});

const episodio = (historial: RegistroEtapa[], extra: Partial<Episodio> = {}): Episodio => ({
  id: 'DEM-URG-00001',
  turno: 'TURNO-FICT-00001',
  triage: 'III',
  grupoEdad: '40-64',
  demanda: 'Dolor',
  responsable: 'MED-FICT-01',
  historial,
  ...extra,
});

describe('indicadores', () => {
  it('reconstruye el estado del episodio en un instante de la reproducción', () => {
    const e = episodio([r('punto0', 0, 0, 0), r('triage', 0, 10, 15), r('admision', 15, 20, 20)], { egreso: 999 * MIN });
    const v = vistaEnTiempo(e, 12 * MIN)!;
    expect(v.historial.map((x) => x.etapa)).toEqual(['punto0', 'triage']);
    expect(v.historial[1].salida).toBeNull();
    expect(v.triage).toBeNull();
    expect(v.egreso).toBeUndefined();
    expect(vistaEnTiempo(e, -1)).toBeNull();
  });

  it('alerta por umbral ilustrativo de la etapa', () => {
    const e = episodio([r('punto0', 0, 0, 0), r('triage', 0, null, null)], { triage: null });
    expect(alertaEpisodio(e, 10 * MIN, UMBRALES_INICIALES, METAS_TRIAGE_INICIALES).nivel).toBe('ok');
    expect(alertaEpisodio(e, 15 * MIN, UMBRALES_INICIALES, METAS_TRIAGE_INICIALES).nivel).toBe('amarillo');
    expect(alertaEpisodio(e, 30 * MIN, UMBRALES_INICIALES, METAS_TRIAGE_INICIALES).nivel).toBe('rojo');
  });

  it('alerta por la meta normativa de Triage II (30 min hasta valoración médica)', () => {
    const e = episodio([r('triage', 0, 2, 5), r('admision', 5, 6, 6), r('valoracion', 6, null, null)], { triage: 'II' });
    expect(alertaEpisodio(e, 25 * MIN, UMBRALES_INICIALES, METAS_TRIAGE_INICIALES).nivel).toBe('amarillo');
    const rojo = alertaEpisodio(e, 36 * MIN, UMBRALES_INICIALES, METAS_TRIAGE_INICIALES);
    expect(rojo.nivel).toBe('rojo');
    expect(rojo.motivo).toContain('Triage II');
  });

  it('identifica como cuello de botella la etapa con mayor espera', () => {
    const base = { nombre: '', atencion: 0, total: 0, n: 1 };
    const promedios: PromedioEtapa[] = [
      { ...base, id: 'triage', etapa: 'Triage', espera: 8 },
      { ...base, id: 'valoracion', etapa: 'Valoración', espera: 90 },
      { ...base, id: 'ayudas', etapa: 'Ayudas', espera: 120, n: 0 },
    ];
    expect(cuelloDeBotella(promedios)?.id).toBe('valoracion');
  });

  it('muestra a acompañantes solo un estado genérico', () => {
    expect(estadoPublico(episodio([r('triage', 0, null, null)]))).toBe('En espera de triage');
    expect(estadoPublico(episodio([r('valoracion', 0, 1, null)]))).toBe('En valoración');
    expect(estadoPublico(episodio([r('ayudas', 0, null, null)]))).toBe('En ayudas diagnósticas');
  });

  it('deriva el estado de una orden diagnóstica según el instante', () => {
    const o: OrdenDiagnostica = {
      id: 'O', episodioId: 'E', tipo: 'Laboratorio', descripcion: '', sistema: '',
      solicitud: 10, toma: 20, disponible: 30, revisado: null,
    };
    expect(estadoOrden(o, 5)).toBeNull();
    expect(estadoOrden(o, 15)).toBe('Solicitada');
    expect(estadoOrden(o, 25)).toBe('En proceso');
    expect(estadoOrden(o, 35)).toBe('Disponible');
  });

  it('calcula las métricas de la hoja LEEME', () => {
    const e = episodio([r('punto0', 0, 0, 0), r('triage', 0, 31, 34), r('admision', 34, 46, 46), r('valoracion', 46, 125, null)]);
    expect(tiemposClave(e)).toEqual({ turnoATriage: 31, finTriageAMedico: 91, turnoAMedico: 125, estanciaTotal: null });
  });

  it('formatea duraciones', () => {
    expect(formatoDuracion(65_000)).toBe('01:05');
    expect(formatoDuracion(3_725_000)).toBe('1:02:05');
  });
});
