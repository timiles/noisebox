import { Box, Paper } from '@mui/material';
import { PropsWithChildren } from 'react';

export default function ControlContainer(props: PropsWithChildren<{}>) {
  const { children } = props;

  return (
    <Box mb={2}>
      <Paper>
        <Box p={2}>{children}</Box>
      </Paper>
    </Box>
  );
}
