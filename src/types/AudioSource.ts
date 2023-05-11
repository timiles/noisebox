export type AudioSource = {
  id: string;
  name: string;
  rawData: ArrayBuffer;
  contentType: string;
  audioBuffer: AudioBuffer;
  samples: Array<AudioSourceSample>;
};

export type AudioSourceSample = {
  id: string;
  name: string;
  startTime: number;
  duration: number;
  audioBuffer: AudioBuffer;
  frequency: number | null;
};
