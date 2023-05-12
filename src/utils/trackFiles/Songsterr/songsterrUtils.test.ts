import { Note } from 'types/Note';
import { SongsterrData } from './SongsterrData';
import { convertSongsterrDataToNotes, isValidSongsterrData } from './songsterrUtils';

describe('songsterrUtils', () => {
  describe('isValidSongsterrData', () => {
    const validSongsterrData: Partial<SongsterrData> = {
      name: 'Test name',
      voices: 1,
      measures: [],
    };

    it('detects valid Songsterr data', () => {
      expect(isValidSongsterrData(validSongsterrData)).toBe(true);
    });

    it('requires name', () => {
      const testSongsterrData = { ...validSongsterrData };
      delete testSongsterrData.name;
      expect(isValidSongsterrData(testSongsterrData)).toBe(false);
    });

    it('requires voices', () => {
      const testSongsterrData = { ...validSongsterrData };
      delete testSongsterrData.voices;
      expect(isValidSongsterrData(testSongsterrData)).toBe(false);
    });

    it('requires measures', () => {
      const testSongsterrData = { ...validSongsterrData };
      delete testSongsterrData.measures;
      expect(isValidSongsterrData(testSongsterrData)).toBe(false);
    });
  });

  describe('convertSongsterrDataToNotes', () => {
    it('converts measures as expected', () => {
      const songsterrData: SongsterrData = {
        strings: 6,
        frets: 24,
        tuning: [64, 59, 55, 50, 45, 40],
        name: 'Test data',
        instrument: 'Test',
        instrumentId: 123,
        volume: 1,
        balance: 0,
        measures: [
          {
            index: 1,
            signature: [4, 4],
            voices: [
              {
                beats: [
                  {
                    type: 4,
                    rest: true,
                    notes: [{ rest: true }],
                    tempo: { type: 4, bpm: 120 },
                    duration: [1, 4],
                  },
                  { type: 4, notes: [{ string: 4, fret: 0 }], duration: [1, 4] },
                  { type: 2, notes: [{ string: 3, fret: 7 }], duration: [1, 2] },
                ],
              },
            ],
          },
          {
            index: 2,
            voices: [
              {
                beats: [
                  { type: 8, notes: [{ string: 3, fret: 0, tie: true }], duration: [1, 8] },
                  { type: 8, notes: [{ string: 0, fret: 5 }], duration: [1, 8] },
                  { type: 2, dotted: true, notes: [{ string: 2, fret: 2 }], duration: [3, 4] },
                ],
              },
            ],
          },
        ],
        capo: 0,
        voices: 1,
        automations: {
          tempo: [{ measure: 1, linear: false, visible: false, position: 0, type: 4, bpm: 120 }],
        },
        version: 5,
        songId: 123,
        partId: 1,
        revisionId: 123,
      };

      const expectedNotes: Array<Note> = [
        {
          startTime: 0.5,
          frequency: 110,
          duration: 0.5,
          waves: 55,
        },
        {
          startTime: 1.0,
          frequency: 220,
          duration: 1.25,
          waves: 275,
        },
        {
          startTime: 2.25,
          frequency: 440,
          duration: 0.25,
          waves: 110,
        },
        {
          startTime: 2.5,
          frequency: 220,
          duration: 1.5,
          waves: 330,
        },
      ];

      expect(convertSongsterrDataToNotes(songsterrData)).toStrictEqual(expectedNotes);
    });

    it('handles signature and tempo changes', () => {
      const songsterrData: SongsterrData = {
        strings: 6,
        frets: 24,
        tuning: [64, 59, 55, 50, 45, 40],
        name: 'Test data 2',
        instrument: 'Test',
        instrumentId: 123,
        volume: 1,
        balance: 0,
        measures: [
          {
            index: 1,
            signature: [6, 8],
            voices: [
              {
                beats: [
                  {
                    type: 1,
                    notes: [{ string: 4, fret: 0 }],
                    tempo: { type: 4, bpm: 120 },
                    duration: [6, 8],
                  },
                ],
              },
            ],
          },
          {
            index: 2,
            voices: [
              {
                beats: [
                  {
                    type: 1,
                    notes: [{ string: 4, fret: 0 }],
                    tempo: { type: 4, bpm: 60 },
                    duration: [6, 8],
                  },
                ],
              },
            ],
          },
          {
            index: 3,
            signature: [4, 4],
            voices: [
              {
                beats: [
                  {
                    type: 1,
                    notes: [{ string: 4, fret: 0 }],
                    duration: [1, 1],
                  },
                ],
              },
            ],
          },
        ],
        capo: 0,
        voices: 1,
        automations: {
          tempo: [
            { measure: 1, linear: false, visible: false, position: 0, type: 4, bpm: 120 },
            { measure: 2, linear: false, visible: false, position: 0, type: 4, bpm: 60 },
          ],
        },
        version: 5,
        songId: 123,
        partId: 1,
        revisionId: 123,
      };

      const expectedNotes: Array<Note> = [
        {
          startTime: 0,
          frequency: 110,
          duration: 1.5,
          waves: 165,
        },
        {
          startTime: 1.5,
          frequency: 110,
          duration: 3,
          waves: 330,
        },
        {
          startTime: 4.5,
          frequency: 110,
          duration: 4,
          waves: 440,
        },
      ];

      expect(convertSongsterrDataToNotes(songsterrData)).toStrictEqual(expectedNotes);
    });
  });
});
