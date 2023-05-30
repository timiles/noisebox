import { ILogger } from 'LoggerProvider';
import { DRUM_KITS, DrumKit } from 'data/DRUM_KITS';
import { enqueueSnackbar } from 'notistack';
import { DrumBeat } from 'types/DrumBeat';
import { DrumType } from 'types/DrumType';
import { Note } from 'types/Note';
import { Sample } from 'types/Sample';
import { Track } from 'types/Track';
import { distinct, isArrayNotEmpty } from './arrayUtils';
import { clipSampleByFrames, getClipsFromAudioBuffer, stretchAudioBuffer } from './sampleUtils';
import { isDrumTrack, isInstrumentTrack } from './trackUtils';

enum PlayMode {
  NoTracksLoaded,
  Playing,
  Paused,
  Stopped,
}

class MultiTrackPlayer {
  /**
   * This should be enough time to allow all notes / drum beats in the interval to be queued,
   * but also small enough to respond quickly when pausing or stopping the playback.
   */
  private static readonly SCHEDULE_NEXT_INTERVAL_DURATION = 0.2;

  private playMode = PlayMode.NoTracksLoaded;

  /**
   * The value of `audioContext.currentTime` corresponding to a `trackTime` of zero.
   */
  private playStartTime = 0;

  /**
   * Current time since the start of the track.
   */
  private trackTime = 0;

  /**
   * Track time of next interval of notes / drum beats to be scheduled.
   */
  private scheduleTrackTime = 0;

  /**
   * Max time it takes to schedule an interval of notes / drum beats, useful for preventing drift.
   */
  private scheduleNextLeadTime = 0;

  /**
   * All the playable tracks, ie each has a drum kit or sample selected.
   */
  private tracks: Array<Track> | undefined;

  /**
   * Mapping of `sampleId` => `stretchFactor` => `AudioBuffer`.
   */
  private sampleStretchedBuffers = new Map<string, Map<number, AudioBuffer>>();

  /**
   * Mapping of `drumKitId` => `drum` => `AudioBuffer`.
   */
  private drumKitBuffers = new Map<number, Map<DrumType, AudioBuffer>>();

  /**
   * `timeoutId` of the next execution of `scheduleNext()`
   */
  private scheduleNextTimeoutId: NodeJS.Timer | undefined;

  constructor(private audioContext: AudioContext, private logger: ILogger) {}

  onChangePlayMode: ((playMode: PlayMode) => void) | undefined;

  onChangeTrackTime: ((trackTime: number) => void) | undefined;

  private setPlayMode(nextPlayMode: PlayMode) {
    this.playMode = nextPlayMode;
    if (this.onChangePlayMode) {
      this.onChangePlayMode(this.playMode);
    }
  }

  private setTrackTime(nextTrackTime: number) {
    this.trackTime = nextTrackTime;
    if (this.onChangeTrackTime) {
      this.onChangeTrackTime(nextTrackTime);
    }
  }

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

