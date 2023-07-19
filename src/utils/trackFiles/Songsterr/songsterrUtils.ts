import { ILogger } from 'LoggerProvider';
import { DrumBeat } from 'types/DrumBeat';
import { DrumType } from 'types/DrumType';
import { Note } from 'types/Note';
import { TrackType } from 'types/Track';
import { isArrayNotEmpty, isNotNullish, range } from 'utils/arrayUtils';
import { getFrequencyFromMidiNote } from 'utils/frequencyUtils';
import { SongsterrData } from './SongsterrData';

export function isValidSongsterrData(json: Object): boolean {
  const songsterrData = json as SongsterrData;
  return typeof songsterrData.voices === 'number' && Array.isArray(songsterrData.measures);
}

export function getTrackType(songsterrData: SongsterrData): TrackType {
  return songsterrData.instrumentId === 1024 ? TrackType.Drum : TrackType.Instrument;
}

type Bar = {
  timeSignature?: [number, number];
  beats: ReadonlyArray<{
    notes: ReadonlyArray<{ string: number; fret: number; isTiedOver: boolean }>;
    duration: [number, number];
    tempo?: { type: number; bpm: number };
  }>;
};

// TODO: Consider a better name for this
type AbsoluteNote = {
  string: number;
  fret: number;
  startTime: number;
  duration: number;
};

function convertSongsterrDataToBars(
  songsterrData: SongsterrData,
  voiceIndex: number,
): ReadonlyArray<Bar> {
  const bars = new Array<Bar>();

  let barIndexAtStartOfRepeat: number | undefined;
  let barIndexAtEndOfRepeat: number | undefined;

  songsterrData.measures.forEach((measure) => {
    const bar: Bar = {
      beats: measure.voices[voiceIndex].beats.map((beat) => ({
        duration: beat.duration,
        tempo: beat.tempo,
        notes: beat.notes
          .filter((songsterrNote) => !songsterrNote.rest)
          .map(({ string, fret, tie }) => {
            if (string == null) {
              throw new Error('string not set');
            }
            if (fret == null) {
              throw new Error('fret not set');
            }

            return { string, fret, isTiedOver: Boolean(tie) };
          }),
      })),
    };

    if (measure.signature) {
      bar.timeSignature = measure.signature;
    }

    if (measure.repeatStart) {
      // Mark the start of repeated section
      barIndexAtStartOfRepeat = bars.length;
    }

    if (
      ((measure.repeat && measure.repeat > 1) || isArrayNotEmpty(measure.alternateEnding)) &&
      barIndexAtStartOfRepeat !== undefined
    ) {
      if (isArrayNotEmpty(measure.alternateEnding)) {
        if (barIndexAtEndOfRepeat === undefined) {
          // Mark the end of repeated section
          barIndexAtEndOfRepeat = bars.length;
        }

        const barsToRepeat = bars.slice(barIndexAtStartOfRepeat, barIndexAtEndOfRepeat);
        measure.alternateEnding.forEach((ending) => {
          bars.push(bar);
          if (ending !== measure.repeat) {
            // If we have more endings to handle, push the repeat section again
            bars.push(...barsToRepeat);
          }
        });

        if (measure.repeat) {
          // Repeats are finished, reset the markers
          barIndexAtStartOfRepeat = undefined;
          barIndexAtEndOfRepeat = undefined;
        }
      } else if (measure.repeat) {
        bars.push(bar);

        const barsToRepeat = bars.slice(barIndexAtStartOfRepeat);
        for (let repeatNumber = 1; repeatNumber < measure.repeat; repeatNumber += 1) {
          bars.push(...barsToRepeat);
        }

        barIndexAtStartOfRepeat = undefined;
      }
    } else {
      bars.push(bar);
    }
  });

  return bars;
}

