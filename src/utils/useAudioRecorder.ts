import { useLogger } from 'LoggerProvider';
import { enqueueSnackbar } from 'notistack';
import { useState } from 'react';

export default function useAudioRecorder(
  onAudioRecorded: (buffer: ArrayBuffer, contentType: string) => void,
) {
  const { log } = useLogger();
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder>();

  const startRecording = () => {
    navigator.mediaDevices
      .getUserMedia({ audio: true, video: false })
      .then((stream: MediaStream) => {
        // Don't specify mime type, allow device to use whatever it supports
        const recorder = new MediaRecorder(stream);

        // This will capture recorded data when recorder.stop() is called
        let recordedData: Blob | undefined;
        recorder.ondataavailable = (e) => {
          recordedData = e.data;
        };

        recorder.onstop = () => {
          if (recordedData) {
            recordedData.arrayBuffer().then((arrayBuffer) => {
              onAudioRecorded(arrayBuffer, recordedData!.type);
            });
          }
        };

        recorder.start();
        setMediaRecorder(recorder);
      })
      .catch((reason) => {
        if (reason.message === 'Permission denied') {
          enqueueSnackbar('Please allow Noisebox to use your microphone.', { variant: 'error' });
        } else {
          log('error', `Unable to access microphone: ${reason}.`);
          enqueueSnackbar('Unable to access microphone.', { variant: 'error' });
        }
      });
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      mediaRecorder.stream.getAudioTracks().forEach((track) => track.stop());
      setMediaRecorder(undefined);
    }
  };

  const isRecording = mediaRecorder !== undefined;

  return { isRecording, startRecording, stopRecording };
}
