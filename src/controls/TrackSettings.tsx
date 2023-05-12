import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Typography,
} from '@mui/material';
import ControlContainer from 'components/ControlContainer';
import { useState } from 'react';
import { Sample } from 'types/Sample';
import { Track } from 'types/Track';

interface IProps {
  track: Track;
  samples: Array<Sample>;
  onChange: (track: Track) => void;
}

function TrackSettings(props: IProps) {
  const { track, samples, onChange } = props;

  const [selectedSample, setSelectedSample] = useState<Sample>();

  const handleChangeSample = (event: SelectChangeEvent<string>) => {
    const nextSelectedSample = samples.find(({ id }) => id === event.target.value);
    setSelectedSample(nextSelectedSample);

    onChange({ ...track, sample: nextSelectedSample });
  };

  const selectLabelId = `${track.id}-select-label`;

  return (
    <ControlContainer>
      <Typography component="h2" variant="h6" mb={1}>
        {`${track.name} (${track.instrument})`}
      </Typography>
      {samples.length > 0 ? (
        <FormControl fullWidth>
          <InputLabel id={selectLabelId}>Sample</InputLabel>
          <Select
            labelId={selectLabelId}
            value={selectedSample?.id ?? ''}
            label="Sample"
            onChange={handleChangeSample}
          >
            {samples.map((sample) => (
              <MenuItem key={sample.id} value={sample.id}>
                {sample.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      ) : (
        <Typography>Please create some audio samples to get started.</Typography>
      )}
    </ControlContainer>
  );
}

export default TrackSettings;
