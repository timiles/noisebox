import { Button, FormControl, FormHelperText, Link, Typography } from '@mui/material';
import ExternalLink from 'components/ExternalLink';
import Modal2 from 'components/Modal2';
import { ChangeEvent, useState } from 'react';
import { DrumTrack, InstrumentTrack, Track, TrackType } from 'types/Track';
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
          } catch (error) {
            console.error(`${file.name} is not valid json:`, error);
            return;
          }

          if (!isValidSongsterrData(json)) {
            console.error(`${file.name} is not valid Songsterr data.`);
            return;
          }

          const songsterrData = JSON.parse(text) as SongsterrData;
          const trackType = getTrackType(songsterrData);

          const track: Track = {
            id: uuidv4(),
            name: songsterrData.name,
            instrument: songsterrData.instrument,
            type: trackType,
            mute: false,
          };

          switch (trackType) {
            case TrackType.Drum: {
              (track as DrumTrack).drumBeats = convertSongsterrDataToDrumBeats(songsterrData);
              break;
            }
            case TrackType.Instrument: {
              (track as InstrumentTrack).notes = convertSongsterrDataToNotes(songsterrData);
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
      <Modal2
        id="track-files-modal"
        open={open}
        title="Supported track files"
        closeText="Got it"
        onClose={handleClose}
      >
        <Typography mb={2}>
          Noisebox can currently read tabs from{' '}
          <ExternalLink href="https://www.songsterr.com/">Songsterr.com</ExternalLink>.
        </Typography>
        <Typography>
          Please{' '}
          <ExternalLink href="https://github.com/timiles/noisebox/issues">
            open an issue
          </ExternalLink>{' '}
          to request support for other file formats.
        </Typography>
      </Modal2>
    </FormControl>
  );
}
