import Kali from '@descript/kali';
import { AudioSource } from 'types/AudioSource';
import { Sample } from 'types/Sample';

export function getChannelDataArrays(audioBuffer: AudioBuffer): Array<Float32Array> {
  return [...Array(audioBuffer.numberOfChannels)].map((_, i) => audioBuffer.getChannelData(i));
}

type Clip = { start: number; length: number };
type GetClipsOptions = {
  minimumSilenceDuration: number;
  minimumClipDuration: number;
  maximumClipDuration?: number;
};

export function getClips(
  channelDataArrays: Array<Float32Array>,
  sampleRate: number,
  options: GetClipsOptions,
): Array<Clip> {
  const minimumSilenceLength = sampleRate * options.minimumSilenceDuration;
  const minimumClipLength = sampleRate * options.minimumClipDuration;
  const maximumClipLength = options.maximumClipDuration
    ? sampleRate * options.maximumClipDuration
    : undefined;

  const isClipLongEnough = (clipLength: number) =>
    clipLength >= minimumClipLength &&
    (maximumClipLength === undefined || clipLength <= maximumClipLength);

  const clips = new Array<Clip>();

  let currentClipStart = 0;
  let currentClipLength = 0;
  let currentEmptyLength = 0;

  // Silence is defined as a minimum number of empty frames
  let isSilent = true;

  const maxChannelDataLength = Math.max(...channelDataArrays.map((data) => data.length));
  for (let dataIndex = 0; dataIndex < maxChannelDataLength; dataIndex += 1) {
    const allChannelsEmpty = channelDataArrays.every(
      (channelData) => channelData.length < dataIndex || Math.abs(channelData[dataIndex]) < 0.001,
    );
    if (allChannelsEmpty) {
      currentEmptyLength += 1;

      if (!isSilent) {
        // Continue counting clip length until we find an actual silence
        currentClipLength += 1;

        if (currentEmptyLength >= minimumSilenceLength) {
          isSilent = true;

          // Found silence, so check if we can collect the current clip
          const length = currentClipLength - currentEmptyLength;
          if (isClipLongEnough(length)) {
            clips.push({ start: currentClipStart, length });
          }

          currentClipLength = 0;
        }
      }
    } else {
      // Not an empty frame, so reset counter
      currentEmptyLength = 0;
      currentClipLength += 1;

      if (isSilent) {
        // If we had previously been silent, this is now the start of the next clip
        currentClipStart = dataIndex;
        isSilent = false;
      }
    }
  }

  // Collect final clip
  const length = currentClipLength - currentEmptyLength;
  if (isClipLongEnough(length)) {
    clips.push({ start: currentClipStart, length });
  }

  return clips;
}

export function getClipsFromAudioBuffer(
  audioBuffer: AudioBuffer,
  options: GetClipsOptions,
): Array<Clip> {
  return getClips(getChannelDataArrays(audioBuffer), audioBuffer.sampleRate, options);
}

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

  getChannelDataArrays(inputBuffer).forEach((channelData, channel) => {
    const sampleData = channelData.slice(startFrame, startFrame + numberOfFrames);
    sampleBuffer.getChannelData(channel).set(sampleData);
  });

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
        .filter((sample) => sample.frequency != null && sample.frequency > 0)
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

  const stretchedChannelDataArrays = getChannelDataArrays(inputAudioBuffer).map((channelData) =>
    stretchChannelData(channelData, sampleRate, stretchFactor),
  );

  const stretchedAudioBuffer = new AudioBuffer({
    length: Math.max(...stretchedChannelDataArrays.map((data) => data.length)),
    numberOfChannels,
    sampleRate,
  });

  stretchedChannelDataArrays.forEach((channelData, channel) => {
    stretchedAudioBuffer.getChannelData(channel).set(channelData);
  });

  return stretchedAudioBuffer;
}
