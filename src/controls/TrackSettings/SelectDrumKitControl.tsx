import { FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import { DRUM_KITS } from 'data/DRUM_KITS';
import { useState } from 'react';

interface IProps {
  id: string;
  onChange: (drumKitId: number) => void;
}

export default function SelectDrumKitControl(props: IProps) {
  const { id, onChange } = props;

  const [selectedDrumKitId, setSelectedDrumKitId] = useState<number>();

  const handleChangeDrumKit = (event: SelectChangeEvent<string>) => {
    const nextSelectedDrumKitId = Number(event.target.value);
    setSelectedDrumKitId(nextSelectedDrumKitId);
    onChange(nextSelectedDrumKitId);
  };

  const selectLabelId = `${id}-select-drum-kit-label`;

  return (
    <FormControl fullWidth>
      <InputLabel id={selectLabelId}>Drum kit</InputLabel>
      <Select
        labelId={selectLabelId}
        value={selectedDrumKitId?.toString() ?? ''}
        label="Sample"
        onChange={handleChangeDrumKit}
      >
        {DRUM_KITS.map((drumKit) => (
          <MenuItem key={drumKit.id} value={drumKit.id}>
            {drumKit.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
