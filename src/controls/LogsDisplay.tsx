import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { useLogger } from 'LoggerProvider';

interface IProps {
  onClose: () => void;
}

export default function LogsDisplay(props: IProps) {
  const { onClose } = props;

  const { logs } = useLogger();

  return (
    <Dialog
      open
      onClose={onClose}
      aria-labelledby="track-files-dialog-title"
      aria-describedby="track-files-dialog-description"
    >
      <DialogTitle id="track-files-dialog-title">Logs</DialogTitle>
      <DialogContent>
        {logs.map(({ id, severity, message, time }) => (
          <Alert key={id} severity={severity}>
            {time.toLocaleTimeString()}: {message}
          </Alert>
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
