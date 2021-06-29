import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { useMemo } from 'react';
import { Person } from '../../pages/api/get-slicing-pie';

const currencyFormatter = Intl.NumberFormat('nl', {
  style: 'currency',
  currency: 'EUR',
});

export interface Props {
  timeSpent: { [key in Person]: number };
  personalCosts: { [key in Person]: { plus: number; min: number } };
  totalTimeSpent: number;
  totalProfit: { plus: number; min: number };
}

export function Dashboard(props: Props) {
  const totalProfit = props.totalProfit.plus - props.totalProfit.min;

  const grossProfitBart =
    totalProfit * (props.timeSpent.bart / props.totalTimeSpent) || 0;
  const grossProfitIan =
    totalProfit * (props.timeSpent.ian / props.totalTimeSpent) || 0;
  const grossProfitNiels =
    totalProfit * (props.timeSpent.niels / props.totalTimeSpent) || 0;

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
            value,
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

  const profitOptions: Highcharts.Options = useMemo(() => {
    const costsBart =
      props.personalCosts.bart.plus - props.personalCosts.bart.min;
    const costsIan = props.personalCosts.ian.plus - props.personalCosts.ian.min;
    const costsNiels =
      props.personalCosts.niels.plus - props.personalCosts.niels.min;

    const grossTaxesBart = grossProfitBart - costsBart;
    const taxesReductionBart = grossTaxesBart * 0.14;
    const taxesBart = (grossTaxesBart - taxesReductionBart) * 0.371;

    const grossTaxesIan = grossProfitIan - costsIan;
    let taxesReductionIan = 6670 + 2123 + (grossTaxesIan - 6670 - 2123) * 0.14;
    taxesReductionIan =
      taxesReductionIan > grossTaxesIan ? grossTaxesIan : taxesReductionIan;
    const taxesIan = (grossTaxesIan - taxesReductionIan) * 0.371;

    const grossTaxesNiels = grossProfitNiels - costsNiels;
    const taxesReductionNiels = grossTaxesNiels * 0.14;
    const taxesNiels = (grossTaxesNiels - taxesReductionNiels) * 0.371;

    const netProfitBart = grossProfitBart - costsBart - taxesBart;
    const netProfitIan = grossProfitIan - costsIan - taxesIan;
    const netProfitNiels = grossProfitNiels - costsNiels - taxesNiels;

    const taxes = {
      Bart: [grossTaxesBart * 0.371, taxesReductionBart, taxesBart],
      Ian: [grossTaxesIan * 0.371, taxesReductionIan, taxesIan],
      Niels: [grossTaxesNiels * 0.371, taxesReductionNiels, taxesNiels],
    };

    return {
      chart: {
        type: 'column',
      },
      title: {
        text: 'Winst per vennoot',
      },
      xAxis: {
        categories: ['Bart', 'Ian', 'Niels'],
      },
      yAxis: {
        min: 0,
        title: {
          text: 'Winst',
        },
      },
      tooltip: {
        // eslint-disable-next-line object-shorthand,func-names
        formatter: function () {
          // eslint-disable-next-line @typescript-eslint/no-this-alias
          const val = this;

          if (!val.points) return null;

          const person = val.x as unknown as keyof typeof taxes;
          return `
            <b>Winstberekening ${person}</b><br/><br/>

            Bruto winst: ${currencyFormatter.format(
              val.points[0].point.total || 0,
            )}<br/><br/>

            Kosten: ${currencyFormatter.format(val.points[0].point.y || 0)}<br/>
            Aftrekposten: ${currencyFormatter.format(
              taxes[person][1] || 0,
            )}<br/>
            Bruto belasting: ${currencyFormatter.format(
              taxes[person][0] || 0,
            )}<br/>
            Netto belasting: ${currencyFormatter.format(
              taxes[person][2] || 0,
            )}<br/><br/>

            <b>Netto winst: ${currencyFormatter.format(
              val.points[2].point.y || 0,
            )}</b><br/><br/>
          `;
        },
        pointFormat:
          '<span style="color:{series.color}">{series.name}</span>: <b>€ {point.y:.2f}</b> ({point.percentage:.0f}%)<br/>',
        shared: true,
      },
      plotOptions: {
        column: {
          stacking: 'normal',
        },
      },
      series: [
        {
          type: 'column',
          name: 'Kosten',
          data: [costsBart, costsIan, costsNiels],
          color: 'pink',
        },
        {
          type: 'column',
          name: 'Belasting',
          data: [taxesBart, taxesIan, taxesNiels],
          color: '#5b91b7',
        },
        {
          type: 'column',
          name: 'Nettowinst*',
          data: [netProfitBart, netProfitIan, netProfitNiels],
          color: 'green',
        },
      ],
      credits: {
        enabled: false,
      },
      exporting: {
        enabled: false,
      },
    };
  }, [props, grossProfitBart, grossProfitIan, grossProfitNiels]);

  return (
    <>
      <h2>Virtuele kapitaalrekeningen</h2>
      <ul>
        <li>
          <strong>Bruto winst: {currencyFormatter.format(totalProfit)}</strong>
        </li>
        <li>Bart: {currencyFormatter.format(grossProfitBart!)}</li>
        <li>Ian: {currencyFormatter.format(grossProfitIan!)}</li>
        <li>Niels: {currencyFormatter.format(grossProfitNiels!)}</li>
      </ul>
      <HighchartsReact highcharts={Highcharts} options={slicingPieOptions} />
      <HighchartsReact highcharts={Highcharts} options={profitOptions} />
    </>
  );
}
