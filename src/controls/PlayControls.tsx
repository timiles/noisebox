import { Button, Chip, Stack } from '@mui/material';
import ControlContainer from 'components/ControlContainer';
import { useState } from 'react';
import MultiTrackPlayer, { PlayMode } from 'utils/MultiTrackPlayer';
import { toMinutesAndSeconds } from 'utils/timeUtils';

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
    </ControlContainer>
  );
}
