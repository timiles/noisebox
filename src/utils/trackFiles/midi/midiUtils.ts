import { ILogger } from 'LoggerProvider';
import { DRUM_MIDI_NOTES } from 'data/DRUM_MIDI_NOTES';
import {
  MidiData,
  MidiEvent,
  MidiNoteOffEvent,
  MidiNoteOnEvent,
  MidiTrackNameEvent,
} from 'midi-file';
import { MidiNote } from 'types/MidiNote';
import { Track, TrackType } from 'types/Track';
import { isNotNullish } from 'utils/arrayUtils';
import { getFrequencyFromMidiNote } from 'utils/frequencyUtils';
import { v4 as uuidv4 } from 'uuid';

/**
 * If tempo is unspecified, the midi spec is to default to 120bpm, so 0.5s per beat.
 */
const MIDI_DEFAULT_MICROSECONDS_PER_BEAT = 500000;

type SetTempoEvent = {
  ticks: number;
  microsecondsPerBeat: number;
};

function extractSetTempoEvents(events: ReadonlyArray<MidiEvent>): ReadonlyArray<SetTempoEvent> {
  const setTempoEvents = new Array<SetTempoEvent>();

  let currentTicks = 0;
  events.forEach((event) => {
    currentTicks += event.deltaTime;

    if (event.type === 'setTempo') {
      setTempoEvents.push({
        ticks: currentTicks,
        microsecondsPerBeat: event.microsecondsPerBeat,
      });
    }
  });

  return setTempoEvents;
}

