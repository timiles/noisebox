import { calculateFrequency } from 'utils/frequencyUtils';
import WorkerPool from 'workerpool';

// Create a worker and register public functions
WorkerPool.worker({ calculateFrequency });
