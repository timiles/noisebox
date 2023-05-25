import { Button, Stack, Tooltip, Typography } from '@mui/material';
import { useAudioContext } from 'AudioContextProvider';
import ControlContainer from 'components/ControlContainer';
import { AudioSourceSample } from 'types/AudioSource';
import { playAudioBuffer } from 'utils/playUtils';
import FrequencyControl from './FrequencyControl';

interface IProps {
  samples: AudioSourceSample[];
  onChangeSampleFrequency: (sampleId: string, frequency: number | null) => void;
}

export default function SamplesList(props: IProps) {
  const { samples, onChangeSampleFrequency } = props;

  const audioContext = useAudioContext();

  if (samples.length === 0) {
    return null;
  }

  const handlePlaySample = (audioBuffer: AudioBuffer) => {
    playAudioBuffer(audioContext, audioBuffer);
  };

  return (
    <>
      {samples.map(({ id, name, duration, frequency, audioBuffer }) => (
        <ControlContainer key={id}>
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
            <Typography component="h3" variant="h6">
              {name}
            </Typography>
            <Button variant="outlined" size="small" onClick={() => handlePlaySample(audioBuffer)}>
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
            onChangeFrequency={(nextFrequency) => onChangeSampleFrequency(id, nextFrequency)}
          />
        </ControlContainer>
      ))}
    </>
  );
}
