import { toMinutesAndSeconds } from './timeUtils';

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
});
