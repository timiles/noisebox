export type Sample = {
  id: string;
  name: string;
  audioBuffer: AudioBuffer;
  frequency: number;
  /**
   * `waves` is `frequency * duration`.
   */
  waves: number;
};
