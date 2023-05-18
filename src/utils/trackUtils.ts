import { DrumTrack, InstrumentTrack, Track, TrackType } from 'types/Track';

export function isDrumTrack(track: Track): track is DrumTrack {
  return track.type === TrackType.Drum;
}

export function isInstrumentTrack(track: Track): track is InstrumentTrack {
  return track.type === TrackType.Instrument;
}
