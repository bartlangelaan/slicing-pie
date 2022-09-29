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
  '/pie': 'Taart',
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
              value={Object.keys(pages).find((k) =>
                router.asPath.startsWith(k),
              )}
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
              async function sync() {
                const res = await fetch('/api/sync').then((r) => r.json());

                // Log status
                // eslint-disable-next-line no-console
                console.table(
                  res?.tasks.map((task: { action: object }) => ({
                    ...task,
                    ...Object.fromEntries(
                      Object.entries(task.action).map(([key, value]) => [
                        `action.${key}`,
                        value,
                      ]),
                    ),
                  })),
                );
                if (res?.tasks?.length) {
                  sync();
                } else if (res?.tasks?.length === 0) {
                  router.reload();
                }
              }
              sync();
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
