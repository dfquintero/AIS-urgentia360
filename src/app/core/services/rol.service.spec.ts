import { PERFILES, perfilDe } from './rol.service';

describe('matriz de roles simulados', () => {
  it('el acompañante solo accede a su vista limitada', () => {
    expect(perfilDe('acompanante').vistas).toEqual(['acompanantes']);
  });

  it('el perfil directivo/analista solo ve indicadores agregados', () => {
    expect(perfilDe('analista').vistas).toEqual(['resumen', 'etapas', 'horarios', 'perfiles', 'ayudas', 'ans']);
    expect(perfilDe('analista').configuraUmbrales).toBe(false);
  });

  it('asistencial ve solo pacientes, registro y trazabilidad; configuración solo para quien configura umbrales', () => {
    expect(perfilDe('asistencial').vistas).toEqual(['pacientes', 'registro', 'trazabilidad']);
    for (const p of PERFILES) expect(p.vistas.includes('configuracion')).toBe(p.configuraUmbrales);
  });

  it('ningún perfil distinto de demostración combina acompañantes con vistas clínicas', () => {
    for (const p of PERFILES.filter((x) => x.id !== 'demo')) {
      if (p.vistas.includes('acompanantes')) expect(p.vistas).toHaveLength(1);
    }
  });
});
