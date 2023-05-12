import { Sample } from 'types/Sample';
import { Track } from 'types/Track';
import { distinct, isArrayNotEmpty } from './arrayUtils';
import { stretchAudioBuffer } from './sampleUtils';

enum PlayMode {
  NoTracksLoaded,
  Playing,
  Paused,
  Stopped,
}

class MultiTrackPlayer {
  /**
   * This should be enough time to allow all notes in the interval to be queued,
   * but also small enough to respond quickly when pausing or stopping the playback.
   */
  private static readonly SCHEDULE_NOTES_INTERVAL_DURATION = 0.2;

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
   * Track time of next interval of notes to be scheduled.
   */
  private scheduleTrackTime = 0;

  /**
   * Max time it takes to schedule an interval of notes, useful for preventing drift.
   */
  private scheduleNotesLeadTime = 0;

  /**
   * All the playable tracks, ie each has a sample selected.
   */
  private tracks: Array<Track> | undefined;

  /**
   * Mapping of `sampleId` => `stretchFactor` => `AudioBuffer`.
   */
  private sampleStretchedBuffers = new Map<string, Map<number, AudioBuffer>>();

  /**
   * `timeoutId` of the next execution of `scheduleNotes()`
   */
  private scheduleNotesTimeoutId: NodeJS.Timer | undefined;

  constructor(private audioContext: AudioContext) {}

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
    this.tracks = tracks.filter((track) => track.sample);

    this.tracks.forEach(({ notes, sample }) => {
      if (sample) {
        const notesWaves = notes.map((note) => note.waves).filter(distinct);
        this.loadSamples(notesWaves, sample);
      }
    });

    if (this.playMode === PlayMode.NoTracksLoaded && isArrayNotEmpty(this.tracks)) {
      this.setPlayMode(PlayMode.Stopped);
    }
  }

  private scheduleNotes() {
    const scheduleNotesStarted = this.audioContext.currentTime;

    if (!isArrayNotEmpty(this.tracks)) {
      // Throw error as this shouldn't be possible.
      throw new Error('No tracks to play.');
    }

    // Use this loop to keep `trackTime` in sync
    this.setTrackTime(this.audioContext.currentTime - this.playStartTime);

    const endTime = this.scheduleTrackTime + MultiTrackPlayer.SCHEDULE_NOTES_INTERVAL_DURATION;

    this.tracks.forEach(({ notes, sample }) => {
      if (!sample) {
        // Ignore tracks that don't have a sample selected
        return;
      }

      const stretchedBuffers = this.sampleStretchedBuffers.get(sample.id);

      if (!stretchedBuffers) {
        // Might not be processed yet
        return;
      }

      notes
        .filter(({ startTime }) => startTime >= this.scheduleTrackTime && startTime < endTime)
        .forEach((note) => {
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
    });

    // Check how long schedule function is taking, in case we need to reduce timeout delay
    const leadTime = this.audioContext.currentTime - scheduleNotesStarted;
    if (leadTime > 0 && leadTime > this.scheduleNotesLeadTime) {
      this.scheduleNotesLeadTime = leadTime;
      console.info('Schedule notes lead time increased:', this.scheduleNotesLeadTime);
    }

    if (this.playMode === PlayMode.Playing) {
      // Set next schedule's track time to the current end time
      this.scheduleTrackTime = endTime;
      // Now we delay until just before the track time will become the next schedule's track time
      const delay = this.scheduleTrackTime - this.trackTime - this.scheduleNotesLeadTime;
      this.scheduleNotesTimeoutId = setTimeout(this.scheduleNotes.bind(this), delay * 1000);
    }
  }

  play() {
    if (!isArrayNotEmpty(this.tracks)) {
      console.error('Please create a track with a sample.');
      return;
    }

    // `trackTime` could be non-zero if playback was previously paused
    this.playStartTime = this.audioContext.currentTime - this.trackTime;

    this.setPlayMode(PlayMode.Playing);

    this.scheduleNotes();
  }

  private stopPlaying(nextPlayMode: PlayMode) {
    if (this.scheduleNotesTimeoutId) {
      clearTimeout(this.scheduleNotesTimeoutId);
    }

    this.setPlayMode(nextPlayMode);
  }

  pause() {
    this.stopPlaying(PlayMode.Paused);
  }

  stop() {
    this.stopPlaying(PlayMode.Stopped);

    // Also reset track time and note scheduler
    this.setTrackTime(0);
    this.scheduleTrackTime = 0;
  }
}

export default MultiTrackPlayer;
export { PlayMode };
