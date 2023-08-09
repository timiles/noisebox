import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormHelperText,
  Link,
} from '@mui/material';
import { useLogger } from 'LoggerProvider';
import ExternalLink from 'components/ExternalLink';
import { enqueueSnackbar } from 'notistack';
import { ChangeEvent, useState } from 'react';
import { Track, TrackType } from 'types/Track';
import { SongsterrData } from 'utils/trackFiles/Songsterr/SongsterrData';
import {
  convertSongsterrDataToDrumBeats,
  convertSongsterrDataToNotes,
  getTrackType,
  isValidSongsterrData,
} from 'utils/trackFiles/Songsterr/songsterrUtils';
import { v4 as uuidv4 } from 'uuid';

interface IProps {
  onTrackAdded: (track: Track) => void;
}

export default function TrackFilesInput(props: IProps) {
  const { onTrackAdded } = props;

  const logger = useLogger();

  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { files } = e.currentTarget;
    if (files) {
      for (let i = 0; i < files.length; i += 1) {
        const file = files[i];
        file.text().then((text) => {
          let json;
          try {
            json = JSON.parse(text);

            if (!isValidSongsterrData(json)) {
              throw new Error('Invalid Songsterr data.');
            }
          } catch (error) {
            logger.log('error', `Could not read "${file.name}". ${error}`);
            enqueueSnackbar({ message: `Could not read "${file.name}".`, variant: 'error' });
            return;
          }

          const songsterrData = JSON.parse(text) as SongsterrData;
          const trackType = getTrackType(songsterrData);

          const { instrument } = songsterrData;

          let track: Track;

          switch (trackType) {
            case TrackType.Drum: {
              const drumBeats = convertSongsterrDataToDrumBeats(songsterrData, logger);
              track = { type: TrackType.Drum, id: uuidv4(), instrument, drumBeats };
              break;
            }
            case TrackType.Instrument: {
              const notes = convertSongsterrDataToNotes(songsterrData);
              track = { type: TrackType.Instrument, id: uuidv4(), instrument, notes };
              break;
            }
            default: {
              const exhaustiveCheck: never = trackType;
              throw new Error(`Unknown TrackType: ${trackType}.`);
            }
          }

          onTrackAdded(track);
        });
      }
    }
  };

  return (
    <FormControl>
      <Button variant="contained" component="label">
        Import track files
        <input
          type="file"
          accept=".json"
          aria-describedby="track-files-input-helper-text"
          hidden
          multiple
          onChange={handleChange}
        />
      </Button>
      <FormHelperText id="track-files-input-helper-text">
        See {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
        <Link component="button" onClick={handleOpen}>
          supported track files
        </Link>
      </FormHelperText>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="track-files-dialog-title"
        aria-describedby="track-files-dialog-description"
      >
        <DialogTitle id="track-files-dialog-title">Supported track files</DialogTitle>
        <DialogContent>
          <DialogContentText id="track-files-dialog-description" tabIndex={-1}>
            Noisebox can currently read tabs from{' '}
            <ExternalLink href="https://www.songsterr.com/">Songsterr.com</ExternalLink>.
            <br />
            Please{' '}
            <ExternalLink href="https://github.com/timiles/noisebox/issues">
              open an issue
            </ExternalLink>{' '}
            to request support for other file formats.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Got it</Button>
        </DialogActions>
      </Dialog>
    </FormControl>
  );
}
