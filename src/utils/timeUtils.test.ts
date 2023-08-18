import { toFilenameFriendlyString, toMinutesAndSeconds } from './timeUtils';

describe('timeUtils', () => {
  describe('toMinutesAndSeconds', () => {
    it('returns expected values', () => {
      expect(toMinutesAndSeconds(0)).toBe('0:00');
      expect(toMinutesAndSeconds(1.5)).toBe('0:01');
      expect(toMinutesAndSeconds(9)).toBe('0:09');
      expect(toMinutesAndSeconds(10)).toBe('0:10');
      expect(toMinutesAndSeconds(60)).toBe('1:00');
      expect(toMinutesAndSeconds(90)).toBe('1:30');
      expect(toMinutesAndSeconds(600)).toBe('10:00');
      expect(toMinutesAndSeconds(3600)).toBe('60:00');
      expect(toMinutesAndSeconds(36012)).toBe('600:12');
    });
  });

  describe('toFilenameFriendlyString', () => {
    it('handles single digit values', () => {
      const date = new Date(2023, 7, 6, 5, 4, 3);
      expect(toFilenameFriendlyString(date)).toBe('2023-08-06 05.04.03');
    });

    it('handles double digit values', () => {
      const date = new Date(2023, 11, 12, 13, 14, 15);
      expect(toFilenameFriendlyString(date)).toBe('2023-12-12 13.14.15');
    });
  });
});
