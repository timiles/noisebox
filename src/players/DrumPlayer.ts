import { ILogger } from 'LoggerProvider';
import { DRUM_KITS, DrumKit } from 'data/DRUM_KITS';
import { enqueueSnackbar } from 'notistack';
import { DrumType } from 'types/DrumType';
import { clipSampleByFrames, getClipsFromAudioBuffer } from 'utils/sampleUtils';

export default class DrumPlayer {
  /**
   * Mapping of `drumKitId` => `drum` => `AudioBuffer`.
   */
  private drumKitBuffers = new Map<number, Map<DrumType, AudioBuffer>>();

  constructor(private logger: ILogger) {}

  private handleDrumKitLoaded(drumKit: DrumKit, audioBuffer: AudioBuffer) {
    const { id, name, samples } = drumKit;

    const clips = getClipsFromAudioBuffer(audioBuffer, {
      minimumSilenceDuration: 0.005,
      minimumClipDuration: 0.05,
    });

    if (samples.length !== clips.length) {
      this.logger.log(
        'warning',
        `Drum kit "${name}": expected ${samples.length} samples, found ${clips.length} clips.`,
      );
    }

    const drumBuffers = new Map<number, AudioBuffer>();
    this.drumKitBuffers.set(id, drumBuffers);

    clips.forEach((clip, index) => {
      if (index < samples.length) {
        const sample = samples[index];
        const buffer = clipSampleByFrames(audioBuffer, clip.start, clip.length);
        sample.drumTypes.forEach((drum) => {
          drumBuffers.set(drum, buffer);
        });
      }
    });
  }

  loadDrumKit(audioContext: BaseAudioContext, drumKitId: number) {
    if (!this.drumKitBuffers.has(drumKitId)) {
      const drumKit = DRUM_KITS.find(({ id }) => id === drumKitId)!;

      fetch(drumKit.url).then(
        (response) => {
          response
            .arrayBuffer()
            .then((arrayBuffer) => audioContext.decodeAudioData(arrayBuffer))
            .then((decodedAudioData) => this.handleDrumKitLoaded(drumKit, decodedAudioData))
            .catch((reason) => {
              // Handle error from processing data
              this.logger.log(
                'error',
                `Failed to load drum kit samples for "${drumKit.name}": ${reason}.`,
              );
              enqueueSnackbar('Failed to load drum kit.', { variant: 'error' });
            });
        },
        (reason) => {
          // Handle error from fetching data
          this.logger.log(
            'error',
            `Failed to load drum kit samples for "${drumKit.name}": ${reason}.`,
          );
          enqueueSnackbar(
            'Failed to load drum kit, please check your internet connection and try again.',
            { variant: 'error' },
          );
        },
      );
    }
  }

  play(audioContext: BaseAudioContext, drumKitId: number, drum: DrumType, scheduleTime: number) {
    const drumBuffers = this.drumKitBuffers.get(drumKitId);
    if (!drumBuffers) {
      return;
    }

    const drumBuffer = drumBuffers.get(drum);
    if (!drumBuffer) {
      this.logger.log('warning', `Missing sample for drum: "${DrumType[drum]}".`);
      return;
    }

    const bufferSource = new AudioBufferSourceNode(audioContext, { buffer: drumBuffer });
    bufferSource.connect(audioContext.destination);
    bufferSource.start(scheduleTime);
  }
}
