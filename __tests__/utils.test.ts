import { plus100ms } from '../src/utils';

describe('plus100ms', () => {
  it('should return the input value plus 100', () => {
    expect(plus100ms('50')).toBe(150);
    expect(plus100ms('100')).toBe(200);
    expect(plus100ms('0')).toBe(100);
  });

  it('should return NaN if the input is not a valid number', () => {
    expect(plus100ms('abc')).toBeNaN();
    expect(plus100ms('')).toBeNaN();
  });
});
