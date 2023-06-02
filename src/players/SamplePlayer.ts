import { ILogger } from 'LoggerProvider';
import { Sample } from 'types/Sample';
import { distinct } from 'utils/arrayUtils';
import { stretchAudioBuffer } from 'utils/sampleUtils';

type StretchedSample = {
  originalFrequency: number;
  originalWaves: number;

  /**
   * Keyed on `stretchFactor`
   */
  buffers: Map<number, AudioBuffer>;
};

export default class SamplePlayer {
  /**
   * Keyed on `sampleId`
   */
  private stretchedSamples = new Map<string, StretchedSample>();

  constructor(private audioContext: AudioContext, private logger: ILogger) {}

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

  prepareSampleForNotes(sample: Sample, notes: Array<{ frequency: number; duration: number }>) {
    const stretchedSample = this.getOrCreateStretchedSample(sample);

    notes
      .map(({ frequency, duration }) => (frequency * duration) / stretchedSample.originalWaves)
      .filter(distinct)
      .forEach((stretchFactor) => {
        // Check if sample has already been stretched
        if (!stretchedSample.buffers.has(stretchFactor)) {
          const stretchedBuffer = stretchAudioBuffer(sample.audioBuffer, stretchFactor);
          stretchedSample.buffers.set(stretchFactor, stretchedBuffer);
        }
      });
  }

  play(sampleId: string, frequency: number, duration: number, startTime: number) {
    const stretchedSample = this.stretchedSamples.get(sampleId);

    if (!stretchedSample) {
      this.logger.log('warning', `Sample id "${sampleId}" not yet loaded.`);
      return;
    }

    const stretchFactor = (frequency * duration) / stretchedSample.originalWaves;
    const buffer = stretchedSample.buffers.get(stretchFactor);

    if (!buffer) {
      this.logger.log(
        'warning',
        `Sample id "${sampleId}" not yet stretched for factor "${stretchFactor}".`,
      );
      return;
    }

    const bufferSource = new AudioBufferSourceNode(this.audioContext, {
      buffer,
      playbackRate: frequency / stretchedSample.originalFrequency,
    });
    bufferSource.connect(this.audioContext.destination);
    bufferSource.start(startTime);
  }
}
