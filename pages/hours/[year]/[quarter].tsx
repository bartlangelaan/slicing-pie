/* eslint-disable react/prop-types, no-nested-ternary */
import { Button, ButtonGroup, Container } from '@mui/material';
import { DataGrid, GridValueFormatterParams } from '@mui/x-data-grid';
import { Layout } from 'components/Layout';
import { format, isSameDay, addMinutes, isWeekend, isAfter } from 'date-fns';
import { GetStaticPropsContext, InferGetStaticPropsType } from 'next';
import { mongo, pick } from 'utils/mongo';
import { TimeEntry } from 'utils/moneybird-types';
import { serialize, unserialize } from 'utils/serialize';
import { useRouter } from 'next/router';
import { quarters } from 'utils/quarters';

export async function getStaticPaths() {
  return {
    paths: quarters.map((quarter) => ({
      params: {
        year: quarter.year,
        quarter: quarter.quarter,
      },
    })),
    fallback: false,
  };
}

export async function getStaticProps(
  context: GetStaticPropsContext<{ year: string; quarter: string }>,
) {
  const quarter = quarters.find(
    (q) =>
      q.year === context.params!.year && q.quarter === context.params!.quarter,
  );

  const timeEntries = await pick(
    mongo
      .db()
      .collection<TimeEntry>('time_entries')
      .find({
        started_at: {
          $gte: quarter!.start,
          $lte: quarter!.end,
        },
      }),
    ['started_at', 'ended_at', 'paused_duration', 'user'],
  ).toArray();

  return {
    props: { timeEntries: timeEntries.map(serialize), params: context.params! },
  };
}

export default function HoursPage(
  props: InferGetStaticPropsType<typeof getStaticProps>,
) {
  const router = useRouter();
  const activeQuarter = quarters.find(
    (q) => q.year === props.params.year && q.quarter === props.params.quarter,
  )!;
  const hours = props.timeEntries.map(unserialize).map((h) => ({
    ...h,
    duration:
      new Date(h.ended_at).getTime() -
      new Date(h.started_at).getTime() -
      h.paused_duration * 1000,
  }));

  return (
    <Layout>
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
              key={quarter.label}
              variant={
                router.asPath === `/hours/${quarter.year}/${quarter.quarter}`
                  ? 'contained'
                  : 'outlined'
              }
              onClick={() => {
                router.push(`/hours/${quarter.year}/${quarter.quarter}`);
              }}
            >
              {quarter.label}
            </Button>
          ))}
        </ButtonGroup>
      </Container>

      <Container sx={{ mb: 1, flexGrow: 1 }}>
        <DataGrid
          experimentalFeatures={{ newEditingApi: true }}
          columns={[
            {
              field: 'day',
              headerName: 'Day',
              width: 150,
              valueFormatter: (params) =>
                format(params.value, 'eee yyyy-MM-dd'),
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
          getRowHeight={(params) =>
            isWeekend(params.model.day) || isAfter(params.model.day, new Date())
              ? 26
              : 52
          }
        />
      </Container>
    </Layout>
  );
}

function valueFormatter(props: GridValueFormatterParams<number>) {
  let dt = new Date(props.value);
  if (props.value === 0) return '';
  dt = addMinutes(dt, dt.getTimezoneOffset());
  return format(dt, 'HH:mm:ss');
}
