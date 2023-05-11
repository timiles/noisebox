import {
  getFrequencyFromMidiNote,
  getMidiNoteFromFrequency,
  getPitchFromMidiNote,
} from './frequencyUtils';

describe('frequencyUtils', () => {
  describe('getFrequencyFromMidiNote', () => {
    it('returns expected notes', () => {
      expect(getFrequencyFromMidiNote(21)).toBe(27.5);
      expect(getFrequencyFromMidiNote(69)).toBe(440);
      expect(getFrequencyFromMidiNote(108)).toBe(4186.009044809578);
    });
  });

  describe('getMidiNoteFromFrequency', () => {
    it('returns expected frequencies', () => {
      // Test close enough either side of 27.5
      expect(getMidiNoteFromFrequency(27)).toBe(21);
      expect(getMidiNoteFromFrequency(27.5)).toBe(21);
      expect(getMidiNoteFromFrequency(28)).toBe(21);
      // Then 29Hz should be closer to note 22
      expect(getMidiNoteFromFrequency(29)).toBe(22);

      expect(getMidiNoteFromFrequency(440)).toBe(69);
      expect(getMidiNoteFromFrequency(4186)).toBe(108);
    });
  });

  describe('getPitchFromMidiNote', () => {
    it('returns expected notations', () => {
      expect(getPitchFromMidiNote(11)).toBeNull();
      expect(getPitchFromMidiNote(12)).toBe('C0');
      expect(getPitchFromMidiNote(21)).toBe('A0');
      expect(getPitchFromMidiNote(22)).toBe('B♭0');
      expect(getPitchFromMidiNote(23)).toBe('B0');
      expect(getPitchFromMidiNote(24)).toBe('C1');
      expect(getPitchFromMidiNote(68)).toBe('G♯4');
      expect(getPitchFromMidiNote(69)).toBe('A4');
      expect(getPitchFromMidiNote(70)).toBe('B♭4');
      expect(getPitchFromMidiNote(107)).toBe('B7');
      expect(getPitchFromMidiNote(108)).toBe('C8');
    });
  });
});
