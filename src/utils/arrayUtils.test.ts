import { distinct, isArrayNotEmpty, isDefined } from './arrayUtils';

describe('arrayUtils', () => {
  describe('distinct', () => {
    it('returns distinct strings', () => {
      const input = ['one', 'two', 'two', 'two', 'TWO', 'three'];
      const filtered = input.filter(distinct);
      expect(filtered).toStrictEqual(['one', 'two', 'TWO', 'three']);
    });
  });

  describe('isArrayNotEmpty', () => {
    it('returns false if array is null', () => {
      expect(isArrayNotEmpty(null)).toBe(false);
    });

    it('returns false if array is undefined', () => {
      expect(isArrayNotEmpty(undefined)).toBe(false);
    });

    it('returns false if array is empty', () => {
      expect(isArrayNotEmpty([])).toBe(false);
    });

    it('returns true if array has items', () => {
      expect(isArrayNotEmpty([0])).toBe(true);
    });
  });

  describe('isDefined', () => {
    it('returns only defined number values', () => {
      const array = [3, null, -1, undefined, 0];
      const expected = [3, -1, 0];
      expect(array.filter(isDefined)).toStrictEqual(expected);
    });

    it('returns only defined string values', () => {
      const array = ['foo', null, 'bar', undefined, ''];
      const expected = ['foo', 'bar', ''];
      expect(array.filter(isDefined)).toStrictEqual(expected);
    });
  });
});
