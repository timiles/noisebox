import {
  Box,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { Sample } from 'types/Sample';

interface IProps {
  id: string;
  samples: Array<Sample>;
  onChange: (sample: Sample) => void;
  isLoading: boolean;
}

export default function SelectSampleControl(props: IProps) {
  const { id, samples, onChange, isLoading } = props;

  const [selectedSampleId, setSelectedSampleId] = useState<string>('');

  if (samples.length === 0) {
    return <Typography>Please create some audio samples to get started.</Typography>;
  }

  const handleChangeSample = (event: SelectChangeEvent<string>) => {
    const nextSelectedSampleId = event.target.value;
    setSelectedSampleId(nextSelectedSampleId);

    const nextSelectedSample = samples.find((sample) => sample.id === nextSelectedSampleId)!;
    onChange(nextSelectedSample);
  };

  const selectLabelId = `${id}-select-sample-label`;

  return (
    <FormControl fullWidth>
      <InputLabel id={selectLabelId}>Sample</InputLabel>
      <Select
        labelId={selectLabelId}
        value={selectedSampleId}
        label="Sample"
        onChange={handleChangeSample}
      >
        {samples.map((sample) => (
          <MenuItem key={sample.id} value={sample.id}>
            <Box display="flex" alignItems="center">
              {sample.name}
              {isLoading && sample.id === selectedSampleId && (
                <CircularProgress size="1rem" sx={{ marginLeft: 1 }} />
              )}
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
