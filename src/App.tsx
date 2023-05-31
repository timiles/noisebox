import { Box, Stack } from '@mui/material';
import Container from '@mui/material/Container';
import Toolbar from '@mui/material/Toolbar';
import AppBar, { View } from 'AppBar';
import { useAudioContext } from 'AudioContextProvider';
import { useLogger } from 'LoggerProvider';
import ControlContainer from 'components/ControlContainer';
import AudioSourceFilesInput from 'controls/AudioSourceFilesInput';
import LogsDisplay from 'controls/LogsDisplay';
import MicrophoneRecorder from 'controls/MicrophoneRecorder';
import PlayControls from 'controls/PlayControls';
import SamplesEditor from 'controls/SamplesEditor';
import TrackFilesInput from 'controls/TrackFilesInput';
import TrackSettings from 'controls/TrackSettings';
import { SnackbarProvider } from 'notistack';
import { useState } from 'react';
import { AudioSource } from 'types/AudioSource';
import { Track } from 'types/Track';
import MultiTrackPlayer from 'utils/MultiTrackPlayer';
import { getValidSamples } from 'utils/sampleUtils';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('Noisebox');
  const [audioSources, setAudioSources] = useState<AudioSource[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);

  const audioContext = useAudioContext();
  const logger = useLogger();

  const [multiTrackPlayer] = useState(new MultiTrackPlayer(audioContext, logger));

  const handleChangeView = (nextView: View) => {
    setCurrentView(nextView);
  };

  const handleCloseLogs = () => {
    setCurrentView('Noisebox');
  };

  const handleAudioSourceAdded = (addedAudioSource: AudioSource) => {
    setAudioSources((prevAudioSources) => prevAudioSources.concat(addedAudioSource));
  };

  const handleChangeAudioSource = (nextAudioSource: AudioSource) => {
    setAudioSources((prevAudioSources) => {
      const nextAudioSources = prevAudioSources.slice();
      const index = nextAudioSources.findIndex(({ id }) => id === nextAudioSource.id);
      nextAudioSources[index] = nextAudioSource;
      return nextAudioSources;
    });
  };

  const handleTrackAdded = (track: Track) => {
    setTracks((prevTracks) => prevTracks.concat(track));
  };

  const handleChangeTrack = (nextTrack: Track) => {
    setTracks((prevTracks) => {
      const nextTracks = prevTracks.slice();
      const index = nextTracks.findIndex(({ id }) => id === nextTrack.id);
      nextTracks[index] = nextTrack;
      multiTrackPlayer.setTracks(nextTracks);
      return nextTracks;
    });
  };

  const samples = getValidSamples(audioSources);

  return (
    <Container maxWidth="xl">
      <AppBar onChangeView={handleChangeView} />
      {currentView === 'Logs' && <LogsDisplay onClose={handleCloseLogs} />}
      <Box component="main" pt={2}>
        <Toolbar />
        <ControlContainer>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <AudioSourceFilesInput onAudioSourceAdded={handleAudioSourceAdded} />
            <MicrophoneRecorder
              audioSources={audioSources}
              onAudioSourceAdded={handleAudioSourceAdded}
            />
            <TrackFilesInput onTrackAdded={handleTrackAdded} />
          </Stack>
        </ControlContainer>
        {audioSources.length > 0 &&
          audioSources.map((audioSource) => (
            <SamplesEditor
              key={audioSource.id}
              audioSource={audioSource}
              onChange={handleChangeAudioSource}
            />
          ))}
        {tracks.length > 0 &&
          tracks.map((track) => (
            <TrackSettings
              key={track.id}
              track={track}
              samples={samples}
              onChange={handleChangeTrack}
            />
          ))}
        <PlayControls multiTrackPlayer={multiTrackPlayer} />
      </Box>
      <SnackbarProvider />
    </Container>
  );
}
