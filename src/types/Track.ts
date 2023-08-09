import { DrumBeat } from './DrumBeat';
import { Note } from './Note';
import { Sample } from './Sample';

export enum TrackType {
  Drum,
  Instrument,
}

type BaseTrack<T extends TrackType> = {
  type: T;
  id: string;
  instrument: string;
  mute?: boolean;
};

type DrumTrack = BaseTrack<TrackType.Drum> & {
  drumBeats: Array<DrumBeat>;
  drumKitId?: number;
};

type InstrumentTrack = BaseTrack<TrackType.Instrument> & {
  notes: Array<Note>;
  sample?: Sample;
};

export type Track = DrumTrack | InstrumentTrack;
