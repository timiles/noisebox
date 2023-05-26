import { getClips } from './sampleUtils';

describe('sampleUtils', () => {
  describe('getClips', () => {
    const sampleRateOf1 = 1;

    it('handles solid sound', () => {
      const channelData = new Float32Array([1, 1, 1, 1, 1]);
      const options = { minimumSilenceDuration: 1, minimumClipDuration: 1 };

      const expectedClips = [{ start: 0, length: 5 }];

      expect(getClips([channelData], sampleRateOf1, options)).toStrictEqual(expectedClips);
    });

    it('handles basic data', () => {
      const channelData = new Float32Array([1, 1, 0, 1, 0, 1, 1, 1]);
      const options = { minimumSilenceDuration: 1, minimumClipDuration: 1 };

      const expectedClips = [
        { start: 0, length: 2 },
        { start: 3, length: 1 },
        { start: 5, length: 3 },
      ];

      expect(getClips([channelData], sampleRateOf1, options)).toStrictEqual(expectedClips);
    });

    it('handles low but non-zero silences', () => {
      const channelData = new Float32Array([1, 1, 0.0001, 1, -0.0001, 1, 1, 1]);
      const options = { minimumSilenceDuration: 1, minimumClipDuration: 1 };

      const expectedClips = [
        { start: 0, length: 2 },
        { start: 3, length: 1 },
        { start: 5, length: 3 },
      ];

      expect(getClips([channelData], sampleRateOf1, options)).toStrictEqual(expectedClips);
    });

    it('handles minimum silence length', () => {
      const channelData = new Float32Array([1, 1, 0, 1, 0, 0, 0, 1, 0, 0, 1, 1]);
      const options = { minimumSilenceDuration: 3, minimumClipDuration: 1 };

      const expectedClips = [
        { start: 0, length: 4 },
        { start: 7, length: 5 },
      ];

      expect(getClips([channelData], sampleRateOf1, options)).toStrictEqual(expectedClips);
    });

    it('handles less than minimum silence at start and end', () => {
      const channelData = new Float32Array([0, 0, 1, 1, 1, 1, 0]);
      const options = { minimumSilenceDuration: 3, minimumClipDuration: 1 };

      const expectedClips = [{ start: 2, length: 4 }];

      expect(getClips([channelData], sampleRateOf1, options)).toStrictEqual(expectedClips);
    });

    it('handles more than minimum silence at start and end', () => {
      const channelData = new Float32Array([0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0]);
      const options = { minimumSilenceDuration: 3, minimumClipDuration: 1 };

      const expectedClips = [{ start: 5, length: 4 }];

      expect(getClips([channelData], sampleRateOf1, options)).toStrictEqual(expectedClips);
    });

    it('handles minimum clip length', () => {
      const channelData = new Float32Array([1, 0, 1, 1, 1, 0, 1]);
      const options = { minimumSilenceDuration: 1, minimumClipDuration: 3 };

      const expectedClips = [{ start: 2, length: 3 }];

      expect(getClips([channelData], sampleRateOf1, options)).toStrictEqual(expectedClips);
    });

    it('handles minimum clip length at end', () => {
      const channelData = new Float32Array([1, 0, 1, 1, 0, 1, 1, 1]);
      const options = { minimumSilenceDuration: 1, minimumClipDuration: 3 };

      const expectedClips = [{ start: 5, length: 3 }];

      expect(getClips([channelData], sampleRateOf1, options)).toStrictEqual(expectedClips);
    });

    it('handles maximum clip length', () => {
      const channelData = new Float32Array([1, 1, 1, 0, 1, 1, 1, 1, 0, 1]);
      const options = { minimumSilenceDuration: 1, minimumClipDuration: 1, maximumClipDuration: 3 };

      const expectedClips = [
        { start: 0, length: 3 },
        { start: 9, length: 1 },
      ];

      expect(getClips([channelData], sampleRateOf1, options)).toStrictEqual(expectedClips);
    });

    it('handles maximum clip length at end', () => {
      const channelData = new Float32Array([1, 1, 1, 0, 1, 0, 1, 1, 1, 1]);
      const options = { minimumSilenceDuration: 1, minimumClipDuration: 1, maximumClipDuration: 3 };

      const expectedClips = [
        { start: 0, length: 3 },
        { start: 4, length: 1 },
      ];

      expect(getClips([channelData], sampleRateOf1, options)).toStrictEqual(expectedClips);
    });

    it('handles multi-channel data', () => {
      const channelDataArrays = [
        new Float32Array([1, 1, 0, 0, 0, 1, 1, 0, 1]),
        new Float32Array([0, 1, 0, 1, 1, 1, 0, 0, 0, 1, 0, 1]),
      ];
      const options = { minimumSilenceDuration: 1, minimumClipDuration: 1 };

      const expectedClips = [
        { start: 0, length: 2 },
        { start: 3, length: 4 },
        { start: 8, length: 2 },
        { start: 11, length: 1 },
      ];

      expect(getClips(channelDataArrays, sampleRateOf1, options)).toStrictEqual(expectedClips);
    });

    it('handles sample rate', () => {
      const channelData = new Float32Array([1, 1, 0, 1, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 1, 1]);
      const sampleRate = 2;
      const options = { minimumSilenceDuration: 1, minimumClipDuration: 1, maximumClipDuration: 2 };

      const expectedClips = [
        { start: 0, length: 4 },
        { start: 14, length: 2 },
      ];

      expect(getClips([channelData], sampleRate, options)).toStrictEqual(expectedClips);
    });
  });
});
