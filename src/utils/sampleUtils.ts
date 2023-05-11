export function clipSample(
  inputBuffer: AudioBuffer,
  startTime: number,
  endTime: number,
): AudioBuffer {
  const startSampleFrame = Math.floor(startTime * inputBuffer.sampleRate);
  const endSampleFrame = Math.floor(endTime * inputBuffer.sampleRate);

  if (endSampleFrame <= startSampleFrame) {
    throw new Error('startTime must be before endTime.');
  }

  const sampleBuffer = new AudioBuffer({
    length: endSampleFrame - startSampleFrame,
    numberOfChannels: inputBuffer.numberOfChannels,
    sampleRate: inputBuffer.sampleRate,
  });

  for (let channel = 0; channel < inputBuffer.numberOfChannels; channel += 1) {
    const inputData = inputBuffer.getChannelData(channel);
    const sampleData = inputData.slice(startSampleFrame, endSampleFrame);
    sampleBuffer.getChannelData(channel).set(sampleData);
  }

  return sampleBuffer;
}
