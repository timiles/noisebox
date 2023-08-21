import { calculateFrequency } from 'utils/frequencyUtils';
import { encodeBufferToMp3 } from 'utils/mp3Utils';
import { stretchAudioBuffer } from 'utils/sampleUtils';
import { encodeBufferToWav } from 'utils/wavUtils';
import WorkerPool from 'workerpool';

// Create a worker and register public functions
WorkerPool.worker({ calculateFrequency, encodeBufferToMp3, encodeBufferToWav, stretchAudioBuffer });
