import { Stack } from '@mui/material';
import Container from '@mui/material/Container';
import { useAudioContext } from 'AudioContextProvider';
import ControlContainer from 'components/ControlContainer';
import AudioSourceFilesInput from 'controls/AudioSourceFilesInput';
import PlayControls from 'controls/PlayControls';
import SamplesEditor from 'controls/SamplesEditor';
import TrackFilesInput from 'controls/TrackFilesInput';
import TrackSettings from 'controls/TrackSettings';
import { useState } from 'react';
import { AudioSource } from 'types/AudioSource';
import { Track } from 'types/Track';
import MultiTrackPlayer from 'utils/MultiTrackPlayer';
import { getValidSamples } from 'utils/sampleUtils';

function App() {
  const [audioSources, setAudioSources] = useState<AudioSource[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);

  const audioContext = useAudioContext();
  const [multiTrackPlayer] = useState(new MultiTrackPlayer(audioContext));

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
      <ControlContainer>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <AudioSourceFilesInput onAudioSourceAdded={handleAudioSourceAdded} />
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
    </Container>
  );
}

export default App;