function convertMidiEventsToTracks(
  events: ReadonlyArray<MidiEvent>,
  setTempoEvents: ReadonlyArray<SetTempoEvent>,
  ticksPerBeat: number,
  logger?: ILogger,
): ReadonlyArray<Track> {
  const notesByChannel = new Map<number, Array<MidiNote>>();
  const runningNotesByChannel = new Map<number, Array<Omit<MidiNote, 'duration'>>>();

  const handleNoteStarted = (event: MidiNoteOnEvent, currentTime: number) => {
    let runningNotes = runningNotesByChannel.get(event.channel);
    if (runningNotes === undefined) {
      runningNotes = new Array<Omit<MidiNote, 'duration'>>();
      runningNotesByChannel.set(event.channel, runningNotes);
    }
    runningNotes.push({
      startTime: currentTime,
      noteNumber: event.noteNumber,
    });
  };

  const handleNoteEnded = (event: MidiNoteOffEvent | MidiNoteOnEvent, currentTime: number) => {
    const runningNotes = runningNotesByChannel.get(event.channel);
    const index = runningNotes?.findIndex((note) => note.noteNumber === event.noteNumber);

    if (runningNotes === undefined || index === undefined || index < 0) {
      logger?.log('warning', `Note ended but not started: ${JSON.stringify(event)}.`);
      return;
    }

    const [{ startTime, noteNumber }] = runningNotes.splice(index, 1);

    let notes = notesByChannel.get(event.channel);
    if (notes === undefined) {
      notes = new Array<MidiNote>();
      notesByChannel.set(event.channel, notes);
    }

    const duration = currentTime - startTime;
    notes.push({ startTime, noteNumber, duration });
  };

  const getTickDuration = (microsecondsPerBeat: number | undefined) =>
    (microsecondsPerBeat ?? MIDI_DEFAULT_MICROSECONDS_PER_BEAT) / 1000000 / ticksPerBeat;

  let currentTickDuration = getTickDuration(setTempoEvents[0]?.microsecondsPerBeat);
  let currentTempoIndex = 0;
  let currentTicks = 0;
  let currentTime = 0;
  events.forEach((event) => {
    const nextTicks = currentTicks + event.deltaTime;
    // TODO: iterate through setTEmpoEvents?
    const nextTempoIndex = setTempoEvents.filter(({ ticks }) => ticks <= nextTicks).length - 1;

    for (let tempoIndex = currentTempoIndex; tempoIndex <= nextTempoIndex; tempoIndex += 1) {
      const currentTempo = setTempoEvents[tempoIndex];
      const startTicks = tempoIndex === currentTempoIndex ? currentTicks : currentTempo.ticks;
      const endTicks =
        tempoIndex < nextTempoIndex
          ? // If we still have more tempo changes, take the next tempo's start ticks
            setTempoEvents[tempoIndex + 1].ticks
          : nextTicks;

      if (tempoIndex > currentTempoIndex) {
        // If tempo has changed, update tick duration
        currentTickDuration = getTickDuration(currentTempo.microsecondsPerBeat);
      }
      currentTime += (endTicks - startTicks) * currentTickDuration;
    }

    currentTempoIndex = nextTempoIndex;
    currentTicks = nextTicks;

    switch (event.type) {
      case 'setTempo': {
        // In format 0 files, the tempo events are in the main track
        currentTickDuration = getTickDuration(event.microsecondsPerBeat);
        break;
      }
      case 'noteOn': {
        if (event.velocity > 0) {
          handleNoteStarted(event, currentTime);
        } else {
          handleNoteEnded(event, currentTime);
        }
        break;
      }
      case 'noteOff': {
        handleNoteEnded(event, currentTime);
        break;
      }
      default: {
        break;
      }
    }
  });

  Array.from(runningNotesByChannel.entries()).forEach(([channel, notes]) => {
    if (notes.length > 0) {
      const message =
        `Notes started but not ended. ` +
        `Channel: ${channel + 1} (index: ${channel}), notes: ${JSON.stringify(notes)}.`;
      logger?.log('warning', message);
    }
  });

  const tracks = new Array<Track>();

  const unknownDrumMidiNotes = new Map<number, number>();

  Array.from(notesByChannel.entries())
    .sort(([a], [b]) => a - b)
    .forEach(([channel, midiNotes]) => {
      const trackType = channel === 9 ? TrackType.Drum : TrackType.Instrument;

      const trackName = (events.find((e) => e.type === 'trackName') as MidiTrackNameEvent)?.text;
      const instrument = trackName + (notesByChannel.size > 1 ? ` channel ${channel + 1}` : '');

      let track: Track;

      switch (trackType) {
        case TrackType.Drum: {
          const drumBeats = midiNotes
            .map(({ startTime, noteNumber }) => {
              const drum = DRUM_MIDI_NOTES.get(noteNumber);
              if (drum === undefined) {
                unknownDrumMidiNotes.set(
                  noteNumber,
                  (unknownDrumMidiNotes.get(noteNumber) ?? 0) + 1,
                );
                return null;
              }
              return { startTime, drum };
            })
            .filter(isNotNullish);

          track = { type: TrackType.Drum, id: uuidv4(), instrument, drumBeats };
          break;
        }
        case TrackType.Instrument: {
          const notes = midiNotes.map(({ startTime, noteNumber, duration }) => ({
            startTime,
            frequency: getFrequencyFromMidiNote(noteNumber),
            duration,
          }));

          track = { type: TrackType.Instrument, id: uuidv4(), instrument, notes };
          break;
        }
        default: {
          const exhaustiveCheck: never = trackType;
          throw new Error(`Unknown TrackType: ${trackType}.`);
        }
      }

      tracks.push(track);
    });

  if (unknownDrumMidiNotes.size > 0) {
    const unknownDrumMidiNotesCounts = Array.from(unknownDrumMidiNotes).map(
      ([midiNote, count]) => `${midiNote} (x${count})`,
    );
    logger?.log('warning', `Unknown drum midi notes: ${unknownDrumMidiNotesCounts.join(', ')}.`);
  }

  return tracks;
}

export function convertMidiDataToTracks(
  midiData: MidiData,
  logger?: ILogger,
): ReadonlyArray<Track> {
  const { header, tracks } = midiData;
  const { format, ticksPerBeat } = header;

  if (ticksPerBeat === undefined) {
    throw new Error('Header value `ticksPerBeat` is required.');
  }

  let tempoTrack: ReadonlyArray<MidiEvent> = [];
  if (format > 0) {
    [tempoTrack] = tracks.splice(0, 1);
  }

  const setTempoEvents: ReadonlyArray<SetTempoEvent> = extractSetTempoEvents(tempoTrack);

  return tracks.flatMap((events) =>
    convertMidiEventsToTracks(events, setTempoEvents, ticksPerBeat, logger),
  );
}
