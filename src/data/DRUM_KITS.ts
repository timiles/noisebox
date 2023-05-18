import { DrumType } from 'types/DrumType';

type DrumKit = {
  id: number;
  name: string;
  url: string;
  samples: Array<{ drumTypes: Array<DrumType>; numberOfFrames: number }>;
};

export const DRUM_KITS: ReadonlyArray<DrumKit> = [
  {
    id: 1,
    name: 'Roland R-8',
    url: '/sounds/drum-kits/roland-r8.wav',
    samples: [
      {
        drumTypes: [DrumType.Bass1, DrumType.Bass2],
        numberOfFrames: 24361,
      },
      {
        drumTypes: [DrumType.Tom1],
        numberOfFrames: 12595,
      },
      {
        drumTypes: [DrumType.Tom2],
        numberOfFrames: 16983,
      },
      {
        drumTypes: [DrumType.Tom3],
        numberOfFrames: 22847,
      },
      {
        drumTypes: [DrumType.Snare],
        numberOfFrames: 9473,
      },
      {
        drumTypes: [
          DrumType.OpenHiHat,
          DrumType.ClosedHiHat,
          DrumType.FootHiHat,
          DrumType.LooseHiHat,
        ],
        numberOfFrames: 13481,
      },
    ],
  },
  {
    id: 2,
    name: 'Acoustic kit',
    url: '/sounds/drum-kits/acoustic-kit.wav',
    samples: [
      {
        drumTypes: [DrumType.Bass1, DrumType.Bass2],
        numberOfFrames: 37275,
      },
      {
        drumTypes: [DrumType.Tom1],
        numberOfFrames: 44241,
      },
      {
        drumTypes: [DrumType.Tom2],
        numberOfFrames: 57495,
      },
      {
        drumTypes: [DrumType.Tom3],
        numberOfFrames: 58548,
      },
      {
        drumTypes: [DrumType.Snare],
        numberOfFrames: 33906,
      },
      {
        drumTypes: [
          DrumType.OpenHiHat,
          DrumType.ClosedHiHat,
          DrumType.FootHiHat,
          DrumType.LooseHiHat,
        ],
        numberOfFrames: 20424,
      },
    ],
  },
  {
    id: 3,
    name: 'Stark',
    url: '/sounds/drum-kits/stark.wav',
    samples: [
      {
        drumTypes: [DrumType.Bass1, DrumType.Bass2],
        numberOfFrames: 4768,
      },
      {
        drumTypes: [DrumType.Tom1],
        numberOfFrames: 56752,
      },
      {
        drumTypes: [DrumType.Tom2],
        numberOfFrames: 57651,
      },
      {
        drumTypes: [DrumType.Tom3],
        numberOfFrames: 54296,
      },
      {
        drumTypes: [DrumType.Snare],
        numberOfFrames: 11168,
      },
      {
        drumTypes: [
          DrumType.OpenHiHat,
          DrumType.ClosedHiHat,
          DrumType.FootHiHat,
          DrumType.LooseHiHat,
        ],
        numberOfFrames: 16233,
      },
    ],
  },
];
