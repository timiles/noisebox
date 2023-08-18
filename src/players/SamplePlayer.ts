import { ILogger } from 'LoggerProvider';
import { Sample } from 'types/Sample';
import { distinct } from 'utils/arrayUtils';
import { getChannelDataArrays } from 'utils/sampleUtils';
import { getWorkerPool } from 'workers/getWorkerPool';

type StretchedSample = {
  originalFrequency: number;
  originalWaves: number;

  /**
   * Keyed on `stretchFactor`
   */
  buffers: Map<number, AudioBuffer | 'stretching'>;
};

export default class SamplePlayer {
  /**
   * Keyed on `sampleId`
   */
  private stretchedSamples = new Map<string, StretchedSample>();

  constructor(private logger: ILogger) {}

  private getOrCreateStretchedSample(sample: Sample): StretchedSample {
    let stretchedSample = this.stretchedSamples.get(sample.id);
    if (stretchedSample === undefined) {
      stretchedSample = {
        originalFrequency: sample.frequency,
        originalWaves: sample.frequency * sample.duration,
        buffers: new Map<number, AudioBuffer>(),
      };
      this.stretchedSamples.set(sample.id, stretchedSample);
    }
    return stretchedSample;
  }

  prepareSampleForNotes(
    sample: Sample,
    notes: Array<{ frequency: number; duration: number }>,
  ): Promise<void> {
    return new Promise((resolve) => {
      const stretchedSample = this.getOrCreateStretchedSample(sample);
      const factorsToStretch = notes
        .map(({ frequency, duration }) => (frequency * duration) / stretchedSample.originalWaves)
        .filter(distinct)
        .filter((factor) => !stretchedSample.buffers.has(factor));

      if (factorsToStretch.length === 0) {
        // Nothing to do as all samples are already stretched or in progress.
        // Note that this can resolve despite being dependent on a sample that is being stretched
        // for another track, so this track thinks it's ready when it isn't quite yet. Problem?
        resolve();
        return;
      }

      const pool = getWorkerPool();

      // Create copy so we can keep track of what's in progress
      const factorsInProgress = new Map(factorsToStretch.map((factor) => [factor, true]));

      factorsToStretch.forEach((factor) => {
        // Mark as stretching so another track doesn't try to stretch the same sample in parallel
        stretchedSample.buffers.set(factor, 'stretching');

        const channelDataArrays = getChannelDataArrays(sample.audioBuffer);
        const { numberOfChannels, sampleRate } = sample.audioBuffer;

        pool
          .stretchAudioBuffer(channelDataArrays, sampleRate, factor)
          .then((stretchedChannelDataArrays: ReadonlyArray<Float32Array>) => {
            const stretchedBuffer = new AudioBuffer({
              length: Math.max(...stretchedChannelDataArrays.map((data) => data.length)),
              numberOfChannels,
              sampleRate,
            });

            stretchedChannelDataArrays.forEach((channelData, channel) => {
              stretchedBuffer.getChannelData(channel).set(channelData);
            });

            stretchedSample.buffers.set(factor, stretchedBuffer);
          })
          .catch((reason) => {
            if (stretchedSample.buffers.get(factor) === 'stretching') {
              stretchedSample.buffers.delete(factor);
            }
            const message = `Error occurred stretching sample "${sample.name}", factor: ${factor}.`;
            this.logger.log('error', `${message} ${reason}`);
          })
          .then(() => {
            factorsInProgress.delete(factor);
            if (factorsInProgress.size === 0) {
              pool.terminate();
              resolve();
            }
          });
      });
    });
  }

  play(
    audioContext: BaseAudioContext,
    sampleId: string,
    frequency: number,
    duration: number,
    startTime: number,
  ) {
    const stretchedSample = this.stretchedSamples.get(sampleId);

    if (!stretchedSample) {
      this.logger.log('warning', `Sample id "${sampleId}" not yet loaded.`);
      return;
    }

    const stretchFactor = (frequency * duration) / stretchedSample.originalWaves;
    const buffer = stretchedSample.buffers.get(stretchFactor);

    if (!buffer || buffer === 'stretching') {
      this.logger.log(
        'warning',
        `Sample id "${sampleId}" not yet stretched for factor "${stretchFactor}".`,
      );
      return;
    }

    const playbackRate = frequency / stretchedSample.originalFrequency;
    const bufferSource = new AudioBufferSourceNode(audioContext, { buffer, playbackRate });
    bufferSource.connect(audioContext.destination);
    bufferSource.start(startTime);
  }
}
