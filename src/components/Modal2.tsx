import { Backdrop, Box, Button, Fade, Modal, Typography } from '@mui/material';
import { PropsWithChildren } from 'react';

interface IProps {
  id: string;
  open: boolean;
  title: string;
  closeText: string;
  onClose: () => void;
}

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

export default function Modal2(props: PropsWithChildren<IProps>) {
  const { id, open, title, closeText, onClose, children } = props;

  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;

  return (
    <Modal
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      open={open}
      onClose={onClose}
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{
        backdrop: {
          timeout: 500,
        },
      }}
    >
      <Fade in={open}>
        <Box sx={style}>
          <Typography id={titleId} component="h2" variant="h6">
            {title}
          </Typography>
          <Box id={descriptionId} my={2}>
            {children}
          </Box>
          <Box display="flex" justifyContent="center">
            <Button variant="outlined" onClick={onClose}>
              {closeText}
            </Button>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
}
