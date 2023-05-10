import Container from '@mui/material/Container';
import AudioContextProvider from 'AudioContextProvider';
import ControlContainer from 'components/ControlContainer';
import AudioSourceFilesInput from 'controls/AudioSourceFilesInput';
import SamplesEditor from 'controls/SamplesEditor';
import { useState } from 'react';
import { AudioSource } from 'types/AudioSource';

function App() {
  const [audioSources, setAudioSources] = useState<AudioSource[]>([]);

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

  return (
    <Container maxWidth="xl">
      <AudioContextProvider>
        <ControlContainer>
          <AudioSourceFilesInput onAudioSourceAdded={handleAudioSourceAdded} />
        </ControlContainer>
        {audioSources.length > 0 &&
          audioSources.map((audioSource) => (
            <SamplesEditor
              key={audioSource.id}
              audioSource={audioSource}
              onChange={handleChangeAudioSource}
            />
          ))}
      </AudioContextProvider>
    </Container>
  );
}

export default App;
