import { MinutosPipe } from './minutos.pipe';

describe('MinutosPipe', () => {
  const pipe = new MinutosPipe();

  it('redondea el total antes de separar horas y minutos', () => {
    expect(pipe.transform(119.9)).toBe('2 h 00 min');
    expect(pipe.transform(59.6)).toBe('1 h 00 min');
    expect(pipe.transform(91.4)).toBe('1 h 31 min');
    expect(pipe.transform(12.2)).toBe('12 min');
    expect(pipe.transform(null)).toBe('—');
  });
});
