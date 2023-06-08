import { distinct, getMaxItemNumber, isArrayNotEmpty, isNotNullish } from './arrayUtils';

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

  describe('isNotNullish', () => {
    it('returns only non-nullish number values', () => {
      const array = [3, null, -1, undefined, 0];
      const expected = [3, -1, 0];
      expect(array.filter(isNotNullish)).toStrictEqual(expected);
    });

    it('returns only non-nullish string values', () => {
      const array = ['foo', null, 'bar', undefined, ''];
      const expected = ['foo', 'bar', ''];
      expect(array.filter(isNotNullish)).toStrictEqual(expected);
    });
  });

  describe('getMaxItemNumber', () => {
    it('returns max number as expected', () => {
      const array = ['test1', 'test20', 'test3'];
      expect(getMaxItemNumber('test', array)).toBe(20);
    });

    it('ignores non-numeric suffixes', () => {
      const array = ['test1', 'test20x', 'test3'];
      expect(getMaxItemNumber('test', array)).toBe(3);
    });

    it('ignores non-matching item names', () => {
      const array = ['test1', 'xtest 20', 'test3'];
      expect(getMaxItemNumber('test', array)).toBe(3);
    });

    it('returns null if no matching item names', () => {
      const array = ['test1', 'test20', 'test3'];
      expect(getMaxItemNumber('xtest', array)).toBeNull();
    });

    it('returns null if no numeric suffixes', () => {
      const array = ['test1x', 'test20x', 'test3x'];
      expect(getMaxItemNumber('test', array)).toBeNull();
    });
  });
});