function flattenBarsToNotes(bars: ReadonlyArray<Bar>): ReadonlyArray<AbsoluteNote> {
  const notes = new Array<AbsoluteNote>();

  let currentWholeBeatsPerMeasure = 0;
  let currentWholeBeatDuration = 0;
  let currentMeasureDuration = 0;

  let timeAtStartOfMeasure = 0;

  bars.forEach((bar) => {
    let timeAtStartOfBeat = 0;

    if (bar.timeSignature) {
      const [beatsPerMeasure, beatType] = bar.timeSignature;
      currentWholeBeatsPerMeasure = beatsPerMeasure / beatType;
      currentMeasureDuration = currentWholeBeatsPerMeasure * currentWholeBeatDuration;
    }

    bar.beats.forEach((beat) => {
      if (beat.tempo) {
        currentWholeBeatDuration = (60 * beat.tempo.type) / beat.tempo.bpm;
        currentMeasureDuration = currentWholeBeatsPerMeasure * currentWholeBeatDuration;
      }

      if (!Number.isFinite(currentWholeBeatsPerMeasure) || currentWholeBeatsPerMeasure <= 0) {
        throw new Error('Signature is not set.');
      }
      if (!Number.isFinite(currentWholeBeatDuration) || currentWholeBeatDuration <= 0) {
        throw new Error('Tempo is not set.');
      }

      const [beatDuration, beatType] = beat.duration;
      const duration = (currentWholeBeatDuration * beatDuration) / beatType;

      beat.notes.forEach(({ string, fret, isTiedOver: isTie }) => {
        if (isTie) {
          const previousNote = notes[notes.length - 1];
          previousNote.duration += duration;
        } else {
          const startTime = timeAtStartOfMeasure + timeAtStartOfBeat;
          notes.push({ string, fret, startTime, duration });
        }
      });

      timeAtStartOfBeat += duration;
    });

    timeAtStartOfMeasure += currentMeasureDuration;
  });

  return notes;
}

const fretsToDrumsMap = new Map<number, DrumType>([
  [33, DrumType.Snare],
  [35, DrumType.Bass2],
  [36, DrumType.Bass1],
  [38, DrumType.Snare],
  [40, DrumType.Snare],
  [41, DrumType.FloorTom1],
  [42, DrumType.ClosedHiHat],
  [43, DrumType.FloorTom2],
  [44, DrumType.FootHiHat],
  [45, DrumType.FloorTom1],
  [46, DrumType.OpenHiHat],
  [47, DrumType.Tom3],
  [48, DrumType.Tom2],
  [49, DrumType.Crash],
  [50, DrumType.Tom1],
  [55, DrumType.Crash],
  [57, DrumType.Crash],
  [92, DrumType.LooseHiHat],
]);

export function convertSongsterrDataToDrumBeats(
  songsterrData: SongsterrData,
  logger: ILogger,
): Array<DrumBeat> {
  const unknownDrumFrets = new Map<number, number>();

  const drumBeats = range(songsterrData.voices)
    .map((voiceIndex) => convertSongsterrDataToBars(songsterrData, voiceIndex))
    .flatMap(flattenBarsToNotes)
    .sort((a, b) => a.startTime - b.startTime)
    .map(({ fret, startTime }) => {
      const drum = fretsToDrumsMap.get(fret);
      if (drum === undefined) {
        unknownDrumFrets.set(fret, (unknownDrumFrets.get(fret) ?? 0) + 1);
        return null;
      }
      return { startTime, drum };
    })
    .filter(isNotNullish);

  if (unknownDrumFrets.size > 0) {
    const unknownDrumFretsCounts = Array.from(unknownDrumFrets).map(
      ([fret, count]) => `${fret} (x${count})`,
    );
    logger.log('warning', `Unknown drum frets: ${unknownDrumFretsCounts.join(', ')}.`);
  }

  return drumBeats;
}

export function convertSongsterrDataToNotes(songsterrData: SongsterrData): Array<Note> {
  if (!songsterrData.tuning) {
    throw new Error('Tuning data is required.');
  }

  return range(songsterrData.voices)
    .map((voiceIndex) => convertSongsterrDataToBars(songsterrData, voiceIndex))
    .flatMap(flattenBarsToNotes)
    .sort((a, b) => a.startTime - b.startTime)
    .map(({ string, fret, startTime, duration }) => {
      const stringNote = songsterrData.tuning![string];
      const frequency = getFrequencyFromMidiNote(stringNote + fret);
      return { startTime, frequency, duration };
    });
}
