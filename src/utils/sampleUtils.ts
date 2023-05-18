import Kali from '@descript/kali';
import { AudioSource } from 'types/AudioSource';
import { Sample } from 'types/Sample';

export function clipSampleByFrames(
  inputBuffer: AudioBuffer,
  startFrame: number,
  numberOfFrames: number,
): AudioBuffer {
  const sampleBuffer = new AudioBuffer({
    length: numberOfFrames,
    numberOfChannels: inputBuffer.numberOfChannels,
    sampleRate: inputBuffer.sampleRate,
  });

  for (let channel = 0; channel < inputBuffer.numberOfChannels; channel += 1) {
    const inputData = inputBuffer.getChannelData(channel);
    const sampleData = inputData.slice(startFrame, startFrame + numberOfFrames);
    sampleBuffer.getChannelData(channel).set(sampleData);
  }

  return sampleBuffer;
}

export function clipSampleByTime(
  inputBuffer: AudioBuffer,
  startTime: number,
  endTime: number,
): AudioBuffer {
  if (endTime <= startTime) {
    throw new Error('startTime must be before endTime.');
  }

  const startFrame = Math.floor(startTime * inputBuffer.sampleRate);
  const totalFrames = Math.floor((endTime - startTime) * inputBuffer.sampleRate);

  return clipSampleByFrames(inputBuffer, startFrame, totalFrames);
}

export function getValidSamples(audioSources: Array<AudioSource>): Array<Sample> {
  const validSamples = new Array<Sample>();
  audioSources.forEach((audioSource) => {
    validSamples.push(
      ...audioSource.samples
        .filter((sample) => sample.frequency !== null && sample.frequency > 0)
        .map((sample) => ({
          id: sample.id,
          name: `${audioSource.name} > ${sample.name}`,
          audioBuffer: sample.audioBuffer,
          frequency: sample.frequency!,
          waves: sample.frequency! * sample.duration,
        })),
    );
  });
  return validSamples;
}

function stretchChannelData(
  inputData: Float32Array,
  sampleRate: number,
  stretchFactor: number,
): Float32Array {
  // Stretching each channel individually appears to be faster than
  // interleaving into a stereo channel, stretching, then de-interleaving again.
  const numberOfChannels = 1;
  const outputSize = Math.floor(inputData.length * stretchFactor + 1);
  const bufferSize = 4096 * numberOfChannels;

  const kali = new Kali(numberOfChannels);
  kali.setup(sampleRate, 1 / stretchFactor, false);

  // Create an array for the stretched output
  const outputData = new Float32Array(outputSize);

  let inputOffset = 0;
  let completedOffset = 0;
  let flushed = false;

  while (completedOffset < outputData.length) {
    // Read stretched samples into our output array
    completedOffset += kali.output(
      outputData.subarray(
        completedOffset,
        Math.min(completedOffset + bufferSize, outputData.length),
      ),
    );

    if (inputOffset < inputData.length) {
      // If we have more data to write, write it
      const dataToInput = inputData.subarray(
        inputOffset,
        Math.min(inputOffset + bufferSize, inputData.length),
      );
      inputOffset += dataToInput.length;

      // Feed Kali samples
      kali.input(dataToInput);
      kali.process();
    } else if (!flushed) {
      // Flush if we haven't already
      kali.flush();
      flushed = true;
    }
  }

  return outputData;
}

export function stretchAudioBuffer(
  inputAudioBuffer: AudioBuffer,
  stretchFactor: number,
): AudioBuffer {
  if (stretchFactor === 1) {
    return inputAudioBuffer;
  }

  const { numberOfChannels, sampleRate } = inputAudioBuffer;

  const stretchedChannelDatas = new Array<Float32Array>(numberOfChannels);
  for (let channel = 0; channel < numberOfChannels; channel += 1) {
    const channelData = inputAudioBuffer.getChannelData(channel);
    const stretchedData = stretchChannelData(channelData, sampleRate, stretchFactor);
    stretchedChannelDatas[channel] = stretchedData;
  }

  const stretchedAudioBuffer = new AudioBuffer({
    length: Math.max(...stretchedChannelDatas.map((data) => data.length)),
    numberOfChannels,
    sampleRate,
  });

  for (let channel = 0; channel < numberOfChannels; channel += 1) {
    stretchedAudioBuffer.getChannelData(channel).set(stretchedChannelDatas[channel]);
  }

  return stretchedAudioBuffer;
}
