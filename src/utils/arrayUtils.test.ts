import { distinct, isArrayNotEmpty } from './arrayUtils';

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
});
