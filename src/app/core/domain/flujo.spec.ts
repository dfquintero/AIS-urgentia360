import { TRANSICIONES } from '../data/catalogos';
import { EtapaId, Episodio, ResultadoEscaneo } from '../models/urgencias.models';
import { accionPendiente, crearEpisodioNuevo, etapaActual, nuevoRegistro, registrarEscaneo, requiereTriage } from './flujo';

const T0 = 1_000_000;

function enEtapa(etapa: EtapaId, enAtencion: boolean, extra: Partial<Episodio> = {}): Episodio {
  const base = crearEpisodioNuevo(1, T0, 'General', '18-39');
  const registro = nuevoRegistro(etapa, T0, enAtencion ? { entrada: T0, responsable: 'MED-FICT-01' } : {});
  return { ...base, ...extra, historial: [registro] };
}

function exito(r: ResultadoEscaneo) {
  if (!r.ok) throw new Error(r.error);
  return r;
}

describe('máquina de estados del flujo de urgencias', () => {
  it('un turno nuevo queda en espera de triage (Punto 0 solo conduce a Triage)', () => {
    expect(TRANSICIONES.punto0).toEqual(['triage']);
    const nuevo = crearEpisodioNuevo(361, T0, 'Dolor', '65+');
    expect(nuevo.id).toBe('DEM-URG-00361');
    expect(etapaActual(nuevo)).toBe('triage');
    expect(accionPendiente(nuevo)).toBe('entrada');
  });

  it('exige responsable para registrar la entrada', () => {
    expect(registrarEscaneo(enEtapa('triage', false), { ahora: T0 }).ok).toBe(false);
  });

  it('registra la entrada con responsable y deja pendiente la salida', () => {
    const r = exito(registrarEscaneo(enEtapa('triage', false), { ahora: T0 + 1, responsable: 'ENF-FICT-01' }));
    expect(accionPendiente(r.episodio)).toBe('salida');
    expect(requiereTriage(r.episodio)).toBe(true);
  });

  it('bloquea la salida de triage sin clasificación', () => {
    const r = registrarEscaneo(enEtapa('triage', true), { ahora: T0 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('obligatorio');
  });

  it('con clasificación pasa a Admisión y guarda el nivel asignado por el profesional', () => {
    const r = exito(registrarEscaneo(enEtapa('triage', true), { ahora: T0 + 5, triage: 'III' }));
    expect(etapaActual(r.episodio)).toBe('admision');
    expect(r.episodio.triage).toBe('III');
    expect(r.episodio.historial[0].salida).toBe(T0 + 5);
  });

  it('desde la primera valoración permite ayudas o conducta, pero no egreso directo', () => {
    const e = enEtapa('valoracion', true, { triage: 'IV' });
    expect(etapaActual(exito(registrarEscaneo(e, { ahora: T0, siguiente: 'ayudas' })).episodio)).toBe('ayudas');
    expect(etapaActual(exito(registrarEscaneo(e, { ahora: T0, siguiente: 'conducta' })).episodio)).toBe('conducta');
    expect(registrarEscaneo(e, { ahora: T0, siguiente: 'egreso' }).ok).toBe(false);
  });

  it('la revaloración puede solicitar nuevas ayudas diagnósticas', () => {
    const r = exito(registrarEscaneo(enEtapa('revaloracion', true, { triage: 'II' }), { ahora: T0, siguiente: 'ayudas' }));
    expect(etapaActual(r.episodio)).toBe('ayudas');
  });

  it('el egreso exige destino y cierra el episodio', () => {
    const e = enEtapa('conducta', true, { triage: 'V' });
    expect(registrarEscaneo(e, { ahora: T0 + 9 }).ok).toBe(false);
    const r = exito(registrarEscaneo(e, { ahora: T0 + 9, destino: 'Alta' }));
    expect(r.egresado).toBe(true);
    expect(r.episodio.egreso).toBe(T0 + 9);
    expect(r.episodio.destino).toBe('Alta');
  });
});
