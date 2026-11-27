import { PERFILES, perfilDe } from './rol.service';

describe('matriz de roles simulados', () => {
  it('el acompañante solo accede a su vista limitada', () => {
    expect(perfilDe('acompanante').vistas).toEqual(['acompanantes']);
  });

  it('recepción solo ve Registro QR: genera turnos sin ver datos clínicos', () => {
    expect(perfilDe('recepcion').vistas).toEqual(['registro']);
    expect(perfilDe('recepcion').configuraUmbrales).toBe(false);
  });

  it('atención clínica ve pacientes, registro y trazabilidad; configuración solo para quien configura umbrales', () => {
    expect(perfilDe('atencion').vistas).toEqual(['pacientes', 'registro', 'trazabilidad']);
    for (const p of PERFILES) expect(p.vistas.includes('configuracion')).toBe(p.configuraUmbrales);
  });

  it('coordinación conserva análisis, operación y configuración', () => {
    expect(perfilDe('coordinacion').vistas).toEqual([
      'resumen', 'etapas', 'horarios', 'perfiles', 'ayudas', 'ans',
      'pacientes', 'registro', 'trazabilidad', 'configuracion',
    ]);
  });

  it('ningún perfil distinto de demostración combina acompañantes con vistas clínicas', () => {
    for (const p of PERFILES.filter((x) => x.id !== 'demo')) {
      if (p.vistas.includes('acompanantes')) expect(p.vistas).toHaveLength(1);
    }
  });
});
