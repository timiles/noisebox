import { AlertColor } from '@mui/material';
import { PropsWithChildren, createContext, useContext, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

type LogMessage = {
  id: string;
  severity: AlertColor;
  message: string;
  time: Date;
};

export interface ILogger {
  log: (severity: AlertColor, message: string) => void;
  logs: Array<LogMessage>;
}

const LogContext = createContext<ILogger | undefined>(undefined);

const LoggerProvider = ({ children }: PropsWithChildren<{}>) => {
  const [logMessages, setLogMessages] = useState<Array<LogMessage>>([
    { id: uuidv4(), severity: 'info', message: 'Noisebox started.', time: new Date() },
  ]);

  const logger: ILogger = {
    log: (severity: AlertColor, message: string) => {
      setLogMessages((prevLogMessages) => {
        // Insert new messages at the beginning so most recent logs are first
        prevLogMessages.unshift({ id: uuidv4(), severity, message, time: new Date() });
        return prevLogMessages;
      });
    },
    logs: logMessages,
  };

  return <LogContext.Provider value={logger}>{children}</LogContext.Provider>;
};

const useLogger = () => {
  const logger = useContext(LogContext);
  if (!logger) {
    throw new Error('useLogger must be used inside an LoggerProvider.');
  }
  return logger;
};

export default LoggerProvider;
export { useLogger };
