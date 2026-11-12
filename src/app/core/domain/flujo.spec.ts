import { TRANSICIONES } from '../data/catalogos';
import { crearPaciente, nuevoRegistro } from '../data/datos-simulados';
import { EtapaId, Paciente, ResultadoEscaneo } from '../models/urgencias.models';
import { accionPendiente, etapaActual, registrarEscaneo, requiereTriage } from './flujo';

const T0 = 1_000_000;

function enEtapa(etapa: EtapaId, enAtencion: boolean, extra: Partial<Paciente> = {}): Paciente {
  const base = crearPaciente(1, T0, () => 0.5);
  const registro = nuevoRegistro(etapa, T0, enAtencion ? { entrada: T0, responsable: 'Resp' } : {});
  return { ...base, ...extra, historial: [registro] };
}

function exito(r: ResultadoEscaneo) {
  if (!r.ok) throw new Error(r.error);
  return r;
}

describe('máquina de estados del flujo de urgencias', () => {
  it('Punto 0 solo conduce a Triage (el triage no se puede omitir)', () => {
    expect(TRANSICIONES.punto0).toEqual(['triage']);
    const r = registrarEscaneo(enEtapa('punto0', true), { ahora: T0, siguiente: 'admision' });
    expect(r.ok).toBe(false);
  });

  it('exige responsable para registrar la entrada', () => {
    const r = registrarEscaneo(enEtapa('triage', false), { ahora: T0 });
    expect(r.ok).toBe(false);
  });

  it('registra la entrada con responsable y deja pendiente la salida', () => {
    const r = exito(registrarEscaneo(enEtapa('triage', false), { ahora: T0 + 1, responsable: 'Enf. A' }));
    expect(accionPendiente(r.paciente)).toBe('salida');
    expect(requiereTriage(r.paciente)).toBe(true);
  });

  it('bloquea la salida de triage sin clasificación', () => {
    const r = registrarEscaneo(enEtapa('triage', true), { ahora: T0 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('obligatorio');
  });

  it('con clasificación pasa a Admisión y guarda el nivel asignado', () => {
    const r = exito(registrarEscaneo(enEtapa('triage', true), { ahora: T0 + 5, triage: 'III' }));
    expect(etapaActual(r.paciente)).toBe('admision');
    expect(r.paciente.triage).toBe('III');
    expect(r.paciente.historial[0].salida).toBe(T0 + 5);
  });

  it('desde Consulta permite Ayudas o Valoración directa, pero no Egreso', () => {
    const p = enEtapa('consulta', true, { triage: 'IV' });
    expect(etapaActual(exito(registrarEscaneo(p, { ahora: T0, siguiente: 'ayudas' })).paciente)).toBe('ayudas');
    expect(etapaActual(exito(registrarEscaneo(p, { ahora: T0, siguiente: 'valoracion' })).paciente)).toBe('valoracion');
    expect(registrarEscaneo(p, { ahora: T0, siguiente: 'egreso' }).ok).toBe(false);
  });

  it('la revaloración mantiene al paciente en Valoración e incrementa el contador', () => {
    const r = exito(registrarEscaneo(enEtapa('valoracion', true, { triage: 'II' }), { ahora: T0, siguiente: 'valoracion' }));
    expect(etapaActual(r.paciente)).toBe('valoracion');
    expect(r.paciente.historial.at(-1)?.revaloracion).toBe(1);
  });

  it('la salida de Egreso finaliza la atención', () => {
    const r = exito(registrarEscaneo(enEtapa('egreso', true, { triage: 'V' }), { ahora: T0 + 9 }));
    expect(r.egresado).toBe(true);
    expect(r.paciente.egreso).toBe(T0 + 9);
  });
});
