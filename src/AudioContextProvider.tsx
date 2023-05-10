import { PropsWithChildren, createContext, useContext, useState } from 'react';

const AudioContextContext = createContext<AudioContext | undefined>(undefined);

/**
 * Provides access to a global AudioContext.
 */
const AudioContextProvider = ({ children }: PropsWithChildren<{}>) => {
  const [audioContext] = useState<AudioContext>(new AudioContext());

  return (
    <AudioContextContext.Provider value={audioContext}>{children}</AudioContextContext.Provider>
  );
};

/**
 * Returns a global AudioContext.
 */
const useAudioContext = () => {
  const audioContext = useContext(AudioContextContext);
  if (!audioContext) {
    throw new Error('useAudioContext must be used inside an AudioContextProvider.');
  }
  // Check if suspended or not allowed to start.
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
};

export default AudioContextProvider;
export { useAudioContext };