  private loadDrumKit(drumKitId: number) {
    if (!this.drumKitBuffers.has(drumKitId)) {
      const drumKit = DRUM_KITS.find(({ id }) => id === drumKitId)!;

      fetch(drumKit.url).then(
        (response) => {
          response
            .arrayBuffer()
            .then((arrayBuffer) => this.audioContext.decodeAudioData(arrayBuffer))
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

  private loadSamples(notesWaves: Array<number>, sample: Sample) {
    if (!this.sampleStretchedBuffers.has(sample.id)) {
      this.sampleStretchedBuffers.set(sample.id, new Map<number, AudioBuffer>());
    }
    const stretchedBuffers = this.sampleStretchedBuffers.get(sample.id)!;

    notesWaves.forEach((noteWaves) => {
      const stretchFactor = noteWaves / sample.waves;
      // Check if sample has already been stretched
      if (!stretchedBuffers.has(stretchFactor)) {
        const stretchedBuffer = stretchAudioBuffer(sample.audioBuffer, stretchFactor);
        stretchedBuffers.set(stretchFactor, stretchedBuffer);
      }
    });
  }

  setTracks(tracks: Array<Track>) {
    this.tracks = tracks.filter(
      (track) =>
        (isDrumTrack(track) && track.drumKitId !== undefined) ||
        (isInstrumentTrack(track) && track.sample !== undefined),
    );

    this.tracks.forEach((track) => {
      if (isDrumTrack(track)) {
        const { drumKitId } = track;
        if (drumKitId) {
          this.loadDrumKit(drumKitId);
        }
      } else if (isInstrumentTrack(track)) {
        const { notes, sample } = track;
        if (sample) {
          const notesWaves = notes.map((note) => note.waves).filter(distinct);
          this.loadSamples(notesWaves, sample);
        }
      }
    });

    if (this.playMode === PlayMode.NoTracksLoaded && isArrayNotEmpty(this.tracks)) {
      this.setPlayMode(PlayMode.Stopped);
    }
  }

  private scheduleDrumBeats(drumBeats: Array<DrumBeat>, drumKitId: number) {
    drumBeats.forEach((drumBeat) => {
      const drumBuffers = this.drumKitBuffers.get(drumKitId);
      if (!drumBuffers) {
        return;
      }

      const drumBuffer = drumBuffers.get(drumBeat.drum);
      if (!drumBuffer) {
        this.logger.log('warning', `Missing sample for drum: "${DrumType[drumBeat.drum]}".`);
        return;
      }

      const scheduleTime = this.playStartTime + drumBeat.startTime;
      const bufferSource = new AudioBufferSourceNode(this.audioContext, { buffer: drumBuffer });
      bufferSource.connect(this.audioContext.destination);
      bufferSource.start(scheduleTime);
    });
  }

  private scheduleNotes(notes: Array<Note>, sample: Sample) {
    if (!sample) {
      // Ignore tracks that don't have a sample selected
      return;
    }

    const stretchedBuffers = this.sampleStretchedBuffers.get(sample.id);

    if (!stretchedBuffers) {
      // Might not be processed yet
      return;
    }

    notes.forEach((note) => {
      const stretchFactor = note.waves / sample.waves;
      const stretchedBuffer = stretchedBuffers.get(stretchFactor);
      if (!stretchedBuffer) {
        // Might not be processed yet
        return;
      }

      const scheduleTime = this.playStartTime + note.startTime;
      const bufferSource = new AudioBufferSourceNode(this.audioContext, {
        buffer: stretchedBuffer,
        playbackRate: note.frequency / sample.frequency,
      });
      bufferSource.connect(this.audioContext.destination);
      bufferSource.start(scheduleTime);
    });
  }

  private scheduleNext() {
    const scheduleNextStarted = this.audioContext.currentTime;

    if (!isArrayNotEmpty(this.tracks)) {
      // Throw error as this shouldn't be possible.
      throw new Error('No tracks to play.');
    }

    // Use this loop to keep `trackTime` in sync
    this.setTrackTime(this.audioContext.currentTime - this.playStartTime);

    const endTime = this.scheduleTrackTime + MultiTrackPlayer.SCHEDULE_NEXT_INTERVAL_DURATION;

    this.tracks.forEach((track) => {
      if (track.mute) {
        return;
      }

      if (isDrumTrack(track)) {
        const { drumBeats, drumKitId } = track;
        if (drumKitId) {
          const drumBeatsToSchedule = drumBeats.filter(
            ({ startTime }) => startTime >= this.scheduleTrackTime && startTime < endTime,
          );
          this.scheduleDrumBeats(drumBeatsToSchedule, drumKitId);
        }
      } else if (isInstrumentTrack(track)) {
        const { notes, sample } = track;
        if (sample) {
          const notesToSchedule = notes.filter(
            ({ startTime }) => startTime >= this.scheduleTrackTime && startTime < endTime,
          );
          this.scheduleNotes(notesToSchedule, sample);
        }
      }
    });

    // Check how long schedule function is taking, in case we need to reduce timeout delay
    const leadTime = this.audioContext.currentTime - scheduleNextStarted;
    if (leadTime > 0 && leadTime > this.scheduleNextLeadTime) {
      this.scheduleNextLeadTime = leadTime;
      this.logger.log('info', `ScheduleNext lead time increased: ${this.scheduleNextLeadTime}`);
    }

    if (this.playMode === PlayMode.Playing) {
      // Set next schedule's track time to the current end time
      this.scheduleTrackTime = endTime;
      // Now we delay until just before the track time will become the next schedule's track time
      const delay = this.scheduleTrackTime - this.trackTime - this.scheduleNextLeadTime;
      this.scheduleNextTimeoutId = setTimeout(this.scheduleNext.bind(this), delay * 1000);
    }
  }

  play() {
    if (!isArrayNotEmpty(this.tracks)) {
      throw new Error('No tracks can be played.');
    }

    // `trackTime` could be non-zero if playback was previously paused
    this.playStartTime = this.audioContext.currentTime - this.trackTime;

    this.setPlayMode(PlayMode.Playing);

    this.scheduleNext();
  }

  private stopPlaying(nextPlayMode: PlayMode) {
    if (this.scheduleNextTimeoutId) {
      clearTimeout(this.scheduleNextTimeoutId);
    }

    this.setPlayMode(nextPlayMode);
  }

  pause() {
    this.stopPlaying(PlayMode.Paused);
  }

  stop() {
    this.stopPlaying(PlayMode.Stopped);

    // Also reset track time and scheduler
    this.setTrackTime(0);
    this.scheduleTrackTime = 0;
  }
}

export default MultiTrackPlayer;
export { PlayMode };
