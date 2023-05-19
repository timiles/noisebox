import { DrumBeat } from './DrumBeat';
import { Note } from './Note';
import { Sample } from './Sample';

export enum TrackType {
  Drum,
  Instrument,
}

export type Track = {
  id: string;
  name: string;
  instrument: string;
  type: TrackType;
  mute: boolean;
};

export type DrumTrack = Track & {
  drumBeats: Array<DrumBeat>;
  drumKitId?: number;
};

export type InstrumentTrack = Track & {
  notes: Array<Note>;
  sample?: Sample;
};
