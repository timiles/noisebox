import { Button, Stack, Tooltip } from '@mui/material';
import { useAudioContext } from 'AudioContextProvider';
import { getMidiNoteFromFrequency, getPitchFromMidiNote } from 'utils/frequencyUtils';
import { playFrequency } from 'utils/playUtils';

interface IProps {
  frequency: number | null;
  duration: number;
}

export default function FrequencyControl(props: IProps) {
  const { frequency, duration } = props;

  const audioContext = useAudioContext();

  if (!frequency) {
    return <p>Unable to detect frequency.</p>;
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
