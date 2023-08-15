import { Checkbox, FormControlLabel, Stack, Typography } from '@mui/material';
import ControlContainer from 'components/ControlContainer';
import { Sample } from 'types/Sample';
import { Track, TrackType } from 'types/Track';
import SelectDrumKitControl from './SelectDrumKitControl';
import SelectSampleControl from './SelectSampleControl';

interface IProps {
  track: Track;
  samples: Array<Sample>;
  onChange: (track: Track) => void;
}

export default function TrackSettings(props: IProps) {
  const { track, samples, onChange } = props;

  const handleChangeDrumKit = (nextDrumKitId: number) => {
    onChange({ ...track, drumKitId: nextDrumKitId } as Track);
  };

  const handleChangeSample = (nextSample: Sample) => {
    onChange({ ...track, sample: nextSample, isLoading: true } as Track);
  };

  const handleChangeMute = (e: React.SyntheticEvent, checked: boolean) => {
    onChange({ ...track, mute: checked });
  };

  return (
    <ControlContainer>
      <Typography component="h2" variant="h6" mb={1}>
        {track.instrument}
      </Typography>
      <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
        {track.type === TrackType.Drum && (
          <SelectDrumKitControl id={track.id} onChange={handleChangeDrumKit} />
        )}
        {track.type === TrackType.Instrument && (
          <SelectSampleControl
            id={track.id}
            samples={samples}
            onChange={handleChangeSample}
            isLoading={Boolean(track.isLoading)}
          />
        )}
        <FormControlLabel control={<Checkbox />} label="Mute" onChange={handleChangeMute} />
      </Stack>
    </ControlContainer>
  );
}
