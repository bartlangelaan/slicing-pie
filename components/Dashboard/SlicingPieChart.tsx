import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { useMemo } from 'react';
import { Person } from '../../pages/api/get-slicing-pie';

export interface Props {
  timeSpent: {
    [key in Person]: {
      year: number;
      fromJuly: number;
      yearFiltered: number;
      fromJulyFiltered: number;
    };
  };
}

export function SlicingPieChart(props: Props) {
  const slicingPieOptions: Highcharts.Options = useMemo(
    () => ({
      title: {
        text: 'Slicing pie',
      },
      series: [
        {
          states: {
            hover: {
              enabled: false,
            },
            inactive: {
              opacity: 1,
            },
          },
          type: 'pie',
          name: 'Slicing pie',
          data: Object.entries(props.timeSpent).map(([person, value]) => [
            person[0].toUpperCase() + person.slice(1),
            value.yearFiltered,
          ]),
        },
      ],
      tooltip: {
        enabled: false,
      },
      plotOptions: {
        pie: {
          dataLabels: {
            enabled: true,
            format:
              '<b>{point.name}</b>:<br>{point.percentage:.1f} %<br>Uren: {point.y:.0f}',
          },
        },
      },
      credits: {
        enabled: false,
      },
      exporting: {
        enabled: false,
      },
    }),
    [props.timeSpent],
  );

  return (
    <HighchartsReact highcharts={Highcharts} options={slicingPieOptions} />
  );
}
