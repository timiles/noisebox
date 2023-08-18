import { ILogger } from 'LoggerProvider';
import { Track, TrackType } from 'types/Track';
import DrumPlayer from './DrumPlayer';
import SamplePlayer from './SamplePlayer';

export enum PlayMode {
  NoTracksLoaded,
  Playing,
  Paused,
  Stopped,
}

export default class MultiTrackPlayer {
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
  private tracks: Map<string, Track>;

  /**
   * `timeoutId` of the next execution of `scheduleNext()`
   */
  private scheduleNextTimeoutId: NodeJS.Timer | undefined;

  constructor(
    private audioContext: AudioContext,
    private logger: ILogger,
    private drumPlayer: DrumPlayer,
    private samplePlayer: SamplePlayer,
  ) {
    this.tracks = new Map<string, Track>();
  }

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

  setTrack(track: Track): Promise<void> {
    return new Promise((resolve) => {
      if (
        (track.type === TrackType.Drum && track.drumKitId === undefined) ||
        (track.type === TrackType.Instrument && track.sample === undefined)
      ) {
        this.tracks.delete(track.id);
        resolve();
        return;
      }

      this.tracks.set(track.id, track);

      switch (track.type) {
        case TrackType.Drum: {
          const { drumKitId } = track;
          if (drumKitId) {
            this.drumPlayer.loadDrumKit(this.audioContext, drumKitId);
            resolve();
          }
          break;
        }
        case TrackType.Instrument: {
          const { notes, sample } = track;
          if (sample) {
            this.samplePlayer.prepareSampleForNotes(sample, notes).then(resolve);
          }
          break;
        }
        default: {
          const exhaustiveCheck: never = track;
          throw new Error(`Unknown TrackType.`);
        }
      }

      if (this.playMode === PlayMode.NoTracksLoaded && this.tracks.size > 0) {
        this.setPlayMode(PlayMode.Stopped);
      }
    });
  }

  private scheduleNext() {
    const scheduleNextStarted = this.audioContext.currentTime;

    if (this.tracks.size === 0) {
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

      switch (track.type) {
        case TrackType.Drum: {
          const { drumBeats, drumKitId } = track;
          if (drumKitId) {
            drumBeats
              .filter(({ startTime }) => startTime >= this.scheduleTrackTime && startTime < endTime)
              .forEach((drumBeat) => {
                this.drumPlayer.play(
                  this.audioContext,
                  drumKitId,
                  drumBeat.drum,
                  this.playStartTime + drumBeat.startTime,
                );
              });
          }
          break;
        }
        case TrackType.Instrument: {
          const { notes, sample } = track;
          if (sample) {
            notes
              .filter(({ startTime }) => startTime >= this.scheduleTrackTime && startTime < endTime)
              .forEach((note) => {
                this.samplePlayer.play(
                  this.audioContext,
                  sample.id,
                  note.frequency,
                  note.duration,
                  this.playStartTime + note.startTime,
                );
              });
          }
          break;
        }
        default: {
          const exhaustiveCheck: never = track;
          throw new Error(`Unknown TrackType.`);
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
    if (this.tracks.size === 0) {
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

  renderToAudioBuffer(): Promise<AudioBuffer> {
    return new Promise<AudioBuffer>((resolve, reject) => {
      const playableTracks = Array.from(this.tracks)
        .map(([, track]) => track)
        .filter((track) => !track.mute);

      if (playableTracks.length === 0) {
        reject(new Error('No tracks can be played.'));
        return;
      }

      const maxTrackLength = Math.max(
        ...playableTracks.flatMap((track) =>
          track.type === TrackType.Instrument
            ? track.notes.map((note) => note.startTime + note.duration)
            : // For performance, assume that max drum beat sample duration is 2 seconds
              track.drumBeats.map((drumBeat) => drumBeat.startTime + 2),
        ),
      );

      const offlineAudioContext = new OfflineAudioContext({
        numberOfChannels: 2,
        length: this.audioContext.sampleRate * maxTrackLength,
        sampleRate: this.audioContext.sampleRate,
      });

      playableTracks.forEach((track) => {
        switch (track.type) {
          case TrackType.Drum: {
            const { drumBeats, drumKitId } = track;
            if (drumKitId) {
              drumBeats.forEach((drumBeat) => {
                this.drumPlayer.play(
                  offlineAudioContext,
                  drumKitId,
                  drumBeat.drum,
                  drumBeat.startTime,
                );
              });
            }
            break;
          }
          case TrackType.Instrument: {
            const { notes, sample } = track;
            if (sample) {
              notes.forEach((note) => {
                this.samplePlayer.play(
                  offlineAudioContext,
                  sample.id,
                  note.frequency,
                  note.duration,
                  note.startTime,
                );
              });
            }
            break;
          }
          default: {
            const exhaustiveCheck: never = track;
            throw new Error(`Unknown TrackType.`);
          }
        }
      });

      offlineAudioContext
        .startRendering()
        .then((renderedBuffer) => {
          resolve(renderedBuffer);
        })
        .catch((error) => {
          reject(new Error(`Rendering failed: ${error}`));
        });
    });
  }
}
