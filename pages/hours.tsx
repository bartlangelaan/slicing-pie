/* eslint-disable react/prop-types, no-nested-ternary */
import {
  Button,
  ButtonGroup,
  CircularProgress,
  Container,
} from '@mui/material';
import { DataGrid, GridValueFormatterParams } from '@mui/x-data-grid';
import useAxios from 'axios-hooks';
import {
  eachQuarterOfInterval,
  format,
  addQuarters,
  eachDayOfInterval,
  endOfQuarter,
  isSameDay,
  addMinutes,
  isWeekend,
  isAfter,
} from 'date-fns';
import { useState } from 'react';
import type { TimeEntry } from './api/get-hours';

const quarters = eachQuarterOfInterval({
  start: new Date(2020, 11, 7), // 2022-12-07
  end: new Date(),
})
  .reverse()
  .map((start) => {
    const end = endOfQuarter(start);
    const next = addQuarters(start, 1);
    return {
      label: format(start, 'yyyyQQQ'),
      period: `${format(start, 'yyyyMM')}..${format(next, 'yyyyMM')}`,
      days: eachDayOfInterval({ start, end }),
    };
  });

function valueFormatter(props: GridValueFormatterParams<number>) {
  let dt = new Date(props.value);
  if (props.value === 0) return '';
  dt = addMinutes(dt, dt.getTimezoneOffset());
  return format(dt, 'HH:mm:ss');
}

export default function HoursPage() {
  const [activeQuarter, setActiveQuarter] = useState(quarters[0]);
  const [hoursResponse] = useAxios<{
    data: TimeEntry[];
  }>(`/api/get-hours?period=${activeQuarter.period}`);
  const hours = (hoursResponse.data?.data || []).map((h) => ({
    ...h,
    duration:
      new Date(h.ended_at).getTime() -
      new Date(h.started_at).getTime() -
      h.paused_duration * 1000,
  }));

  return (
    <>
      <style global jsx>{`
        html,
        body,
        #__next {
          height: 100%;
          margin: 0;
        }

        #__next {
          display: flex;
          flex-direction: column;
        }
      `}</style>
      <Container sx={{ my: 1, display: 'flex', justifyContent: 'center' }}>
        <ButtonGroup>
          {quarters.map((quarter) => (
            <Button
              key={quarter.period}
              variant={
                quarter.period === activeQuarter.period
                  ? 'contained'
                  : 'outlined'
              }
              onClick={() => {
                setActiveQuarter(quarter);
              }}
            >
              {quarter.label}
            </Button>
          ))}
        </ButtonGroup>
      </Container>
      {hoursResponse.loading ? (
        <Container
          sx={{
            mb: 1,
            flexGrow: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <div>
            <CircularProgress size="50vh" />
          </div>
        </Container>
      ) : (
        <Container sx={{ mb: 1, flexGrow: 1 }}>
          <DataGrid
            experimentalFeatures={{ newEditingApi: true }}
            columns={[
              {
                field: 'day',
                headerName: 'Day',
                width: 150,
                valueFormatter: (props) =>
                  format(props.value, 'eee yyyy-MM-dd'),
              },
              { field: 'bart', headerName: 'Bart', valueFormatter },
              { field: 'ian', headerName: 'Ian', valueFormatter },
              {
                field: 'niels',
                headerName: 'Niels',
                valueFormatter,
              },
            ]}
            rows={activeQuarter.days.map((day, id) => {
              const hoursThisDay = hours.filter((h) =>
                isSameDay(new Date(h.started_at), day),
              );
              return {
                id,
                day,
                bart: hoursThisDay
                  .filter((h) => h.user.name === 'Bart Langelaan')
                  .reduce((total, h) => total + h.duration, 0),
                ian: hoursThisDay
                  .filter((h) => h.user.name === 'Ian Wensink')
                  .reduce((total, h) => total + h.duration, 0),
                niels: hoursThisDay
                  .filter((h) => h.user.name === 'Niels Otten')
                  .reduce((total, h) => total + h.duration, 0),
              };
            })}
            onCellClick={(params) => {
              const userId =
                params.field === 'bart'
                  ? '314636212260308719'
                  : params.field === 'ian'
                  ? '313176631829071688'
                  : params.field === 'niels'
                  ? '314352839788856769'
                  : null;
              if (!userId) return;
              const date = format(params.row.day, 'yyyy-MM-dd');
              window
                .open(
                  `https://moneybird.com/313185156605150255/time_entries?date=${date}&user_id=${userId}`,
                  '_blank',
                )
                ?.focus();
            }}
            getRowHeight={(props) =>
              isWeekend(props.model.day) || isAfter(props.model.day, new Date())
                ? 26
                : 52
            }
          />
        </Container>
      )}
    </>
  );
}
