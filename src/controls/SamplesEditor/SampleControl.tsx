import { Button, Stack, Tooltip, Typography } from '@mui/material';
import { useAudioContext } from 'AudioContextProvider';
import ControlContainer from 'components/ControlContainer';
import { AudioSourceSample } from 'types/AudioSource';
import { playAudioBuffer } from 'utils/playUtils';
import FrequencyControl from './FrequencyControl';

interface IProps {
  sample: AudioSourceSample;
  onChangeSampleFrequency: (sampleId: string, frequency: number | null) => void;
}

export default function SampleControl(props: IProps) {
  const { sample, onChangeSampleFrequency } = props;
  const { id, name, duration, frequency, audioBuffer } = sample;

  const audioContext = useAudioContext();

  const handlePlaySample = () => {
    playAudioBuffer(audioContext, audioBuffer);
  };

  const handleChangeSampleFrequency = (nextFrequency: number | null) => {
    onChangeSampleFrequency(id, nextFrequency);
  };

  return (
    <ControlContainer>
      <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
        <Typography component="h3" variant="h6">
          {name}
        </Typography>
        <Button variant="outlined" size="small" onClick={handlePlaySample}>
          Play
        </Button>
      </Stack>
      <Typography>
        Duration:{' '}
        <Tooltip title={`${duration} seconds`} placement="top" arrow>
          <span>{`${duration.toFixed(2)}s`}</span>
        </Tooltip>
      </Typography>
      <FrequencyControl
        sampleName={name}
        audioBuffer={audioBuffer}
        frequency={frequency}
        duration={duration}
        onChangeFrequency={handleChangeSampleFrequency}
      />
    </ControlContainer>
  );
}
