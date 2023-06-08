import { ILogger } from 'LoggerProvider';
import { DrumBeat } from 'types/DrumBeat';
import { DrumType } from 'types/DrumType';
import { Note } from 'types/Note';
import { TrackType } from 'types/Track';
import { isDefined } from 'utils/arrayUtils';
import { getFrequencyFromMidiNote } from 'utils/frequencyUtils';
import { SongsterrData } from './SongsterrData';

export function isValidSongsterrData(json: Object): boolean {
  const songsterrData = json as SongsterrData;
  return (
    typeof songsterrData.name === 'string' &&
    typeof songsterrData.voices === 'number' &&
    Array.isArray(songsterrData.measures)
  );
}

export function getTrackType(songsterrData: SongsterrData): TrackType {
  return songsterrData.instrumentId === 1024 ? TrackType.Drum : TrackType.Instrument;
}

type SongsterrNote = {
  string: number;
  fret: number;
  startTime: number;
  duration: number;
};

function flattenSongsterrNotes(songsterrData: SongsterrData): Array<SongsterrNote> {
  const notes = new Array<SongsterrNote>();

  for (let voice = 0; voice < songsterrData.voices; voice += 1) {
    let currentWholeBeatsPerMeasure = 0;
    let currentWholeBeatDuration = 0;
    let currentMeasureDuration = 0;

    let timeAtStartOfMeasure = 0;
    let timeAtStartOfRepeat: number | undefined;

    songsterrData.measures.forEach((measure) => {
      let timeAtStartOfBeat = 0;

      if (measure.signature) {
        const [beatsPerMeasure, beatType] = measure.signature;
        currentWholeBeatsPerMeasure = beatsPerMeasure / beatType;
        currentMeasureDuration = currentWholeBeatsPerMeasure * currentWholeBeatDuration;
      }

      if (measure.repeatStart) {
        timeAtStartOfRepeat = timeAtStartOfMeasure;
      }

      measure.voices[voice].beats.forEach((beat) => {
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

        if (!beat.rest) {
          beat.notes.forEach((note) => {
            if (note.string == null) {
              throw new Error('string not set');
            }
            if (note.fret == null) {
              throw new Error('fret not set');
            }

            if (note.tie) {
              const previousNote = notes[notes.length - 1];
              previousNote.duration += duration;
            } else {
              const { string, fret } = note;
              const startTime = timeAtStartOfMeasure + timeAtStartOfBeat;
              notes.push({ string, fret, startTime, duration });
            }
          });
        }

        timeAtStartOfBeat += duration;
      });

      timeAtStartOfMeasure += currentMeasureDuration;

      if (measure.repeat !== undefined && measure.repeat > 1 && timeAtStartOfRepeat !== undefined) {
        const repeatDuration = timeAtStartOfMeasure - timeAtStartOfRepeat;

        const notesToRepeat = notes.filter(({ startTime }) => startTime >= timeAtStartOfRepeat!);
        for (let repeatNumber = 1; repeatNumber < measure.repeat; repeatNumber += 1) {
          notes.push(
            ...notesToRepeat.map((note) => ({
              ...note,
              startTime: note.startTime + repeatDuration * repeatNumber,
            })),
          );
          timeAtStartOfMeasure += repeatDuration;
        }

        timeAtStartOfRepeat = undefined;
      }
    });
  }

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

  const drumBeats = flattenSongsterrNotes(songsterrData)
    .map(({ fret, startTime }) => {
      const drum = fretsToDrumsMap.get(fret);
      if (drum === undefined) {
        unknownDrumFrets.set(fret, (unknownDrumFrets.get(fret) ?? 0) + 1);
        return null;
      }
      return { startTime, drum };
    })
    .filter(isDefined);

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

  return flattenSongsterrNotes(songsterrData).map(({ string, fret, startTime, duration }) => {
    const stringNote = songsterrData.tuning![string];
    const frequency = getFrequencyFromMidiNote(stringNote + fret);
    return { startTime, frequency, duration };
  });
}
