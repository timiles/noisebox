import { DrumType } from 'types/DrumType';

export type DrumKit = {
  id: number;
  name: string;
  url: string;
  // These will be clipped out from the sound file in order
  samples: Array<{ drumTypes: Array<DrumType> }>;
};

export const DRUM_KITS: ReadonlyArray<DrumKit> = [
  {
    id: 1,
    name: 'Roland R-8',
    url: './sounds/drum-kits/roland-r8.wav',
    samples: [
      {
        drumTypes: [DrumType.Bass1, DrumType.Bass2],
      },
      {
        drumTypes: [DrumType.Tom1],
      },
      {
        drumTypes: [DrumType.Tom2],
      },
      {
        drumTypes: [DrumType.Tom3],
      },
      {
        drumTypes: [DrumType.Snare],
      },
      {
        drumTypes: [
          DrumType.OpenHiHat,
          DrumType.ClosedHiHat,
          DrumType.FootHiHat,
          DrumType.LooseHiHat,
        ],
      },
    ],
  },
  {
    id: 2,
    name: 'Acoustic kit',
    url: './sounds/drum-kits/acoustic-kit.wav',
    samples: [
      {
        drumTypes: [DrumType.Bass1, DrumType.Bass2],
      },
      {
        drumTypes: [DrumType.Tom1],
      },
      {
        drumTypes: [DrumType.Tom2],
      },
      {
        drumTypes: [DrumType.Tom3],
      },
      {
        drumTypes: [DrumType.Snare],
      },
      {
        drumTypes: [
          DrumType.OpenHiHat,
          DrumType.ClosedHiHat,
          DrumType.FootHiHat,
          DrumType.LooseHiHat,
        ],
      },
    ],
  },
  {
    id: 3,
    name: 'Stark',
    url: './sounds/drum-kits/stark.wav',
    samples: [
      {
        drumTypes: [DrumType.Bass1, DrumType.Bass2],
      },
      {
        drumTypes: [DrumType.Tom1],
      },
      {
        drumTypes: [DrumType.Tom2],
      },
      {
        drumTypes: [DrumType.Tom3],
      },
      {
        drumTypes: [DrumType.Snare],
      },
      {
        drumTypes: [
          DrumType.OpenHiHat,
          DrumType.ClosedHiHat,
          DrumType.FootHiHat,
          DrumType.LooseHiHat,
        ],
      },
    ],
  },
];
