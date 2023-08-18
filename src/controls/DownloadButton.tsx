import DoneIcon from '@mui/icons-material/Done';
import DownloadIcon from '@mui/icons-material/Download';
import { Button, CircularProgress } from '@mui/material';
import { enqueueSnackbar } from 'notistack';
import MultiTrackPlayer from 'players/MultiTrackPlayer';
import { useEffect, useState } from 'react';
import { downloadBlob } from 'utils/downloadUtils';
import { getChannelDataArrays } from 'utils/sampleUtils';
import { toFilenameFriendlyString } from 'utils/timeUtils';
import { getWorkerPool } from 'workers/getWorkerPool';

type Status = 'ReadyToDownload' | 'Rendering' | 'Encoding' | 'Downloaded';

interface IProps {
  multiTrackPlayer: MultiTrackPlayer;
}

export default function DownloadButton(props: IProps) {
  const { multiTrackPlayer } = props;

  const [status, setStatus] = useState<Status>('ReadyToDownload');

  useEffect(() => {
    if (status === 'Downloaded') {
      setTimeout(() => setStatus('ReadyToDownload'), 2000);
    }
  }, [status]);

  const handleDownload = () => {
    setStatus('Rendering');

    multiTrackPlayer
      .renderToAudioBuffer()
      .then((buffer) => {
        setStatus('Encoding');

        const pool = getWorkerPool();
        const channelDataArrays = getChannelDataArrays(buffer);
        pool
          .encodeBufferToWav(channelDataArrays, buffer.sampleRate)
          .then((wavData) => {
            downloadBlob(wavData, `noisebox ${toFilenameFriendlyString(new Date())}.wav`);
          })
          .catch((error: Error) => {
            enqueueSnackbar(error.message, { variant: 'error' });
          })
          .then(() => {
            pool.terminate();
            setStatus('Downloaded');
          });
      })
      .catch((error: Error) => {
        enqueueSnackbar(error.message, { variant: 'error' });
        setStatus('ReadyToDownload');
      });
  };

  switch (status) {
    case 'ReadyToDownload': {
      return (
        <Button variant="contained" onClick={handleDownload}>
          <DownloadIcon />
          Download
        </Button>
      );
    }
    case 'Rendering':
    case 'Encoding': {
      return (
        <Button variant="contained" disabled endIcon={<CircularProgress size="1rem" />}>
          <DownloadIcon />
          {`${status}...`}
        </Button>
      );
    }
    case 'Downloaded': {
      return (
        <Button variant="contained" color="success">
          <DoneIcon />
          Downloaded!
        </Button>
      );
    }
    default: {
      const exhaustiveCheck: never = status;
      throw new Error(`Unknown status: "${status}".`);
    }
  }
}
