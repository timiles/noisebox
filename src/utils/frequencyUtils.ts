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
function calculateFrequency(buf: Float32Array, sampleRate: number): number | null {
  const rootMeanSquare = Math.sqrt(buf.reduce((acc, val) => acc + val ** 2, 0) / buf.length);
  if (rootMeanSquare < 0.001) {
    // Not enough signal
    return null;
  }

  const THRES = 0.2;
  let r1 = 0;
  let r2 = buf.length - 1;
  for (let i = 0; i < buf.length / 2; i += 1) {
    if (Math.abs(buf[i]) < THRES) {
      r1 = i;
      break;
    }
  }
  for (let i = 1; i < buf.length / 2; i += 1) {
    if (Math.abs(buf[buf.length - i]) < THRES) {
      r2 = buf.length - i;
      break;
    }
  }

  const buf2 = buf.slice(r1, r2);
  const c = new Array(buf2.length).fill(0);
  for (let i = 0; i < buf2.length; i += 1) {
    for (let j = 0; j < buf2.length - i; j += 1) {
      c[i] += buf2[j] * buf2[j + i];
    }
  }

  let d = 0;
  while (c[d] > c[d + 1]) {
    d += 1;
  }

  let maxval = -1;
  let maxpos = -1;
  for (let i = d; i < buf2.length; i += 1) {
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

export function calculateAudioBufferFrequency(audioBuffer: AudioBuffer): number | null {
  // Try each channel until we detect a frequency
  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel += 1) {
    const frequency = calculateFrequency(
      audioBuffer.getChannelData(channel),
      audioBuffer.sampleRate,
    );
    if (frequency !== null) {
      return frequency;
    }
  }
  return null;
}
