import { Typography } from '@mui/material';
import ControlContainer from 'components/ControlContainer';
import { Sample } from 'types/Sample';
import { Track } from 'types/Track';
import { isDrumTrack, isInstrumentTrack } from 'utils/trackUtils';
import SelectDrumKitControl from './SelectDrumKitControl';
import SelectSampleControl from './SelectSampleControl';

interface IProps {
  track: Track;
  samples: Array<Sample>;
  onChange: (track: Track) => void;
}

function TrackSettings(props: IProps) {
  const { track, samples, onChange } = props;

  const handleChangeDrumKit = (nextDrumKitId: number) => {
    onChange({ ...track, drumKitId: nextDrumKitId } as Track);
  };

  const handleChangeSample = (nextSample: Sample) => {
    onChange({ ...track, sample: nextSample } as Track);
  };

  return (
    <ControlContainer>
      <Typography component="h2" variant="h6" mb={1}>
        {`${track.name} (${track.instrument})`}
      </Typography>
      {isDrumTrack(track) && <SelectDrumKitControl id={track.id} onChange={handleChangeDrumKit} />}
      {isInstrumentTrack(track) && (
        <SelectSampleControl id={track.id} samples={samples} onChange={handleChangeSample} />
      )}
    </ControlContainer>
  );
}

export default TrackSettings;
