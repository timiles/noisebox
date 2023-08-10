import { DrumType } from 'types/DrumType';

export const DRUM_MIDI_NOTES = new Map<number, DrumType>([
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

export {};
