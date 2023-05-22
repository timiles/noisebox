import { Box, Typography } from '@mui/material';

export default function LoadingPlaceholder() {
  return (
    <Box display="flex" height="100%" justifyContent="center" alignItems="center">
      <Typography sx={{ fontStyle: 'italic' }}>Loading...</Typography>
    </Box>
  );
}
