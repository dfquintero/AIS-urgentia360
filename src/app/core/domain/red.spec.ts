import {
  compararAlternativas, dentroDeBogota, distanciaKm, esperaEstimada, generarCentros, hitosRecorrido, ORIGEN_SIMULADO,
  Prediagnostico, prioridadOrientativa, tiempoEnCarro,
} from './red';

const base: Prediagnostico = { alarmas: [], sintoma: 'Fiebre', dolor: 2, duracion: 'horas', edad: 30, embarazo: false, condiciones: '' };

describe('Red simulada', () => {
  it('genera centros estables, distintos y dentro de Bogotá', () => {
    const a = generarCentros(360, 8);
    expect(a).toEqual(generarCentros(360, 8));
    expect(a).toHaveLength(8);
    expect(new Set(a.map((c) => c.localidad)).size).toBe(8);
    expect(a.every((c) => dentroDeBogota(c.posicion) && c.carga >= 0.2 && c.carga <= 1)).toBe(true);
  });

  it('calcula distancias y el tiempo en carro según la hora', () => {
    const norte = { lat: 4.7, lon: -74.04 };
    expect(distanciaKm(ORIGEN_SIMULADO, ORIGEN_SIMULADO)).toBe(0);
    expect(distanciaKm(ORIGEN_SIMULADO, norte)).toBeCloseTo(8.56, 1);
    expect(tiempoEnCarro(ORIGEN_SIMULADO, norte, 7)).toBeGreaterThan(tiempoEnCarro(ORIGEN_SIMULADO, norte, 2));
  });

  it('el más cercano no siempre es el de menor total', () => {
    const [cerca, lejos] = generarCentros(1, 2);
    const centros = [
      { ...cerca, id: 'A', posicion: { lat: 4.652, lon: -74.1 }, carga: 1 },
      { ...lejos, id: 'B', posicion: { lat: 4.69, lon: -74.1 }, carga: 0.2 },
    ];
    const [mejor] = compararAlternativas(ORIGEN_SIMULADO, centros, 'media', 11);
    expect(mejor.centro.id).toBe('B');
    expect(mejor.total).toBe(mejor.desplazamiento + mejor.espera);
    expect(esperaEstimada(centros[0], 'vital', 11)).toBe(0);
  });

  it('los hitos del recorrido son crecientes y terminan en el total', () => {
    const [a] = compararAlternativas(ORIGEN_SIMULADO, generarCentros(), 'media', 18);
    const hitos = hitosRecorrido(a, 'media').map((h) => h.minuto);
    expect([...hitos].sort((x, y) => x - y)).toEqual(hitos);
    expect(hitos.at(-1)).toBe(a.total);
  });

  it('la prioridad orientativa sube con señales de alarma, dolor y vulnerabilidad', () => {
    expect(prioridadOrientativa(base)).toBe('baja');
    expect(prioridadOrientativa({ ...base, dolor: 6 })).toBe('media');
    expect(prioridadOrientativa({ ...base, dolor: 6, edad: 70 })).toBe('alta');
    expect(prioridadOrientativa({ ...base, embarazo: true })).toBe('media');
    expect(prioridadOrientativa({ ...base, alarmas: ['Pérdida de conciencia o convulsión'] })).toBe('vital');
  });
});
