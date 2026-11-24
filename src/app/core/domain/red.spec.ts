import {
  compararAlternativas, dentroDeBogota, distanciaKm, esperaEstimada, generarCentros, hitosRecorrido, ORIGEN_SIMULADO,
  ocupacion, Prediagnostico, prioridadOrientativa, serviciosRequeridos, Solicitud, tiempoEnCarro,
} from './red';

const solicitud: Solicitud = { prioridad: 'media', sintoma: 'Otro', edad: 30, embarazo: false };

const base: Prediagnostico = { alarmas: [], sintoma: 'Fiebre', dolor: 2, duracion: 'horas', edad: 30, embarazo: false, condiciones: '' };

describe('Red simulada', () => {
  it('genera centros estables, distintos y dentro de Bogotá', () => {
    const a = generarCentros(360, 8);
    expect(a).toEqual(generarCentros(360, 8));
    expect(a).toHaveLength(8);
    expect(new Set(a.map((c) => c.localidad)).size).toBe(8);
    expect(a.every((c) => dentroDeBogota(c.posicion) && c.carga >= 0.2 && c.carga <= 1)).toBe(true);
    expect(a.every((c) => c.consultorios >= 2 && c.servicios.includes('Procedimientos'))).toBe(true);
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
      { ...cerca, id: 'A', posicion: { lat: 4.652, lon: -74.1 }, carga: 1, consultorios: 3 },
      { ...lejos, id: 'B', posicion: { lat: 4.69, lon: -74.1 }, carga: 0.2, consultorios: 3 },
    ];
    const [mejor] = compararAlternativas(ORIGEN_SIMULADO, centros, solicitud, 11);
    expect(mejor.centro.id).toBe('B');
    expect(mejor.total).toBe(mejor.desplazamiento + mejor.espera);
    expect(esperaEstimada(centros[0], { ...solicitud, prioridad: 'vital' }, 11)).toBe(0);
  });

  it('la espera de cada centro varía con la prioridad, el síntoma y la franja horaria', () => {
    const [base] = generarCentros(1, 1);
    const centro = { ...base, carga: 0.6, consultorios: 4, picos: [9, 18] as const, servicios: ['Laboratorio', 'Procedimientos'] as const };
    const espera = (s: Partial<Solicitud>, hora = 11) => esperaEstimada(centro, { ...solicitud, ...s }, hora);
    expect(espera({ prioridad: 'alta' })).toBeLessThan(espera({ prioridad: 'media' }));
    expect(espera({ prioridad: 'media' })).toBeLessThan(espera({ prioridad: 'baja' }));
    expect(espera({ sintoma: 'Fiebre' })).toBeLessThan(espera({ sintoma: 'Golpe o trauma' }));
    expect(espera({}, 18)).toBeGreaterThan(espera({}, 3));
    expect(ocupacion(centro, 18)).toBeGreaterThan(ocupacion(centro, 14));
    expect(serviciosRequeridos({ sintoma: 'Golpe o trauma', edad: 8, embarazo: true })).toEqual(['Rayos X', 'Pediatría', 'Ginecobstetricia']);
    const otro = { ...centro, id: 'X', consultorios: 6, servicios: ['Rayos X'] as const };
    expect(esperaEstimada(otro, { ...solicitud, sintoma: 'Golpe o trauma' }, 11)).toBeLessThan(espera({ sintoma: 'Golpe o trauma' }));
  });

  it('los hitos del recorrido son crecientes y terminan en el total', () => {
    const [a] = compararAlternativas(ORIGEN_SIMULADO, generarCentros(), solicitud, 18);
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
