import MenuIcon from '@mui/icons-material/Menu';
import {
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Slide,
} from '@mui/material';
import MuiAppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import useScrollTrigger from '@mui/material/useScrollTrigger';
import { useState } from 'react';

export type View = 'Noisebox' | 'Logs';

interface IProps {
  onChangeView: (view: View) => void;
}

export default function AppBar(props: IProps) {
  const { onChangeView } = props;

  const scrollTrigger = useScrollTrigger();

  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleToggleDrawerOpen = () => {
    setDrawerOpen((prevDrawerOpen) => !prevDrawerOpen);
  };

  const views: Array<View> = ['Logs'];
  const drawerWidth = 240;

  return (
    <>
      <Slide appear={false} direction="down" in={!scrollTrigger}>
        <MuiAppBar component="nav">
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleToggleDrawerOpen}
              sx={{ display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" component="div" flexGrow={1}>
              Noisebox
            </Typography>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              {views.map((view) => (
                <Button key={view} sx={{ color: '#fff' }} onClick={() => onChangeView(view)}>
                  {view}
                </Button>
              ))}
            </Box>
          </Toolbar>
        </MuiAppBar>
      </Slide>
      <Box component="nav">
        <Drawer
          variant="temporary"
          open={drawerOpen}
          onClose={handleToggleDrawerOpen}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          <Box onClick={handleToggleDrawerOpen} sx={{ textAlign: 'center' }}>
            <Typography variant="h6" my={2}>
              Noisebox
            </Typography>
            <Divider />
            <List>
              {views.map((view) => (
                <ListItem key={view} disablePadding>
                  <ListItemButton sx={{ textAlign: 'center' }} onClick={() => onChangeView(view)}>
                    <ListItemText primary={view} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
        </Drawer>
      </Box>
    </>
  );
}
