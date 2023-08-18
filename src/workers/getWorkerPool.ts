/* eslint-disable import/prefer-default-export */
import WorkerPool from 'workerpool';

type WorkerPoolFunction<T extends (...args: any) => any> = (
  ...args: Parameters<T>
) => WorkerPool.Promise<ReturnType<T>>;

// NOTE: Don't reference the functions directly, otherwise they'll be included in the app build
interface MyWorkerPool extends WorkerPool.WorkerPool {
  calculateFrequency: WorkerPoolFunction<
    (channelDataArrays: Array<Float32Array>, sampleRate: number) => number
  >;
  encodeBufferToWav: WorkerPoolFunction<
    (channelDataArrays: ReadonlyArray<Float32Array>, sampleRate: number) => Blob
  >;
  stretchAudioBuffer: WorkerPoolFunction<
    (
      channelDataArrays: ReadonlyArray<Float32Array>,
      sampleRate: number,
      stretchFactor: number,
    ) => ReadonlyArray<Float32Array>
  >;
}

/**
 * A worker pool of functions specified in `registerWorkerFunctions.ts`.
 * When changing these worker functions, rebuild the bundle file using `npm run build-workers`.
 */
export function getWorkerPool(): MyWorkerPool {
  const pool = WorkerPool.pool('./worker.bundle.js') as MyWorkerPool;
  pool.calculateFrequency = (...args) => pool.exec('calculateFrequency', args);
  pool.encodeBufferToWav = (...args) => pool.exec('encodeBufferToWav', args);
  pool.stretchAudioBuffer = (...args) => pool.exec('stretchAudioBuffer', args);
  return pool;
}
