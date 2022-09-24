import {
  AppBar,
  Box,
  IconButton,
  Tab,
  Tabs,
  Toolbar,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/router';
import { ReactNode, useState } from 'react';
import RefreshIcon from '@mui/icons-material/Refresh';

interface Props {
  children: ReactNode;
}

const pages = {
  '/': 'Taart',
  '/hours': 'Urenoverzicht',
};

export function Layout(props: Props) {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  return (
    <>
      <AppBar position="fixed">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Popup IO
          </Typography>
          <Box>
            <Tabs
              indicatorColor="secondary"
              textColor="inherit"
              value={router.pathname}
              onChange={(_, newUrl: keyof typeof pages) => router.push(newUrl)}
            >
              {Object.entries(pages).map(([url, title]) => (
                <Tab key={url} value={url} label={title} />
              ))}
            </Tabs>
          </Box>
          <IconButton
            color="inherit"
            disabled={refreshing}
            onClick={() => {
              setRefreshing(true);
              fetch('/api/sync').then(() => {
                router.reload();
              });
            }}
          >
            <RefreshIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Toolbar />
      {props.children}
    </>
  );
}
