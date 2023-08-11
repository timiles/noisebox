import { DrumBeat } from 'types/DrumBeat';
import { DrumType } from 'types/DrumType';
import { Note } from 'types/Note';
import { SongsterrData } from './SongsterrData';
import {
  convertSongsterrDataToDrumBeats,
  convertSongsterrDataToNotes,
  isValidSongsterrData,
} from './songsterrUtils';

describe('songsterrUtils', () => {
  describe('isValidSongsterrData', () => {
    const validSongsterrData: Partial<SongsterrData> = {
      voices: 1,
      measures: [],
    };

    it('detects valid Songsterr data', () => {
      expect(isValidSongsterrData(validSongsterrData)).toBe(true);
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

  describe('convertSongsterrDataToDrumBeats', () => {
    it('converts measures as expected', () => {
      const songsterrData: SongsterrData = {
        strings: 6,
        frets: 87,
        instrument: 'Drums',
        instrumentId: 1024,
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
                  { type: 16, notes: [{ string: 0, fret: 36 }], duration: [1, 16] },
                  { type: 16, rest: true, notes: [{ rest: true }], duration: [3, 16] },
                  { type: 16, notes: [{ string: 5, fret: 35 }], duration: [1, 16] },
                  { type: 16, rest: true, notes: [{ rest: true }], duration: [3, 16] },
                  { type: 16, notes: [{ string: 0, fret: 38 }], duration: [1, 16] },
                  { type: 16, rest: true, notes: [{ rest: true }], duration: [3, 16] },
                ],
              },
            ],
          },
          {
            index: 2,
            voices: [
              {
                beats: [
                  { type: 16, notes: [{ string: 0, fret: 41 }], duration: [1, 16] },
                  { type: 16, rest: true, notes: [{ rest: true }], duration: [3, 16] },
                  { type: 16, notes: [{ string: 0, fret: 43 }], duration: [1, 16] },
                  { type: 16, rest: true, notes: [{ rest: true }], duration: [3, 16] },
                  { type: 16, notes: [{ string: 5, fret: 49 }], duration: [1, 16] },
                  { type: 16, rest: true, notes: [{ rest: true }], duration: [3, 16] },
                  { type: 16, notes: [{ string: 0, fret: 46 }], duration: [1, 16] },
                  { type: 16, rest: true, notes: [{ rest: true }], duration: [3, 16] },
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

      const expectedDrumBeats: Array<DrumBeat> = [
        { startTime: 0.5, drum: DrumType.Bass1 },
        { startTime: 1, drum: DrumType.Bass2 },
        { startTime: 1.5, drum: DrumType.Snare },
        { startTime: 2, drum: DrumType.FloorTom1 },
        { startTime: 2.5, drum: DrumType.FloorTom2 },
        { startTime: 3, drum: DrumType.Crash },
        { startTime: 3.5, drum: DrumType.OpenHiHat },
      ];

      expect(convertSongsterrDataToDrumBeats(songsterrData)).toStrictEqual(expectedDrumBeats);
    });
  });

  describe('convertSongsterrDataToNotes', () => {
    it('converts measures as expected', () => {
      const songsterrData: SongsterrData = {
        strings: 6,
        frets: 24,
        tuning: [64, 59, 55, 50, 45, 40],
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
        },
        {
          startTime: 1.0,
          frequency: 220,
          duration: 1.25,
        },
        {
          startTime: 2.25,
          frequency: 440,
          duration: 0.25,
        },
        {
          startTime: 2.5,
          frequency: 220,
          duration: 1.5,
        },
      ];

      expect(convertSongsterrDataToNotes(songsterrData)).toStrictEqual(expectedNotes);
    });

    it('handles repeats', () => {
      const songsterrData: SongsterrData = {
        strings: 6,
        frets: 24,
        tuning: [64, 59, 55, 50, 45, 40],
        instrument: 'Test',
        instrumentId: 123,
        volume: 1,
        balance: 0,
        measures: [
          // Measure 1 normal
          {
            index: 1,
            signature: [1, 4],
            voices: [
              {
                beats: [
                  {
                    type: 4,
                    notes: [{ string: 0, fret: 1 }],
                    tempo: { type: 4, bpm: 60 },
                    duration: [1, 4],
                  },
                ],
              },
            ],
          },
          // Measure 2 repeats x3
          {
            index: 2,
            voices: [
              {
                beats: [
                  {
                    type: 4,
                    notes: [{ string: 0, fret: 2 }],
                    duration: [1, 4],
                  },
                ],
              },
            ],
            repeatStart: true,
            repeat: 3,
          },
          // Measures 3-5 repeat x2
          {
            index: 3,
            voices: [
              {
                beats: [
                  {
                    type: 4,
                    notes: [{ string: 0, fret: 3 }],
                    duration: [1, 4],
                  },
                ],
              },
            ],
            repeatStart: true,
          },
          {
            index: 4,
            voices: [
              {
                beats: [
                  {
                    type: 4,
                    notes: [{ string: 0, fret: 4 }],
                    duration: [1, 4],
                  },
                ],
              },
            ],
          },
          {
            index: 5,
            voices: [
              {
                beats: [
                  {
                    type: 4,
                    notes: [{ string: 0, fret: 5 }],
                    duration: [1, 4],
                  },
                ],
              },
            ],
            repeat: 2,
          },
          // Measure 6 rest, repeat x2
          {
            index: 6,
            voices: [
              {
                beats: [
                  {
                    type: 4,
                    rest: true,
                    notes: [{ rest: true }],
                    duration: [1, 4],
                  },
                ],
              },
            ],
            repeatStart: true,
            repeat: 2,
          },
          // Measure 7 normal
          {
            index: 7,
            voices: [
              {
                beats: [
                  {
                    type: 4,
                    notes: [{ string: 0, fret: 7 }],
                    duration: [1, 4],
                  },
                ],
              },
            ],
          },
        ],
        capo: 0,
        voices: 1,
        automations: {
          tempo: [{ measure: 1, linear: false, visible: false, position: 0, type: 4, bpm: 60 }],
        },
        version: 5,
        songId: 123,
        partId: 1,
        revisionId: 123,
      };

      const expectedNotes: Array<Note> = [
        // Measure 1
        {
          startTime: 0,
          duration: 1,
          frequency: 349.2282314330039,
        },
        // Measure 2 1st time
        {
          startTime: 1,
          duration: 1,
          frequency: 369.99442271163446,
        },
        // Measure 2 2nd time
        {
          startTime: 2,
          duration: 1,
          frequency: 369.99442271163446,
        },
        // Measure 2 3rd time
        {
          startTime: 3,
          duration: 1,
          frequency: 369.99442271163446,
        },
        // Measure 3 1st time
        {
          startTime: 4,
          duration: 1,
          frequency: 391.99543598174927,
        },
        // Measure 4 1st time
        {
          startTime: 5,
          duration: 1,
          frequency: 415.3046975799451,
        },
        // Measure 5 1st time
        {
          startTime: 6,
          duration: 1,
          frequency: 440,
        },
        // Measure 3 2nd time
        {
          startTime: 7,
          duration: 1,
          frequency: 391.99543598174927,
        },
        // Measure 4 2nd time
        {
          startTime: 8,
          duration: 1,
          frequency: 415.3046975799451,
        },
        // Measure 5 2nd time
        {
          startTime: 9,
          duration: 1,
          frequency: 440,
        },
        // Measure 7 after 2 measures rest
        {
          startTime: 12,
          duration: 1,
          frequency: 493.8833012561241,
        },
      ];

      expect(convertSongsterrDataToNotes(songsterrData)).toStrictEqual(expectedNotes);
    });

    it('handles repeat alternateEndings', () => {
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
          // Measure 1 normal
          {
            index: 1,
            signature: [1, 4],
            voices: [
              {
                beats: [
                  {
                    type: 4,
                    notes: [{ string: 0, fret: 1 }],
                    tempo: { type: 4, bpm: 60 },
                    duration: [1, 4],
                  },
                ],
              },
            ],
          },
          // Measure 2: start of repeat
          {
            index: 2,
            voices: [
              {
                beats: [
                  {
                    type: 4,
                    notes: [{ string: 0, fret: 2 }],
                    duration: [1, 4],
                  },
                ],
              },
            ],
            repeatStart: true,
          },
          // Measure 3: 1st and 2nd ending
          {
            index: 3,
            voices: [
              {
                beats: [
                  {
                    type: 4,
                    notes: [{ string: 0, fret: 3 }],
                    duration: [1, 4],
                  },
                ],
              },
            ],
            alternateEnding: [1, 2],
          },
          // Measure 4: 3rd and 4th ending
          {
            index: 4,
            voices: [
              {
                beats: [
                  {
                    type: 4,
                    notes: [{ string: 0, fret: 4 }],
                    duration: [1, 4],
                  },
                ],
              },
            ],
            alternateEnding: [3, 4],
          },
          // Measure 5: 5th ending
          {
            index: 5,
            voices: [
              {
                beats: [
                  {
                    type: 4,
                    notes: [{ string: 0, fret: 5 }],
                    duration: [1, 4],
                  },
                ],
              },
            ],
            repeat: 5,
            alternateEnding: [5],
          },
          // Measure 6: normal
          {
            index: 6,
            voices: [
              {
                beats: [
                  {
                    type: 4,
                    notes: [{ string: 0, fret: 6 }],
                    duration: [1, 4],
                  },
                ],
              },
            ],
          },
        ],
        capo: 0,
        voices: 1,
        automations: {
          tempo: [{ measure: 1, linear: false, visible: false, position: 0, type: 4, bpm: 60 }],
        },
        version: 5,
        songId: 123,
        partId: 1,
        revisionId: 123,
      };

      const expectedNotes: Array<Note> = [
        // Measure 1
        {
          startTime: 0,
          duration: 1,
          frequency: 349.2282314330039,
        },
        // Measure 2 1st time
        {
          startTime: 1,
          duration: 1,
          frequency: 369.99442271163446,
        },
        // Measure 3 1st time
        {
          startTime: 2,
          duration: 1,
          frequency: 391.99543598174927,
        },
        // Measure 2 2nd time
        {
          startTime: 3,
          duration: 1,
          frequency: 369.99442271163446,
        },
        // Measure 3 2nd time
        {
          startTime: 4,
          duration: 1,
          frequency: 391.99543598174927,
        },
        // Measure 2 3rd time
        {
          startTime: 5,
          duration: 1,
          frequency: 369.99442271163446,
        },
        // Measure 4 1st time
        {
          startTime: 6,
          duration: 1,
          frequency: 415.3046975799451,
        },
        // Measure 2 4th time
        {
          startTime: 7,
          duration: 1,
          frequency: 369.99442271163446,
        },
        // Measure 4 2nd time
        {
          startTime: 8,
          duration: 1,
          frequency: 415.3046975799451,
        },
        // Measure 2 5th time
        {
          startTime: 9,
          duration: 1,
          frequency: 369.99442271163446,
        },
        // Measure 5
        {
          startTime: 10,
          duration: 1,
          frequency: 440,
        },
        // Measure 6
        {
          startTime: 11,
          duration: 1,
          frequency: 466.1637615180899,
        },
      ];

      expect(convertSongsterrDataToNotes(songsterrData)).toStrictEqual(expectedNotes);
    });

    it('handles signature and tempo changes', () => {
      const songsterrData: SongsterrData = {
        strings: 6,
        frets: 24,
        tuning: [64, 59, 55, 50, 45, 40],
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
        },
        {
          startTime: 1.5,
          frequency: 110,
          duration: 3,
        },
        {
          startTime: 4.5,
          frequency: 110,
          duration: 4,
        },
      ];

      expect(convertSongsterrDataToNotes(songsterrData)).toStrictEqual(expectedNotes);
    });
  });
});
