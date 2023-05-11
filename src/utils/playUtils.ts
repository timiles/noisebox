export function playFrequency(audioContext: AudioContext, frequency: number, duration: number) {
  const oscillator = new OscillatorNode(audioContext, { frequency });
  oscillator.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration);
}

export function playAudioBuffer(audioContext: AudioContext, buffer: AudioBuffer) {
  const bufferSource = new AudioBufferSourceNode(audioContext, { buffer });
  bufferSource.connect(audioContext.destination);
  bufferSource.start();
}
