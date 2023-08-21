import DoneIcon from '@mui/icons-material/Done';
import DownloadIcon from '@mui/icons-material/Download';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { Button, CircularProgress, Menu, MenuItem } from '@mui/material';
import { enqueueSnackbar } from 'notistack';
import MultiTrackPlayer from 'players/MultiTrackPlayer';
import { MouseEvent, useEffect, useState } from 'react';
import { downloadBlob } from 'utils/downloadUtils';
import { getChannelDataArrays } from 'utils/sampleUtils';
import { toFilenameFriendlyString } from 'utils/timeUtils';
import WorkerPool from 'workerpool';
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

  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);

  const handleOpenMenu = (event: MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setMenuAnchorEl(null);
  };

  const handleDownload = (format: 'mp3:128' | 'mp3:320' | 'wav') => {
    handleCloseMenu();
    setStatus('Rendering');

    multiTrackPlayer
      .renderToAudioBuffer()
      .then((buffer) => {
        setStatus('Encoding');

        const channelDataArrays = getChannelDataArrays(buffer);
        const [extension, bitRate] = format.split(':');

        const pool = getWorkerPool();
        let blobPromise: WorkerPool.Promise<Blob>;

        switch (format) {
          case 'mp3:128':
          case 'mp3:320': {
            blobPromise = pool.encodeBufferToMp3(
              channelDataArrays,
              buffer.sampleRate,
              Number(bitRate),
            );
            break;
          }
          case 'wav': {
            blobPromise = pool.encodeBufferToWav(channelDataArrays, buffer.sampleRate);
            break;
          }
          default: {
            const exhaustiveCheck: never = format;
            throw new Error(`Unknown format: "${format}".`);
          }
        }

        blobPromise
          .then((blob) => {
            const filename = `noisebox ${toFilenameFriendlyString(new Date())}.${extension}`;
            downloadBlob(blob, filename);
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

  const isMenuOpen = Boolean(menuAnchorEl);

  switch (status) {
    case 'ReadyToDownload': {
      return (
        <>
          <Button
            aria-controls={isMenuOpen ? 'download-button-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={isMenuOpen ? 'true' : undefined}
            variant="contained"
            onClick={handleOpenMenu}
            endIcon={<KeyboardArrowDownIcon />}
          >
            <DownloadIcon />
            Download
          </Button>
          <Menu
            id="download-button-menu"
            anchorEl={menuAnchorEl}
            open={isMenuOpen}
            onClose={handleCloseMenu}
          >
            <MenuItem onClick={() => handleDownload('mp3:128')} disableRipple>
              .mp3 (128kbps)
            </MenuItem>
            <MenuItem onClick={() => handleDownload('mp3:320')} disableRipple>
              .mp3 (320kbps)
            </MenuItem>
            <MenuItem onClick={() => handleDownload('wav')} disableRipple>
              .wav
            </MenuItem>
          </Menu>
        </>
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
