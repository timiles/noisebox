import { Note } from 'types/Note';
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

export function convertSongsterrDataToNotes(songsterrData: SongsterrData): Array<Note> {
  const notes = new Array<Note>();

  for (let voice = 0; voice < songsterrData.voices; voice += 1) {
    let currentWholeBeatsPerMeasure = 0;
    let currentWholeBeatDuration = 0;
    let currentMeasureDuration = 0;

    let timeAtStartOfMeasure = 0;

    songsterrData.measures.forEach((measure) => {
      let timeAtStartOfBeat = 0;

      if (measure.signature) {
        const [beatsPerMeasure, beatType] = measure.signature;
        currentWholeBeatsPerMeasure = beatsPerMeasure / beatType;
        currentMeasureDuration = currentWholeBeatsPerMeasure * currentWholeBeatDuration;
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
              previousNote.waves = previousNote.frequency * previousNote.duration;
            } else {
              // Might not have tuning eg drum track
              const stringNote = songsterrData.tuning ? songsterrData.tuning[note.string] : 0;
              const frequency = getFrequencyFromMidiNote(stringNote + note.fret);
              const startTime = timeAtStartOfMeasure + timeAtStartOfBeat;
              notes.push({ startTime, frequency, duration, waves: frequency * duration });
            }
          });
        }

        timeAtStartOfBeat += duration;
      });

      timeAtStartOfMeasure += currentMeasureDuration;
    });
  }

  return notes;
}
