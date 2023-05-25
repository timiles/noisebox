import { Button, CircularProgress, Stack, Tooltip } from '@mui/material';
import { useAudioContext } from 'AudioContextProvider';
import { useLogger } from 'LoggerProvider';
import { enqueueSnackbar } from 'notistack';
import { useEffect } from 'react';
import {
  calculateFrequency,
  getMidiNoteFromFrequency,
  getPitchFromMidiNote,
} from 'utils/frequencyUtils';
import { playFrequency } from 'utils/playUtils';
import { getChannelDataArrays } from 'utils/sampleUtils';
import WorkerPool from 'workerpool';

interface IProps {
  sampleName: string;
  audioBuffer: AudioBuffer;
  frequency: undefined | null | number;
  duration: number;
  onChangeFrequency: (frequency: number | null) => void;
}

export default function FrequencyControl(props: IProps) {
  const { sampleName, audioBuffer, frequency, duration, onChangeFrequency } = props;

  const audioContext = useAudioContext();
  const { log } = useLogger();

  useEffect(() => {
    if (frequency === undefined) {
      const channelDataArrays = getChannelDataArrays(audioBuffer);

      const pool = WorkerPool.pool();
      pool
        .exec(calculateFrequency, [channelDataArrays, audioBuffer.sampleRate])
        .then((nextFrequency) => {
          onChangeFrequency(nextFrequency);
        })
        .catch((reason) => {
          const message = `Unable to detect frequency for "${sampleName}".`;
          log('error', `${message} ${reason}`);
          enqueueSnackbar(message, { variant: 'error' });
          onChangeFrequency(null);
        })
        .then(() => {
          pool.terminate();
        });
    }
  }, [frequency]);

  if (frequency === undefined) {
    return <CircularProgress size="1rem" />;
  }

  if (frequency === null) {
    return <span>Unable to detect frequency.</span>;
  }

  const handlePlayFrequency = () => {
    playFrequency(audioContext, frequency, duration);
  };

  const midiNote = getMidiNoteFromFrequency(frequency);

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={2}
      alignItems={{ xs: 'flex-start', sm: 'center' }}
    >
      <Tooltip title={`${frequency} hertz, MIDI note: ${midiNote}`} placement="top" arrow>
        <span>{`${frequency.toFixed(2)} Hz (${getPitchFromMidiNote(midiNote)})`}</span>
      </Tooltip>
      <Button variant="outlined" size="small" onClick={handlePlayFrequency}>
        Test
      </Button>
    </Stack>
  );
}
