import { calculateFrequency } from 'utils/frequencyUtils';
import { stretchAudioBuffer } from 'utils/sampleUtils';
import { encodeBufferToWav } from 'utils/wavUtils';
import WorkerPool from 'workerpool';

// Create a worker and register public functions
WorkerPool.worker({ calculateFrequency, encodeBufferToWav, stretchAudioBuffer });
