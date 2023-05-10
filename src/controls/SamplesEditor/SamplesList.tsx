import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from '@mui/material';
import { AudioSourceSample } from 'types/AudioSource';

interface IProps {
  samples: AudioSourceSample[];
}

function SamplesList(props: IProps) {
  const { samples } = props;

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Duration</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {samples.map(({ id, name, duration }) => (
            <TableRow key={id}>
              <TableCell>{name}</TableCell>
              <TableCell>
                <Tooltip title={`${duration} seconds`} placement="top" arrow>
                  <span>{`${duration.toFixed(2)}s`}</span>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default SamplesList;
