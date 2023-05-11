import { Button, FormControl, FormHelperText } from '@mui/material';
import { useAudioContext } from 'AudioContextProvider';
import { ChangeEvent } from 'react';
import { AudioSource } from 'types/AudioSource';
import { v4 as uuidv4 } from 'uuid';

interface IProps {
  onAudioSourceAdded: (audioSource: AudioSource) => void;
}

function AudioSourceFilesInput(props: IProps) {
  const { onAudioSourceAdded } = props;

  const audioContext = useAudioContext();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { files } = e.currentTarget;
    if (files) {
      for (let i = 0; i < files.length; i += 1) {
        const file = files[i];
        file.arrayBuffer().then((value) => {
          // Create a copy of the raw data before it's consumed
          const rawData = value.slice(0, value.byteLength);
          audioContext.decodeAudioData(value, (audioBuffer) => {
            if (!audioBuffer) {
              console.error('Error decoding audio data. Please try another file.');
            }
            onAudioSourceAdded({
              id: uuidv4(),
              name: file.name,
              rawData,
              contentType: file.type,
              audioBuffer,
              samples: [],
            });
          });
        });
      }
    }
  };

  return (
    <FormControl>
      <Button variant="contained" component="label">
        Import audio files
        <input
          type="file"
          // accept="audio/*" <- does not work on iOS: audio files appear disabled
          accept=".m4a,.mp3,.ogg,.wav"
          aria-describedby="audio-source-files-input-helper-text"
          hidden
          multiple
          onChange={handleChange}
        />
      </Button>
      <FormHelperText id="audio-source-files-input-helper-text">eg .mp3 etc</FormHelperText>
    </FormControl>
  );
}

export default AudioSourceFilesInput;
