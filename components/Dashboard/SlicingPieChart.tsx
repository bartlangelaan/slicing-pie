import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { useMemo } from 'react';
import { GetSlicingPieResponse } from './GetSlicingPieResponse';

export function SlicingPieChart(props: GetSlicingPieResponse) {
  const slicingPieOptions: Highcharts.Options = useMemo(
    () => ({
      title: {
        text: '',
      },
      chart: {
        backgroundColor: 'transparent',
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
              '<b>{point.name}</b>:<br>{point.percentage:.2f} %<br>Uren: {point.y:.0f}',
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
    <div className="bg-white shadow-lg rounded mt-12 flex justify-center p-8">
      <HighchartsReact highcharts={Highcharts} options={slicingPieOptions} />
    </div>
  );
}
