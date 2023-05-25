import {
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from '@mui/material';
import { useAudioContext } from 'AudioContextProvider';
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

  const handlePlaySample = (audioBuffer: AudioBuffer) => {
    playAudioBuffer(audioContext, audioBuffer);
  };

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Duration</TableCell>
            <TableCell>Frequency</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {samples.map(({ id, name, duration, frequency, audioBuffer }) => (
            <TableRow key={id}>
              <TableCell>{name}</TableCell>
              <TableCell>
                <Tooltip title={`${duration} seconds`} placement="top" arrow>
                  <span>{`${duration.toFixed(2)}s`}</span>
                </Tooltip>
              </TableCell>
              <TableCell>
                <FrequencyControl
                  sampleName={name}
                  audioBuffer={audioBuffer}
                  frequency={frequency}
                  duration={duration}
                  onChangeFrequency={(nextFrequency) => onChangeSampleFrequency(id, nextFrequency)}
                />
              </TableCell>
              <TableCell>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handlePlaySample(audioBuffer)}
                >
                  Play sample
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
