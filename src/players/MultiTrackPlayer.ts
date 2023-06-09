import { ILogger } from 'LoggerProvider';
import { Track } from 'types/Track';
import { isArrayNotEmpty } from 'utils/arrayUtils';
import { isDrumTrack, isInstrumentTrack } from 'utils/trackUtils';
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
  private tracks: Array<Track> | undefined;

  /**
   * `timeoutId` of the next execution of `scheduleNext()`
   */
  private scheduleNextTimeoutId: NodeJS.Timer | undefined;

  constructor(
    private audioContext: AudioContext,
    private logger: ILogger,
    private drumPlayer: DrumPlayer,
    private samplePlayer: SamplePlayer,
  ) {}

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
          this.drumPlayer.loadDrumKit(drumKitId);
        }
      } else if (isInstrumentTrack(track)) {
        const { notes, sample } = track;
        if (sample) {
          this.samplePlayer.prepareSampleForNotes(sample, notes);
        }
      }
    });

    if (this.playMode === PlayMode.NoTracksLoaded && isArrayNotEmpty(this.tracks)) {
      this.setPlayMode(PlayMode.Stopped);
    }
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
          drumBeats
            .filter(({ startTime }) => startTime >= this.scheduleTrackTime && startTime < endTime)
            .forEach((drumBeat) => {
              this.drumPlayer.play(
                drumKitId,
                drumBeat.drum,
                this.playStartTime + drumBeat.startTime,
              );
            });
        }
      } else if (isInstrumentTrack(track)) {
        const { notes, sample } = track;
        if (sample) {
          notes
            .filter(({ startTime }) => startTime >= this.scheduleTrackTime && startTime < endTime)
            .forEach((note) => {
              this.samplePlayer.play(
                sample.id,
                note.frequency,
                note.duration,
                this.playStartTime + note.startTime,
              );
            });
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
