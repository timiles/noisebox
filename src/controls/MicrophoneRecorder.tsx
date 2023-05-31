import {
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
} from '@mui/material';
import { useAudioContext } from 'AudioContextProvider';
import { enqueueSnackbar } from 'notistack';
import { AudioSource } from 'types/AudioSource';
import { getNextNumberedItem } from 'utils/arrayUtils';
import useAudioRecorder from 'utils/useAudioRecorder';
import { v4 as uuidv4 } from 'uuid';

interface IProps {
  audioSources: ReadonlyArray<AudioSource>;
  onAudioSourceAdded: (audioSource: AudioSource) => void;
}

export default function MicrophoneRecorder(props: IProps) {
  const { audioSources, onAudioSourceAdded } = props;

  const audioContext = useAudioContext();

  const handleAudioRecorded = (arrayBuffer: ArrayBuffer, contentType: string) => {
    const rawData = arrayBuffer.slice(0, arrayBuffer.byteLength);
    audioContext.decodeAudioData(arrayBuffer).then((decodedAudioData) => {
      const audioSourceNames = audioSources.map(({ name }) => name);
      const nextRecordingName = getNextNumberedItem('Recording ', audioSourceNames);

      onAudioSourceAdded({
        id: uuidv4(),
        name: nextRecordingName,
        rawData,
        contentType,
        audioBuffer: decodedAudioData,
        samples: [],
      });
      enqueueSnackbar(`"${nextRecordingName}" created.`, { variant: 'success' });
    });
  };

  const { isRecording, startRecording, stopRecording } = useAudioRecorder(handleAudioRecorded);

  return (
    <FormControl>
      <Button
        variant="contained"
        onClick={startRecording}
        aria-describedby="microphone-recorder-helper-text"
      >
        Start recording
      </Button>
      <FormHelperText id="microphone-recorder-helper-text">using your microphone</FormHelperText>
      <Dialog open={isRecording} aria-labelledby="microphone-recorder-dialog-title">
        <DialogTitle id="microphone-recorder-dialog-title">
          Recording... <CircularProgress size="1rem" />
        </DialogTitle>
        <DialogContent>
          <Button variant="contained" onClick={stopRecording}>
            Stop recording
          </Button>
        </DialogContent>
      </Dialog>
    </FormControl>
  );
}
