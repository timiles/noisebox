export type Note = {
  startTime: number;
  frequency: number;
  duration: number;
  /**
   * `waves` is `frequency * duration`.
   */
  waves: number;
};
