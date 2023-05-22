import { useLogger } from 'LoggerProvider';
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
  const logger = useLogger();
  const audioContext = useContext(AudioContextContext);

  if (!audioContext) {
    throw new Error('useAudioContext must be used inside an AudioContextProvider.');
  }

  // AudioContext might be suspended if created before any user gesture on page
  if (audioContext.state !== 'running') {
    logger.log('info', `AudioContext state: ${audioContext.state}. Resuming now.`);
    audioContext.resume();
  }

  return audioContext;
};

export default AudioContextProvider;
export { useAudioContext };
