import { Box, Typography } from '@mui/material';

function LoadingPlaceholder() {
  return (
    <Box display="flex" height="100%" justifyContent="center" alignItems="center">
      <Typography sx={{ fontStyle: 'italic' }}>Loading...</Typography>
    </Box>
  );
}

export default LoadingPlaceholder;
