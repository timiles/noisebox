import { Button, Chip, Stack } from '@mui/material';
import ControlContainer from 'components/ControlContainer';
import MultiTrackPlayer, { PlayMode } from 'players/MultiTrackPlayer';
import { useState } from 'react';
import { toMinutesAndSeconds } from 'utils/timeUtils';
import DownloadButton from './DownloadButton';

interface IProps {
  multiTrackPlayer: MultiTrackPlayer;
}

export default function PlayControls(props: IProps) {
  const { multiTrackPlayer } = props;

  const [trackTime, setTrackTime] = useState(0);
  const [playMode, setPlayMode] = useState(PlayMode.NoTracksLoaded);

  multiTrackPlayer.onChangePlayMode = setPlayMode;

  multiTrackPlayer.onChangeTrackTime = (nextTrackTime) => {
    setTrackTime(Math.floor(nextTrackTime));
  };

  if (playMode === PlayMode.NoTracksLoaded) {
    return null;
  }

  const canPlay = playMode === PlayMode.Paused || playMode === PlayMode.Stopped;
  const canPause = playMode === PlayMode.Playing;
  const canStop = playMode === PlayMode.Playing || playMode === PlayMode.Paused;

  return (
    <ControlContainer>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" spacing={2}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Chip label={toMinutesAndSeconds(trackTime)} variant="outlined" />
          <Button variant="contained" onClick={() => multiTrackPlayer.play()} disabled={!canPlay}>
            Play
          </Button>
          <Button variant="contained" onClick={() => multiTrackPlayer.pause()} disabled={!canPause}>
            Pause
          </Button>
          <Button variant="contained" onClick={() => multiTrackPlayer.stop()} disabled={!canStop}>
            Stop
          </Button>
        </Stack>
        <DownloadButton multiTrackPlayer={multiTrackPlayer} />
      </Stack>
    </ControlContainer>
  );
}
