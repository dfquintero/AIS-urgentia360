import { UMBRALES_INICIALES } from '../data/catalogos';
import { crearPaciente, nuevoRegistro } from '../data/datos-simulados';
import { EtapaId, Paciente, PromedioEtapa } from '../models/urgencias.models';
import { cuelloDeBotella, estadoPublico, formatoDuracion, nivelAlerta } from './indicadores';

const MIN = 60_000;

const paciente = (etapa: EtapaId, llegada: number, entrada: number | null = null): Paciente => ({
  ...crearPaciente(1, 0, () => 0.5),
  historial: [nuevoRegistro(etapa, llegada, { entrada })],
});

describe('indicadores', () => {
  it('calcula el nivel de alerta según los umbrales de la etapa', () => {
    const p = paciente('triage', 0);
    expect(nivelAlerta(p, 10 * MIN, UMBRALES_INICIALES)).toBe('ok');
    expect(nivelAlerta(p, 15 * MIN, UMBRALES_INICIALES)).toBe('amarillo');
    expect(nivelAlerta(p, 30 * MIN, UMBRALES_INICIALES)).toBe('rojo');
  });

  it('identifica como cuello de botella la etapa con mayor espera', () => {
    const base = { nombre: '', atencion: 0, total: 0, n: 1 };
    const promedios: PromedioEtapa[] = [
      { ...base, id: 'triage', etapa: 'Triage', espera: 8 },
      { ...base, id: 'consulta', etapa: 'Consulta', espera: 35 },
      { ...base, id: 'ayudas', etapa: 'Ayudas', espera: 50, n: 0 },
    ];
    expect(cuelloDeBotella(promedios)?.id).toBe('consulta');
  });

  it('muestra a acompañantes solo un estado genérico', () => {
    expect(estadoPublico(paciente('consulta', 0))).toBe('En espera');
    expect(estadoPublico(paciente('consulta', 0, 1))).toBe('En valoración');
    expect(estadoPublico(paciente('ayudas', 0))).toBe('En ayudas diagnósticas');
  });

  it('formatea duraciones', () => {
    expect(formatoDuracion(65_000)).toBe('01:05');
    expect(formatoDuracion(3_725_000)).toBe('1:02:05');
  });
});
