/* eslint-disable import/prefer-default-export */
import { calculateFrequency } from 'utils/frequencyUtils';
import WorkerPool from 'workerpool';

type WorkerPoolFunction<T extends (...args: any) => any> = (
  ...args: Parameters<T>
) => WorkerPool.Promise<ReturnType<T>>;

interface MyWorkerPool extends WorkerPool.WorkerPool {
  calculateFrequency: WorkerPoolFunction<typeof calculateFrequency>;
}

/**
 * A worker pool of functions specified in `registerWorkerFunctions.ts`.
 * When changing these worker functions, rebuild the bundle file using `npm run build-workers`.
 */
export function getWorkerPool(): MyWorkerPool {
  const pool = WorkerPool.pool('./worker.bundle.js') as MyWorkerPool;
  pool.calculateFrequency = (...args) => pool.exec(calculateFrequency.name, args);
  return pool;
}
