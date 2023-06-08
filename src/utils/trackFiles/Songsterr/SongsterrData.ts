export type SongsterrData = {
  strings: number;
  frets: number;
  tuning?: Array<number>;
  name: string;
  instrument: string;
  instrumentId: number;
  volume: number;
  balance: number;
  rest?: boolean;
  measures: Array<{
    index: number;
    signature?: [number, number];
    rest?: boolean;
    voices: Array<{
      beats: Array<{
        type: number;
        rest?: boolean;
        notes: Array<{
          rest?: boolean;
          string?: number;
          fret?: number;
          tie?: boolean;
          bend?: {
            points: Array<{
              position: number;
              tone: number;
            }>;
            tone: number;
          };
          dead?: boolean;
          ghost?: boolean;
          grace?: boolean;
          hp?: boolean;
          slide?: string;
          tremolo?: boolean;
        }>;
        tempo?: {
          type: number;
          bpm: number;
        };
        dotted?: boolean;
        duration: [number, number];
        fadeIn?: boolean;
        beamStart?: boolean;
        beamStop?: boolean;
        letRing?: boolean;
        text?: {
          text: string;
          width: number;
        };
        tuplet?: number;
        tupletStart?: boolean;
        tupletStop?: boolean;
        upStroke?: number;
        velocity?: string;
      }>;
    }>;
    marker?: {
      text: string;
      width: number;
    };
    repeatStart?: boolean;
    repeat?: number;
  }>;
  capo: number;
  voices: number;
  automations: {
    tempo: Array<{
      measure: number;
      linear: boolean;
      visible: boolean;
      position: number;
      type: number;
      bpm: number;
    }>;
  };
  version: number;
  songId: number;
  partId: number;
  revisionId: number;
};
