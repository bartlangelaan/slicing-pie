import { AppBar, Box, Tab, Tabs, Toolbar, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

const pages = {
  '/': 'Taart',
  '/hours': 'Urenoverzicht',
};

export function Layout(props: Props) {
  const router = useRouter();
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
        </Toolbar>
      </AppBar>
      <Toolbar />
      {props.children}
    </>
  );
}
