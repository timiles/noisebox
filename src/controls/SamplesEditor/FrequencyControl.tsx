import { Button, CircularProgress, Stack, Tooltip } from '@mui/material';
import { useAudioContext } from 'AudioContextProvider';
import { useLogger } from 'LoggerProvider';
import { enqueueSnackbar } from 'notistack';
import { useEffect } from 'react';
import { getMidiNoteFromFrequency, getPitchFromMidiNote } from 'utils/frequencyUtils';
import { playFrequency } from 'utils/playUtils';
import { getChannelDataArrays } from 'utils/sampleUtils';
import { getWorkerPool } from 'workers/getWorkerPool';

function FrequencyValue(props: { frequency: undefined | null | number }) {
  const { frequency } = props;

  if (frequency === undefined) {
    return <CircularProgress size="1rem" />;
  }

  if (frequency === null) {
    return <span>unable to detect</span>;
  }

  const midiNote = getMidiNoteFromFrequency(frequency);

  return (
    <Tooltip title={`${frequency} hertz, MIDI note: ${midiNote}`} placement="top" arrow>
      <span>{`${frequency.toFixed(2)} Hz (${getPitchFromMidiNote(midiNote)})`}</span>
    </Tooltip>
  );
}

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

      const pool = getWorkerPool();
      pool
        .calculateFrequency(channelDataArrays, audioBuffer.sampleRate)
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

  const handlePlayFrequency = () => {
    if (frequency) {
      playFrequency(audioContext, frequency, duration);
    }
  };

  return (
    <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
      <Stack direction="row" spacing={1} alignItems="center">
        <span>Frequency:</span>
        <FrequencyValue frequency={frequency} />
      </Stack>
      <Button
        variant="outlined"
        size="small"
        onClick={handlePlayFrequency}
        disabled={frequency == null}
      >
        Test
      </Button>
    </Stack>
  );
}
