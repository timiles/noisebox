export function getFrequencyFromMidiNote(midiNote: number): number {
  // A4 pitch is 440Hz, midi note number 69.
  return 440 * 2 ** ((midiNote - 69) / 12);
}

export function getMidiNoteFromFrequency(frequency: number): number {
  const note = 12 * (Math.log(frequency / 440) / Math.log(2));
  return Math.round(note) + 69;
}

const NOTE_NAMES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'B♭', 'B'];

export function getPitchFromMidiNote(midiNote: number): string | null {
  if (midiNote < 12) {
    return null;
  }
  const name = NOTE_NAMES[midiNote % 12];
  const octave = Math.floor(midiNote / 12) - 1;
  return `${name}${octave}`;
}

/**
 * Implementation of the ACF2+ algorithm to calculate frequency using autocorrelation.
 */
export function calculateFrequency(
  channelDataArrays: Array<Float32Array>,
  sampleRate: number,
): number {
  // Try each channel until we detect a frequency
  for (let channel = 0; channel < channelDataArrays.length; channel += 1) {
    const data = channelDataArrays[channel];

    const rootMeanSquare = Math.sqrt(data.reduce((acc, val) => acc + val ** 2, 0) / data.length);
    if (rootMeanSquare < 0.001) {
      // Not enough signal
      // eslint-disable-next-line no-continue
      continue;
    }

    const THRES = 0.2;
    let r1 = 0;
    let r2 = data.length - 1;
    for (let i = 0; i < data.length / 2; i += 1) {
      if (Math.abs(data[i]) < THRES) {
        r1 = i;
        break;
      }
    }
    for (let i = 1; i < data.length / 2; i += 1) {
      if (Math.abs(data[data.length - i]) < THRES) {
        r2 = data.length - i;
        break;
      }
    }

    const trimmedData = data.slice(r1, r2);
    const c = new Array(trimmedData.length).fill(0);
    for (let i = 0; i < trimmedData.length; i += 1) {
      for (let j = 0; j < trimmedData.length - i; j += 1) {
        c[i] += trimmedData[j] * trimmedData[j + i];
      }
    }

    let d = 0;
    while (c[d] > c[d + 1]) {
      d += 1;
    }

    let maxval = -1;
    let maxpos = -1;
    for (let i = d; i < trimmedData.length; i += 1) {
      if (c[i] > maxval) {
        maxval = c[i];
        maxpos = i;
      }
    }
    const T0 = maxpos;

    const x1 = c[T0 - 1];
    const x2 = c[T0];
    const x3 = c[T0 + 1];
    const a = (x1 + x3 - 2 * x2) / 2;
    const b = (x3 - x1) / 2;

    return sampleRate / (a ? T0 - b / (2 * a) : T0);
  }

  // If we're here, we couldn't find a channel with enough signal
  throw new Error('Not enough signal.');
}
