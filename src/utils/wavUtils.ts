function interleaveChannelData(channelDataArrays: [Float32Array, Float32Array]) {
  const [leftChannel, rightChannel] = channelDataArrays;

  if (leftChannel.length !== rightChannel.length) {
    throw new Error(
      `Channels are not equal length. Left: ${leftChannel.length}, right: ${rightChannel.length}.`,
    );
  }

  const result = new Float32Array(leftChannel.length * 2);
  let resultIndex = 0;

  for (let inputIndex = 0; inputIndex < leftChannel.length; inputIndex += 1) {
    result[(resultIndex += 1)] = leftChannel[inputIndex];
    result[(resultIndex += 1)] = rightChannel[inputIndex];
  }

  return result;
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i += 1) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function encodeDataToWav(samples: Float32Array, numChannels: number, sampleRate: number) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* RIFF chunk length */
  view.setUint32(4, 36 + samples.length * 2, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, 1, true);
  /* channel count */
  view.setUint16(22, numChannels, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * 4, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, numChannels * 2, true);
  /* bits per sample */
  view.setUint16(34, 16, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i += 1, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return view;
}

export function encodeBufferToWav(
  channelDataArrays: ReadonlyArray<Float32Array>,
  sampleRate: number,
): Blob {
  const [leftChannel, rightChannel] = channelDataArrays;

  if (leftChannel === undefined || rightChannel === undefined) {
    throw new Error('Wav encoding requires 2 data channels.');
  }

  const data = interleaveChannelData([leftChannel, rightChannel]);
  const wavData = encodeDataToWav(data, 2, sampleRate);
  return new Blob([wavData], { type: 'audio/wav' });
}
