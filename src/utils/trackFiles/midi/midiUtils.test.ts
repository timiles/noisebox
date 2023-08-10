import { MidiData } from 'midi-file';
import { DrumType } from 'types/DrumType';
import { Track, TrackType } from 'types/Track';
import { convertMidiDataToTracks } from './midiUtils';

/**
 * Fix startTimes and durations to handle floating point imprecision
 */
const fixNoteNumberValues = (tracks: ReadonlyArray<Track>, fractionDigits: number): void => {
  tracks.forEach((track) => {
    if (track.type === TrackType.Instrument) {
      track.notes.forEach((note) => {
        /* eslint-disable no-param-reassign */
        note.duration = Number(note.duration.toFixed(fractionDigits));
        note.startTime = Number(note.startTime.toFixed(fractionDigits));
        /* eslint-enable no-param-reassign */
      });
    }
  });
};

describe('midiUtils', () => {
  describe('convertMidiDataToTracks', () => {
    describe('midi format 0', () => {
      it('converts data as expected', () => {
        const midiData: MidiData = {
          header: {
            format: 0,
            numTracks: 1,
            ticksPerBeat: 1000,
          },
          tracks: [
            [
              { type: 'setTempo', deltaTime: 0, microsecondsPerBeat: 250000 },
              { type: 'trackName', deltaTime: 0, text: 'Test' },
              { type: 'noteOn', deltaTime: 0, channel: 0, noteNumber: 45, velocity: 50 },
              { type: 'noteOn', deltaTime: 0, channel: 0, noteNumber: 57, velocity: 50 },
              { type: 'noteOn', deltaTime: 0, channel: 1, noteNumber: 45, velocity: 50 },
              { type: 'noteOff', deltaTime: 2000, channel: 0, noteNumber: 45, velocity: 0 },
              { type: 'noteOff', deltaTime: 0, channel: 1, noteNumber: 45, velocity: 0 },
              { type: 'noteOff', deltaTime: 1000, channel: 0, noteNumber: 57, velocity: 0 },
              { type: 'noteOn', deltaTime: 0, channel: 1, noteNumber: 69, velocity: 50 },
              { type: 'noteOff', deltaTime: 4000, channel: 1, noteNumber: 69, velocity: 0 },
            ],
          ],
        };

        const expectedTracks: Array<Track> = [
          {
            type: TrackType.Instrument,
            id: '',
            instrument: 'Test channel 1',
            notes: [
              { startTime: 0, frequency: 110, duration: 0.5 },
              { startTime: 0, frequency: 220, duration: 0.75 },
            ],
          },
          {
            type: TrackType.Instrument,
            id: '',
            instrument: 'Test channel 2',
            notes: [
              { startTime: 0, frequency: 110, duration: 0.5 },
              { startTime: 0.75, frequency: 440, duration: 1 },
            ],
          },
        ];

        const actualTracks = convertMidiDataToTracks(midiData);
        actualTracks.forEach(({ id }, trackIndex) => {
          expectedTracks[trackIndex].id = id;
        });
        expect(actualTracks).toStrictEqual(expectedTracks);
      });

      it('handles tempo changes', () => {
        const midiData: MidiData = {
          header: {
            format: 0,
            numTracks: 1,
            ticksPerBeat: 1000,
          },
          // channel 0: test notes that change at same delta as tempo changes
          // channel 1: test a delay and a note that fall either side of tempo changes
          tracks: [
            [
              { type: 'trackName', deltaTime: 0, text: 'Test' },
              { type: 'setTempo', deltaTime: 0, microsecondsPerBeat: 100000 },
              { type: 'noteOn', deltaTime: 0, channel: 0, noteNumber: 45, velocity: 50 },
              { type: 'setTempo', deltaTime: 500, microsecondsPerBeat: 200000 },
              { type: 'noteOff', deltaTime: 0, channel: 0, noteNumber: 45, velocity: 0 },
              { type: 'noteOn', deltaTime: 0, channel: 0, noteNumber: 57, velocity: 50 },
              { type: 'noteOn', deltaTime: 500, channel: 1, noteNumber: 45, velocity: 50 },
              { type: 'setTempo', deltaTime: 500, microsecondsPerBeat: 300000 },
              { type: 'noteOff', deltaTime: 0, channel: 0, noteNumber: 57, velocity: 0 },
              { type: 'noteOn', deltaTime: 0, channel: 0, noteNumber: 45, velocity: 50 },
              { type: 'setTempo', deltaTime: 1500, microsecondsPerBeat: 400000 },
              { type: 'noteOff', deltaTime: 0, channel: 0, noteNumber: 45, velocity: 0 },
              { type: 'noteOn', deltaTime: 0, channel: 0, noteNumber: 57, velocity: 50 },
              { type: 'setTempo', deltaTime: 2000, microsecondsPerBeat: 500000 },
              { type: 'noteOff', deltaTime: 0, channel: 0, noteNumber: 57, velocity: 0 },
              { type: 'noteOn', deltaTime: 0, channel: 0, noteNumber: 45, velocity: 50 },
              { type: 'noteOff', deltaTime: 400, channel: 1, noteNumber: 45, velocity: 0 },
              { type: 'noteOff', deltaTime: 600, channel: 0, noteNumber: 45, velocity: 0 },
              { type: 'noteOn', deltaTime: 0, channel: 0, noteNumber: 57, velocity: 50 },
              { type: 'noteOff', deltaTime: 1000, channel: 0, noteNumber: 57, velocity: 0 },
            ],
          ],
        };

        const expectedTracks: Array<Track> = [
          {
            type: TrackType.Instrument,
            id: '',
            instrument: 'Test channel 1',
            notes: [
              { startTime: 0, frequency: 110, duration: 0.05 },
              { startTime: 0.05, frequency: 220, duration: 0.2 },
              { startTime: 0.25, frequency: 110, duration: 0.45 },
              { startTime: 0.7, frequency: 220, duration: 0.8 },
              { startTime: 1.5, frequency: 110, duration: 0.5 },
              { startTime: 2, frequency: 220, duration: 0.5 },
            ],
          },
          {
            type: TrackType.Instrument,
            id: '',
            instrument: 'Test channel 2',
            notes: [{ startTime: 0.15, frequency: 110, duration: 1.55 }],
          },
        ];

        const actualTracks = convertMidiDataToTracks(midiData);
        fixNoteNumberValues(actualTracks, 2);
        actualTracks.forEach(({ id }, trackIndex) => {
          expectedTracks[trackIndex].id = id;
        });
        expect(actualTracks).toStrictEqual(expectedTracks);
      });
    });

    describe('midi format 1', () => {
      it('converts data as expected', () => {
        const midiData: MidiData = {
          header: {
            format: 1,
            numTracks: 3,
            ticksPerBeat: 1000,
          },
          tracks: [
            // Track 0 is tempo info
            [{ type: 'setTempo', deltaTime: 0, microsecondsPerBeat: 250000 }],
            [
              { type: 'trackName', deltaTime: 0, text: 'Track 1' },
              { type: 'noteOn', deltaTime: 0, channel: 0, noteNumber: 45, velocity: 50 },
              { type: 'noteOn', deltaTime: 0, channel: 0, noteNumber: 57, velocity: 50 },
              { type: 'noteOff', deltaTime: 2000, channel: 0, noteNumber: 45, velocity: 0 },
              { type: 'noteOff', deltaTime: 1000, channel: 0, noteNumber: 57, velocity: 0 },
              { type: 'noteOn', deltaTime: 0, channel: 0, noteNumber: 69, velocity: 50 },
              { type: 'noteOff', deltaTime: 4000, channel: 0, noteNumber: 69, velocity: 0 },
            ],
            [
              { type: 'trackName', deltaTime: 0, text: 'Track 2' },
              { type: 'noteOn', deltaTime: 1000, channel: 1, noteNumber: 45, velocity: 50 },
              { type: 'noteOff', deltaTime: 2000, channel: 1, noteNumber: 45, velocity: 0 },
            ],
            [
              { type: 'trackName', deltaTime: 0, text: 'Track 3 (drums)' },
              { type: 'noteOn', deltaTime: 0, channel: 9, noteNumber: 35, velocity: 50 },
              { type: 'noteOff', deltaTime: 50, channel: 9, noteNumber: 35, velocity: 0 },
              { type: 'noteOn', deltaTime: 950, channel: 9, noteNumber: 36, velocity: 50 },
              { type: 'noteOff', deltaTime: 50, channel: 9, noteNumber: 36, velocity: 0 },
              { type: 'noteOn', deltaTime: 950, channel: 9, noteNumber: 38, velocity: 50 },
              { type: 'noteOff', deltaTime: 50, channel: 9, noteNumber: 38, velocity: 0 },
              { type: 'noteOn', deltaTime: 950, channel: 9, noteNumber: 45, velocity: 50 },
              { type: 'noteOff', deltaTime: 50, channel: 9, noteNumber: 45, velocity: 0 },
            ],
          ],
        };

        const expectedTracks: Array<Track> = [
          {
            type: TrackType.Instrument,
            id: '',
            instrument: 'Track 1',
            notes: [
              { startTime: 0, frequency: 110, duration: 0.5 },
              { startTime: 0, frequency: 220, duration: 0.75 },
              { startTime: 0.75, frequency: 440, duration: 1 },
            ],
          },
          {
            id: '',
            instrument: 'Track 2',
            type: TrackType.Instrument,
            notes: [{ startTime: 0.25, frequency: 110, duration: 0.5 }],
          },
          {
            id: '',
            instrument: 'Track 3 (drums)',
            type: TrackType.Drum,
            drumBeats: [
              { startTime: 0, drum: DrumType.Bass2 },
              { startTime: 0.25, drum: DrumType.Bass1 },
              { startTime: 0.5, drum: DrumType.Snare },
              { startTime: 0.75, drum: DrumType.FloorTom1 },
            ],
          },
        ];

        const actualTracks = convertMidiDataToTracks(midiData);
        actualTracks.forEach(({ id }, trackIndex) => {
          expectedTracks[trackIndex].id = id;
        });
        expect(actualTracks).toStrictEqual(expectedTracks);
      });

      it('handles undefined ticksPerBeat', () => {
        const midiData: MidiData = {
          header: {
            format: 1,
            numTracks: 1,
          },
          tracks: [[]],
        };

        expect(() => convertMidiDataToTracks(midiData)).toThrowError(
          'Header value `ticksPerBeat` is required.',
        );
      });

      it('ignores tracks with no notes', () => {
        const midiData: MidiData = {
          header: {
            format: 1,
            numTracks: 3,
            ticksPerBeat: 1000,
          },
          tracks: [
            [{ type: 'setTempo', deltaTime: 0, microsecondsPerBeat: 250000 }],
            [
              { type: 'trackName', deltaTime: 0, text: 'Track 1' },
              { type: 'noteOn', deltaTime: 0, channel: 0, noteNumber: 45, velocity: 50 },
              { type: 'noteOff', deltaTime: 2000, channel: 0, noteNumber: 45, velocity: 0 },
            ],
            [
              { type: 'trackName', deltaTime: 0, text: 'Track 2' },
              { type: 'text', deltaTime: 0, text: 'testing' },
            ],
          ],
        };

        const actualTracks = convertMidiDataToTracks(midiData);
        expect(actualTracks.length).toEqual(1);
        expect(actualTracks[0].instrument).toEqual('Track 1');
      });

      it('handles default tempo', () => {
        const midiData: MidiData = {
          header: {
            format: 1,
            numTracks: 2,
            ticksPerBeat: 1000,
          },
          tracks: [
            // Track 0 is tempo info - leave empty, should default to 500000
            [],
            [
              { type: 'trackName', deltaTime: 0, text: 'Track 1' },
              { type: 'noteOn', deltaTime: 0, channel: 0, noteNumber: 45, velocity: 50 },
              { type: 'noteOff', deltaTime: 2000, channel: 0, noteNumber: 45, velocity: 0 },
            ],
          ],
        };

        const expectedTracks: Array<Track> = [
          {
            type: TrackType.Instrument,
            id: '',
            instrument: 'Track 1',
            notes: [{ startTime: 0, frequency: 110, duration: 1 }],
          },
        ];

        const actualTracks = convertMidiDataToTracks(midiData);
        actualTracks.forEach(({ id }, trackIndex) => {
          expectedTracks[trackIndex].id = id;
        });
        expect(actualTracks).toStrictEqual(expectedTracks);
      });

      it('handles tempo changes', () => {
        const midiData: MidiData = {
          header: {
            format: 1,
            numTracks: 3,
            ticksPerBeat: 1000,
          },
          tracks: [
            [
              { type: 'setTempo', deltaTime: 0, microsecondsPerBeat: 100000 },
              { type: 'setTempo', deltaTime: 500, microsecondsPerBeat: 200000 },
              { type: 'setTempo', deltaTime: 1000, microsecondsPerBeat: 300000 },
              { type: 'setTempo', deltaTime: 1500, microsecondsPerBeat: 400000 },
              { type: 'setTempo', deltaTime: 2000, microsecondsPerBeat: 500000 },
            ],
            // Track 1: test notes that change at same delta as tempo changes
            [
              { type: 'trackName', deltaTime: 0, text: 'Track 1' },
              // note: 0.5 beat at 0.1 seconds per beat
              { type: 'noteOn', deltaTime: 0, channel: 0, noteNumber: 45, velocity: 50 },
              { type: 'noteOff', deltaTime: 500, channel: 0, noteNumber: 45, velocity: 0 },
              // note: 1 beat at 0.2 seconds per beat
              { type: 'noteOn', deltaTime: 0, channel: 0, noteNumber: 57, velocity: 50 },
              { type: 'noteOff', deltaTime: 1000, channel: 0, noteNumber: 57, velocity: 0 },
              // note: 1.5 beat at 0.3 seconds per beat
              { type: 'noteOn', deltaTime: 0, channel: 0, noteNumber: 45, velocity: 50 },
              { type: 'noteOff', deltaTime: 1500, channel: 0, noteNumber: 45, velocity: 0 },
              // note: 2 beat at 0.4 seconds per beat
              { type: 'noteOn', deltaTime: 0, channel: 0, noteNumber: 57, velocity: 50 },
              { type: 'noteOff', deltaTime: 2000, channel: 0, noteNumber: 57, velocity: 0 },
              // note: 1 beat at 0.5 seconds per beat
              { type: 'noteOn', deltaTime: 0, channel: 0, noteNumber: 45, velocity: 50 },
              { type: 'noteOff', deltaTime: 1000, channel: 0, noteNumber: 45, velocity: 0 },
              // note: 1 beat at 0.5 seconds per beat
              { type: 'noteOn', deltaTime: 0, channel: 0, noteNumber: 57, velocity: 50 },
              { type: 'noteOff', deltaTime: 1000, channel: 0, noteNumber: 57, velocity: 0 },
            ],
            // Track 2: test a delay and a note that fall either side of tempo changes
            [
              { type: 'trackName', deltaTime: 0, text: 'Track 2' },
              // delay 1 beat (1000 ticks) = 0.5 @ 0.1s/beat + 0.5 @ 0.2s/beat
              { type: 'noteOn', deltaTime: 1000, channel: 1, noteNumber: 45, velocity: 50 },
              // 4.4 beats = 0.5 @ 0.2s/beat + 1.5 @ 0.3s/beat + 2 @ 0.4s/beat + 0.4 @ 0.5s/beat
              { type: 'noteOff', deltaTime: 4400, channel: 1, noteNumber: 45, velocity: 0 },
            ],
          ],
        };

        const expectedTracks: Array<Track> = [
          {
            type: TrackType.Instrument,
            id: '',
            instrument: 'Track 1',
            notes: [
              { startTime: 0, frequency: 110, duration: 0.05 },
              { startTime: 0.05, frequency: 220, duration: 0.2 },
              { startTime: 0.25, frequency: 110, duration: 0.45 },
              { startTime: 0.7, frequency: 220, duration: 0.8 },
              { startTime: 1.5, frequency: 110, duration: 0.5 },
              { startTime: 2, frequency: 220, duration: 0.5 },
            ],
          },
          {
            type: TrackType.Instrument,
            id: '',
            instrument: 'Track 2',
            notes: [{ startTime: 0.15, frequency: 110, duration: 1.55 }],
          },
        ];

        const actualTracks = convertMidiDataToTracks(midiData);
        fixNoteNumberValues(actualTracks, 2);
        actualTracks.forEach(({ id }, trackIndex) => {
          expectedTracks[trackIndex].id = id;
        });
        expect(actualTracks).toStrictEqual(expectedTracks);
      });

      it('handles velocity 0 as noteOff', () => {
        const midiData: MidiData = {
          header: {
            format: 1,
            numTracks: 3,
            ticksPerBeat: 1000,
          },
          tracks: [
            [{ type: 'setTempo', deltaTime: 0, microsecondsPerBeat: 250000 }],
            [
              { type: 'trackName', deltaTime: 0, text: 'Track 1' },
              { type: 'noteOn', deltaTime: 0, channel: 0, noteNumber: 45, velocity: 50 },
              { type: 'noteOn', deltaTime: 0, channel: 0, noteNumber: 57, velocity: 50 },
              { type: 'noteOn', deltaTime: 2000, channel: 0, noteNumber: 45, velocity: 0 },
              { type: 'noteOn', deltaTime: 1000, channel: 0, noteNumber: 57, velocity: 0 },
              { type: 'noteOn', deltaTime: 0, channel: 0, noteNumber: 69, velocity: 50 },
              { type: 'noteOn', deltaTime: 4000, channel: 0, noteNumber: 69, velocity: 0 },
            ],
            [
              { type: 'trackName', deltaTime: 0, text: 'Track 2' },
              { type: 'noteOn', deltaTime: 1000, channel: 1, noteNumber: 45, velocity: 50 },
              { type: 'noteOn', deltaTime: 2000, channel: 1, noteNumber: 45, velocity: 0 },
            ],
          ],
        };

        const expectedTracks: Array<Track> = [
          {
            type: TrackType.Instrument,
            id: '',
            instrument: 'Track 1',
            notes: [
              { startTime: 0, frequency: 110, duration: 0.5 },
              { startTime: 0, frequency: 220, duration: 0.75 },
              { startTime: 0.75, frequency: 440, duration: 1 },
            ],
          },
          {
            type: TrackType.Instrument,
            id: '',
            instrument: 'Track 2',
            notes: [{ startTime: 0.25, frequency: 110, duration: 0.5 }],
          },
        ];

        const actualTracks = convertMidiDataToTracks(midiData);
        actualTracks.forEach(({ id }, trackIndex) => {
          expectedTracks[trackIndex].id = id;
        });
        expect(actualTracks).toStrictEqual(expectedTracks);
      });

      it('handles multiple channels in one track', () => {
        const midiData: MidiData = {
          header: {
            format: 1,
            numTracks: 3,
            ticksPerBeat: 1000,
          },
          tracks: [
            [{ type: 'setTempo', deltaTime: 0, microsecondsPerBeat: 250000 }],
            [
              { type: 'trackName', deltaTime: 0, text: 'Track 1' },
              { type: 'noteOn', deltaTime: 0, channel: 0, noteNumber: 45, velocity: 50 },
              { type: 'noteOn', deltaTime: 0, channel: 0, noteNumber: 57, velocity: 50 },
              { type: 'noteOn', deltaTime: 0, channel: 1, noteNumber: 45, velocity: 50 },
              { type: 'noteOff', deltaTime: 2000, channel: 0, noteNumber: 45, velocity: 0 },
              { type: 'noteOff', deltaTime: 0, channel: 1, noteNumber: 45, velocity: 0 },
              { type: 'noteOff', deltaTime: 1000, channel: 0, noteNumber: 57, velocity: 0 },
              { type: 'noteOn', deltaTime: 0, channel: 1, noteNumber: 69, velocity: 50 },
              { type: 'noteOff', deltaTime: 4000, channel: 1, noteNumber: 69, velocity: 0 },
            ],
          ],
        };

        const expectedTracks: Array<Track> = [
          {
            type: TrackType.Instrument,
            id: '',
            instrument: 'Track 1 channel 1',
            notes: [
              { startTime: 0, frequency: 110, duration: 0.5 },
              { startTime: 0, frequency: 220, duration: 0.75 },
            ],
          },
          {
            type: TrackType.Instrument,
            id: '',
            instrument: 'Track 1 channel 2',
            notes: [
              { startTime: 0, frequency: 110, duration: 0.5 },
              { startTime: 0.75, frequency: 440, duration: 1 },
            ],
          },
        ];

        const actualTracks = convertMidiDataToTracks(midiData);
        actualTracks.forEach(({ id }, trackIndex) => {
          expectedTracks[trackIndex].id = id;
        });
        expect(actualTracks).toStrictEqual(expectedTracks);
      });
    });
  });
});
