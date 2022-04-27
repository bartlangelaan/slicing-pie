import { useMemo } from 'react';
import Highcharts from 'highcharts';
import styled from 'styled-components';
import HighchartsReact from 'highcharts-react-official';
import configs from 'utils/slicingPieConfig';
import useNetProfit from 'hooks/useNetProfit';
import { GetSlicingPieResponse } from './GetSlicingPieResponse';
import { useSlicingPie } from '../SlicingPieContext';

const currencyFormatter = Intl.NumberFormat('nl', {
  style: 'currency',
  currency: 'EUR',
});

const TableHead = styled.thead`
  top: 78px;
`;

export function NetProfitTable(props: GetSlicingPieResponse) {
  const { periodFilter } = useSlicingPie();

  const config = configs[periodFilter];

  const pie = useNetProfit(props);

  const profitOptions: Highcharts.Options = useMemo(() => {
    return {
      chart: {
        type: 'column',
        backgroundColor: 'transparent',
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
        borderColor: '#3790c3',
        backgroundColor: 'white',
        followPointer: false,
        borderRadius: 2,
        outide: true,
        useHTML: true,
        style: {
          fontFamily: 'Roboto',
          fontSize: '15px',
          marginTop: -100,
        },
        // eslint-disable-next-line object-shorthand,func-names
        formatter: function () {
          // eslint-disable-next-line @typescript-eslint/no-this-alias
          const val = this;

          if (!val.points) return null;

          const taxes = {
            Bart: {
              applyStartupDeduction: pie.applyStartupDeduction.bart,
              deduction: pie.entrepreneursDeduction.bart,
              netTax: pie.netTax.bart,
              contributionHIA: pie.contributionHIA.bart,
              meetsHourCriterium: pie.meetsHourCriterium.bart,
            },
            Ian: {
              applyStartupDeduction: pie.applyStartupDeduction.ian,
              deduction: pie.entrepreneursDeduction.ian,
              netTax: pie.netTax.ian,
              contributionHIA: pie.contributionHIA.ian,
              meetsHourCriterium: pie.meetsHourCriterium.ian,
            },
            Niels: {
              applyStartupDeduction: pie.applyStartupDeduction.niels,
              deduction: pie.entrepreneursDeduction.niels,
              netTax: pie.netTax.niels,
              contributionHIA: pie.contributionHIA.niels,
              meetsHourCriterium: pie.meetsHourCriterium.niels,
            },
          };

          const person = val.x as unknown as keyof typeof taxes;

          return `
            <b>Winstberekening ${person}</b><br/><br/>

            Bruto winst: ${currencyFormatter.format(
              val.points[0].point.total || 0,
            )}<br/><br/>

            Persoonlijke kosten: ${currencyFormatter.format(
              val.points[0].point.y || 0,
            )}<br/>
            Aftrekposten: ${
              taxes[person].meetsHourCriterium
                ? currencyFormatter.format(taxes[person].deduction || 0)
                : 'N.v.t.'
            }<br/>
            Netto IB: ${currencyFormatter.format(
              taxes[person].netTax || 0,
            )}<br/>
            Bijdrage Zvw en Wlz: ${currencyFormatter.format(
              taxes[person].contributionHIA || 0,
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
          name: 'Persoonlijke kosten',
          data: [pie.costs.bart, pie.costs.ian, pie.costs.niels],
          color: 'pink',
        },
        {
          type: 'column',
          name: 'Belasting',
          data: [
            pie.netTax.bart + pie.contributionHIA.bart,
            pie.netTax.ian + pie.contributionHIA.ian,
            pie.netTax.niels + pie.contributionHIA.niels,
          ],
          color: '#5b91b7',
        },
        {
          type: 'column',
          name: 'Nettowinst',
          data: [pie.netProfit.bart, pie.netProfit.ian, pie.netProfit.niels],
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
  }, [pie]);

  return (
    <>
      <div className="bg-white shadow-lg rounded mt-12">
        <table className="w-full table-auto">
          <TableHead className="sticky z-10">
            <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-right bg-gray-200 z-10" scope="col">
                &nbsp;
              </th>
              <th className="py-3 px-6 text-right bg-gray-200 z-10" scope="col">
                Totaal
              </th>
              <th className="py-3 px-6 text-right bg-gray-200 z-10" scope="col">
                Bart
              </th>
              <th className="py-3 px-6 text-right bg-gray-200 z-10" scope="col">
                Ian
              </th>
              <th className="py-3 px-6 text-right bg-gray-200 z-10" scope="col">
                Niels
              </th>
            </tr>
          </TableHead>
          <tbody className="text-gray-600 text-sm font-light">
            <tr className="border-b border-gray-200 text-xs hover:bg-gray-100">
              <td className="py-3 px-6 text-right border-r italic">
                <div>
                  <span>
                    Simuleer extra bruto winst (= omzet - algemene kosten)
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right border-r italic">
                <div className="relative ml-auto w-max">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span>&euro;</span>
                  </div>
                  <input
                    className="appearance-none w-28 bg-gray-200 text-gray-700 border border-gray-200 rounded py-2 pl-6 pr-2 leading-tight focus:outline-none focus:bg-white focus:border-gray-500 text-sm"
                    type="number"
                    value={pie.simulatedExtraProfit}
                    size={60}
                    onChange={(e) => {
                      pie.setSimulatedExtraProfit(
                        parseFloat(e.target.value) || 0,
                      );
                    }}
                  />
                </div>
              </td>
              <td className="py-3 px-6 text-right" />
              <td className="py-3 px-6 text-right" />
              <td className="py-3 px-6 text-right" />
            </tr>
            <tr className="border-b border-gray-200 text-xs hover:bg-gray-100">
              <td className="py-3 px-6 text-right border-r italic">
                <div>
                  <span>Simuleer extra persoonlijke kosten</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right border-r italic">
                <div>
                  <span>
                    {currencyFormatter.format(
                      pie.simulatedExtraPersonalCosts.total,
                    )}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div className="relative ml-auto w-max">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span>&euro;</span>
                  </div>
                  <input
                    className="appearance-none w-28 bg-gray-200 text-gray-700 border border-gray-200 rounded py-2 pl-6 pr-2 leading-tight focus:outline-none focus:bg-white focus:border-gray-500 text-sm"
                    type="number"
                    value={pie.simulatedExtraPersonalCosts.bart}
                    size={60}
                    onChange={(e) => {
                      pie.setSimulatedExtraCosts(
                        'bart',
                        parseFloat(e.target.value) || 0,
                      );
                    }}
                  />
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div className="relative ml-auto w-max">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span>&euro;</span>
                  </div>
                  <input
                    className="appearance-none w-28 bg-gray-200 text-gray-700 border border-gray-200 rounded py-2 pl-6 pr-2 leading-tight focus:outline-none focus:bg-white focus:border-gray-500 text-sm"
                    type="number"
                    value={pie.simulatedExtraPersonalCosts.ian || 0}
                    size={60}
                    onChange={(e) => {
                      pie.setSimulatedExtraCosts(
                        'ian',
                        parseFloat(e.target.value) || 0,
                      );
                    }}
                  />
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div className="relative ml-auto w-max">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span>&euro;</span>
                  </div>
                  <input
                    className="appearance-none w-28 bg-gray-200 text-gray-700 border border-gray-200 rounded py-2 pl-6 pr-2 leading-tight focus:outline-none focus:bg-white focus:border-gray-500 text-sm"
                    type="number"
                    value={pie.simulatedExtraPersonalCosts.niels || 0}
                    size={60}
                    onChange={(e) => {
                      pie.setSimulatedExtraCosts(
                        'niels',
                        parseFloat(e.target.value) || 0,
                      );
                    }}
                  />
                </div>
              </td>
            </tr>
            <tr className="border-b border-gray-200 text-xs hover:bg-gray-100">
              <td className="py-3 px-6 text-right border-r italic">
                <div>
                  <span>Simuleer extra uren</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right border-r italic">
                <div>
                  <span>{pie.simulatedExtraHours.total || 0}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div className="relative ml-auto w-max">
                  <input
                    className="appearance-none w-28 bg-gray-200 text-gray-700 border border-gray-200 rounded py-2 pl-6 pr-2 leading-tight focus:outline-none focus:bg-white focus:border-gray-500 text-sm"
                    type="number"
                    value={pie.simulatedExtraHours.bart}
                    size={60}
                    onChange={(e) => {
                      pie.setSimulatedExtraHours(
                        'bart',
                        parseInt(e.target.value, 10) || 0,
                      );
                    }}
                  />
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div className="relative ml-auto w-max">
                  <input
                    className="appearance-none w-28 bg-gray-200 text-gray-700 border border-gray-200 rounded py-2 pl-6 pr-2 leading-tight focus:outline-none focus:bg-white focus:border-gray-500 text-sm"
                    type="number"
                    value={pie.simulatedExtraHours.ian}
                    size={60}
                    onChange={(e) => {
                      pie.setSimulatedExtraHours(
                        'ian',
                        parseInt(e.target.value, 10) || 0,
                      );
                    }}
                  />
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div className="relative ml-auto w-max">
                  <input
                    className="appearance-none w-28 bg-gray-200 text-gray-700 border border-gray-200 rounded py-2 pl-6 pr-2 leading-tight focus:outline-none focus:bg-white focus:border-gray-500 text-sm"
                    type="number"
                    value={pie.simulatedExtraHours.niels || 0}
                    size={60}
                    onChange={(e) => {
                      pie.setSimulatedExtraHours(
                        'niels',
                        parseInt(e.target.value, 10) || 0,
                      );
                    }}
                  />
                </div>
              </td>
            </tr>
            <tr className="h-10 border-b">
              <td className="border-r" />
              <td className="border-r" />
              <td colSpan={3} />
            </tr>
            <tr className="border-b border-gray-200 hover:bg-gray-100">
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span className="font-medium">Voldoet aan urencriterium</span>
                  <div className="text-xs italic">
                    Automatisch berekend o.b.v. geschreven uren tussen 1{' '}
                    {config.filterHoursFromJuly ? 'juli' : 'januari'} en 31
                    december
                  </div>
                </div>
              </td>
              <td className="py-3 px-6 text-center border-r">
                <input
                  type="checkbox"
                  className="form-checkbox rounded"
                  checked={pie.meetsHourCriterium.all}
                  onChange={() => {
                    pie.toggleMeetsHourCriterium('all');
                  }}
                />
              </td>
              <td className="py-3 px-6 text-center">
                <div>
                  <input
                    type="checkbox"
                    className="form-checkbox rounded"
                    checked={pie.meetsHourCriterium.bart}
                    onChange={() => {
                      pie.toggleMeetsHourCriterium('bart');
                    }}
                  />
                  <div className="mt-2">
                    min. {config.minHoursPerWeek.toFixed(1)} uur / week
                  </div>
                  <div className="mt-2">
                    nu {pie.hoursPerWeek.bart.toFixed(1)} uur / week
                  </div>
                  <div className="mt-2">
                    {pie.allHours.bart.toFixed(0)} /{' '}
                    {config.hourCriterium.toFixed(0)} uren geboekt
                  </div>
                </div>
              </td>
              <td className="py-3 px-6 text-center">
                <div>
                  <input
                    type="checkbox"
                    className="form-checkbox rounded"
                    checked={pie.meetsHourCriterium.ian}
                    onChange={() => {
                      pie.toggleMeetsHourCriterium('ian');
                    }}
                  />
                  <div className="mt-2">
                    min. {config.minHoursPerWeek.toFixed(1)} uur / week
                  </div>
                  <div className="mt-2">
                    nu {pie.hoursPerWeek.ian.toFixed(1)} uur / week
                  </div>
                  <div className="mt-2">
                    {pie.allHours.ian.toFixed(0)} /{' '}
                    {config.hourCriterium.toFixed(0)} uren geboekt
                  </div>
                </div>
              </td>
              <td className="py-3 px-6 text-center">
                <div>
                  <input
                    type="checkbox"
                    className="form-checkbox rounded"
                    checked={pie.meetsHourCriterium.niels}
                    onChange={() => {
                      pie.toggleMeetsHourCriterium('niels');
                    }}
                  />
                  <div className="mt-2">
                    min. {config.minHoursPerWeek.toFixed(1)} uur / week
                  </div>
                  <div className="mt-2">
                    nu {pie.hoursPerWeek.niels.toFixed(1)} uur / week
                  </div>
                  <div className="mt-2">
                    {pie.allHours.niels.toFixed(0)} /{' '}
                    {config.hourCriterium.toFixed(0)} uren geboekt
                  </div>
                </div>
              </td>
            </tr>
            <tr className="border-b border-gray-200 hover:bg-gray-100">
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span className="font-medium">Pas startersaftrek toe</span>
                  <div className="text-xs italic">
                    Wel of niet de startersaftrek toepassen? Mag 3 keer in de
                    eerste 5 jaar.
                  </div>
                </div>
              </td>
              <td className="py-3 px-6 text-center border-r">
                <input
                  type="checkbox"
                  className="form-checkbox rounded"
                  checked={pie.applyStartupDeduction.all}
                  onChange={() => {
                    pie.toggleApplyStartupDeduction('all');
                  }}
                />
              </td>
              <td className="py-3 px-6 text-center">
                <div>
                  <input
                    type="checkbox"
                    className="form-checkbox rounded"
                    checked={pie.applyStartupDeduction.bart}
                    onChange={() => {
                      pie.toggleApplyStartupDeduction('bart');
                    }}
                  />
                </div>
              </td>
              <td className="py-3 px-6 text-center">
                <div>
                  <input
                    type="checkbox"
                    className="form-checkbox rounded"
                    checked={pie.applyStartupDeduction.ian}
                    onChange={() => {
                      pie.toggleApplyStartupDeduction('ian');
                    }}
                  />
                </div>
              </td>
              <td className="py-3 px-6 text-center">
                <div>
                  <input
                    type="checkbox"
                    className="form-checkbox rounded"
                    checked={pie.applyStartupDeduction.niels}
                    onChange={() => {
                      pie.toggleApplyStartupDeduction('niels');
                    }}
                  />
                </div>
              </td>
            </tr>
            <tr className="h-10 border-b">
              <td className="border-r" />
              <td className="border-r" />
              <td colSpan={3} />
            </tr>
            <tr className="border-b border-gray-200 hover:bg-gray-100">
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span className="font-medium">Slicing pie</span>
                  <div className="text-xs italic">
                    Som na toepassen verdeelsleutel tussen dit jaar (
                    {100 - config.pieDistributionKey * 100}%) en vorig jaar (
                    {config.pieDistributionKey * 100}%)
                  </div>
                </div>
              </td>
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span className="font-medium">100%</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {Math.round(pie.piePercentageResult.bart * 1000) / 10}%
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {Math.round(pie.piePercentageResult.ian * 1000) / 10}%
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {Math.round(pie.piePercentageResult.niels * 1000) / 10}%
                  </span>
                </div>
              </td>
            </tr>
            <tr className="border-b border-gray-200 text-xs italic hover:bg-gray-100">
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span>Slicing pie dit jaar</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span>100%</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {Math.round(pie.piePercentageThisYear.bart * 1000) / 10}%
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {Math.round(pie.piePercentageThisYear.ian * 1000) / 10}%
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {Math.round(pie.piePercentageThisYear.niels * 1000) / 10}%
                  </span>
                </div>
              </td>
            </tr>
            <tr className="border-b border-gray-200 text-xs italic hover:bg-gray-100">
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span>Slicing pie vorig jaar</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span>100%</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {Math.round(config.lastYearPie.bart * 1000) / 10}%
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{Math.round(config.lastYearPie.ian * 1000) / 10}%</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {Math.round(config.lastYearPie.niels * 1000) / 10}%
                  </span>
                </div>
              </td>
            </tr>
            <tr className="h-10 border-b">
              <td className="border-r" />
              <td className="border-r" />
              <td colSpan={3} />
            </tr>
            <tr className="border-b border-gray-200 hover:bg-gray-100 mb-10">
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span className="font-medium">Bruto winst</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span className="font-medium">
                    {currencyFormatter.format(pie.totalProfit)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {currencyFormatter.format(
                      pie.grossProfitBeforePersonalCosts.bart,
                    )}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {currencyFormatter.format(
                      pie.grossProfitBeforePersonalCosts.ian,
                    )}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {currencyFormatter.format(
                      pie.grossProfitBeforePersonalCosts.niels,
                    )}
                  </span>
                </div>
              </td>
            </tr>
            <tr className="border-b border-gray-200 text-xs italic hover:bg-gray-100">
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span>Omzet</span>
                </div>
                <div className="text-xs italic">
                  <a
                    href={`https://moneybird.com/313185156605150255/sales_invoices/filter/period:${
                      // @todo fix for 2023.
                      periodFilter === 2021 && new Date().getFullYear() === 2022
                        ? 'prev_year'
                        : 'this_year'
                    },state:scheduled%7Copen%7Cpending_payment%7Clate%7Creminded%7Cpaid`}
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                  >
                    Alle betaalde en openstaande facturen
                  </a>
                </div>
              </td>
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span>{currencyFormatter.format(pie.totalRevenue)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(pie.grossRevenue.bart)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(pie.grossRevenue.ian)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {currencyFormatter.format(pie.grossRevenue.niels)}
                  </span>
                </div>
              </td>
            </tr>
            <tr className="border-b border-gray-200 text-xs italic hover:bg-gray-100">
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span>Algemene kosten</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span>
                    {currencyFormatter.format(pie.generalCosts.total)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(pie.generalCosts.bart)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(pie.generalCosts.ian)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {currencyFormatter.format(pie.generalCosts.niels)}
                  </span>
                </div>
              </td>
            </tr>
            <tr className="h-10 border-b">
              <td className="border-r" />
              <td className="border-r" />
              <td colSpan={3} />
            </tr>
            <tr className="h-10 border-b">
              <td className="border-r" />
              <td className="border-r" />
              <td colSpan={3} />
            </tr>
            <tr className="border-b border-gray-200 hover:bg-gray-100">
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span className="font-medium">Persoonlijke kosten</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span className="font-medium">
                    {currencyFormatter.format(pie.costs.total)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(pie.costs.bart)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(pie.costs.ian)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(pie.costs.niels)}</span>
                </div>
              </td>
            </tr>
            <tr className="border-b border-gray-200 text-xs italic hover:bg-gray-100">
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span>Subtotaal belastbare winst</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span>
                    {currencyFormatter.format(
                      props.totalProfit.plus -
                        props.totalProfit.min -
                        pie.costs.total,
                    )}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(pie.grossProfit.bart)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(pie.grossProfit.ian)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(pie.grossProfit.niels)}</span>
                </div>
              </td>
            </tr>
            <tr className="h-10 border-b">
              <td className="border-r" />
              <td className="border-r" />
              <td colSpan={3} />
            </tr>
            <tr className="border-b border-gray-200 hover:bg-gray-100">
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span className="font-medium">Zelfstandigenaftrek</span>
                  <div className="text-xs italic">
                    Max. 100% of{' '}
                    {currencyFormatter.format(config.maxSelfEmployedDeduction)}
                  </div>
                </div>
              </td>
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span className="font-medium">
                    {currencyFormatter.format(pie.selfEmployedDeduction.total)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {currencyFormatter.format(pie.selfEmployedDeduction.bart)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {currencyFormatter.format(pie.selfEmployedDeduction.ian)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {currencyFormatter.format(pie.selfEmployedDeduction.niels)}
                  </span>
                </div>
              </td>
            </tr>
            <tr className="border-b border-gray-200 hover:bg-gray-100">
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span className="font-medium">Startersaftrek</span>
                  <div className="text-xs italic">
                    Max. 100% of{' '}
                    {currencyFormatter.format(config.maxStartupDeduction)}
                  </div>
                </div>
              </td>
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span className="font-medium">
                    {currencyFormatter.format(pie.startupDeduction.total)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {currencyFormatter.format(pie.startupDeduction.bart)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {currencyFormatter.format(pie.startupDeduction.ian)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {currencyFormatter.format(pie.startupDeduction.niels)}
                  </span>
                </div>
              </td>
            </tr>
            <tr className="border-b border-gray-200 hover:bg-gray-100">
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span className="font-medium">
                    Kleinschaligheidsinvesteringsaftrek (KIA)
                  </span>
                  <div className="text-xs italic">
                    Totale investering tussen{' '}
                    {currencyFormatter.format(config.minSSIDeduction)} en{' '}
                    {currencyFormatter.format(config.maxSSIDeduction)}
                  </div>
                  <div className="text-xs italic">
                    {Math.round(config.SSIDectionPercentage * 100)}% van het
                    investeringsbedrag
                  </div>
                </div>
              </td>
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span className="font-medium">
                    {currencyFormatter.format(pie.SSIDeduction.total)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(pie.SSIDeduction.bart)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(pie.SSIDeduction.ian)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {currencyFormatter.format(pie.SSIDeduction.niels)}
                  </span>
                </div>
              </td>
            </tr>
            <tr className="border-b border-gray-200 text-xs italic hover:bg-gray-100">
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span>Totaal ondernemersaftrek</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span>
                    {currencyFormatter.format(pie.entrepreneursDeduction.total)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {currencyFormatter.format(pie.entrepreneursDeduction.bart)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {currencyFormatter.format(pie.entrepreneursDeduction.ian)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {currencyFormatter.format(pie.entrepreneursDeduction.niels)}
                  </span>
                </div>
              </td>
            </tr>
            <tr className="border-b border-gray-200 text-xs italic hover:bg-gray-100">
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span>Subtotaal belastbare winst</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span>
                    {currencyFormatter.format(
                      pie.grossProfitAfterEntrepreneurDeduction.total,
                    )}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {currencyFormatter.format(
                      pie.grossProfitAfterEntrepreneurDeduction.bart,
                    )}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {currencyFormatter.format(
                      pie.grossProfitAfterEntrepreneurDeduction.ian,
                    )}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {currencyFormatter.format(
                      pie.grossProfitAfterEntrepreneurDeduction.niels,
                    )}
                  </span>
                </div>
              </td>
            </tr>
            <tr className="h-10 border-b">
              <td className="border-r" />
              <td className="border-r" />
              <td colSpan={3} />
            </tr>
            <tr className="border-b border-gray-200 hover:bg-gray-100">
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span className="font-medium">Mkb-winstvrijstelling</span>
                  <div className="text-xs italic">
                    Altijd {Math.round(config.profitExemptionPercentage * 100)}%
                  </div>
                </div>
              </td>
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span className="font-medium">
                    {currencyFormatter.format(pie.profitExemption.total)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {currencyFormatter.format(pie.profitExemption.bart)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {currencyFormatter.format(pie.profitExemption.ian)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {currencyFormatter.format(pie.profitExemption.niels)}
                  </span>
                </div>
              </td>
            </tr>
            <tr className="border-b border-gray-200 text-xs italic hover:bg-gray-100">
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span>Subtotaal belastbare winst</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span>
                    {currencyFormatter.format(
                      pie.grossProfitAfterExemption.total,
                    )}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {currencyFormatter.format(
                      pie.grossProfitAfterExemption.bart,
                    )}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {currencyFormatter.format(
                      pie.grossProfitAfterExemption.ian,
                    )}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {currencyFormatter.format(
                      pie.grossProfitAfterExemption.niels,
                    )}
                  </span>
                </div>
              </td>
            </tr>
            <tr className="h-10 border-b">
              <td className="border-r" />
              <td className="border-r" />
              <td colSpan={3} />
            </tr>
            <tr className="border-b border-gray-200 hover:bg-gray-100">
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span className="font-medium">
                    Belastbaar inkomen uit Popup
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span className="font-medium">
                    {currencyFormatter.format(
                      pie.grossProfitAfterExemption.total,
                    )}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {currencyFormatter.format(
                      pie.grossProfitAfterExemption.bart,
                    )}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {currencyFormatter.format(
                      pie.grossProfitAfterExemption.ian,
                    )}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {currencyFormatter.format(
                      pie.grossProfitAfterExemption.niels,
                    )}
                  </span>
                </div>
              </td>
            </tr>
            <tr className="border-b border-gray-200 hover:bg-gray-100">
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span className="font-medium">
                    Netto inkomstenbelasting schijf 1
                  </span>
                  <div className="text-xs italic">
                    {config.taxPercentage1 * 100}% over alles tot{' '}
                    {currencyFormatter.format(config.taxPercentage2From)}
                  </div>
                </div>
              </td>
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span>{currencyFormatter.format(pie.netTax1.total)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(pie.netTax1.bart)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(pie.netTax1.ian)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(pie.netTax1.niels)}</span>
                </div>
              </td>
            </tr>
            <tr className="border-b border-gray-200 hover:bg-gray-100">
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span className="font-medium">
                    Netto inkomstenbelasting schijf 2
                  </span>
                  <div className="text-xs italic">
                    {config.taxPercentage2 * 100}% over alles boven de{' '}
                    {currencyFormatter.format(config.taxPercentage2From)}
                  </div>
                </div>
              </td>
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span>{currencyFormatter.format(pie.netTax2.total)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(pie.netTax2.bart)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(pie.netTax2.ian)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(pie.netTax2.niels)}</span>
                </div>
              </td>
            </tr>
            <tr className="border-b border-gray-200 hover:bg-gray-100">
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span className="font-medium">
                    Inkomensafhankelijke bijdrage Zvw en Wlz
                  </span>
                  <div className="text-xs italic">
                    {config.HIAPercentage * 100}%, max.{' '}
                    {currencyFormatter.format(config.maxHIA)}
                  </div>
                </div>
              </td>
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span>
                    {currencyFormatter.format(pie.contributionHIA.total)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {currencyFormatter.format(pie.contributionHIA.bart)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {currencyFormatter.format(pie.contributionHIA.ian)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {currencyFormatter.format(pie.contributionHIA.niels)}
                  </span>
                </div>
              </td>
            </tr>
            <tr className="border-b border-gray-20 hover:bg-gray-100">
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span className="font-medium">Algemene heffingskorting</span>
                  <div className="text-xs italic">
                    {currencyFormatter.format(
                      config.generalTaxCredit.maxGeneralTaxCredit,
                    )}{' '}
                    - ((inkomen -{' '}
                    {currencyFormatter.format(
                      config.generalTaxCredit.generalTaxCreditThreshold,
                    )}
                    ) *{' '}
                    {Math.round(
                      config.generalTaxCredit.generalTaxCreditPercentage *
                        1000000,
                    ) / 10000}
                    %
                  </div>
                </div>
              </td>
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span>
                    {currencyFormatter.format(pie.generalTaxCredit.total * -1)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {config.incomeFromEmployment.bart
                      ? '-'
                      : currencyFormatter.format(
                          pie.generalTaxCredit.bart * -1,
                        )}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {config.incomeFromEmployment.ian
                      ? '-'
                      : currencyFormatter.format(pie.generalTaxCredit.ian * -1)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {config.incomeFromEmployment.niels
                      ? '-'
                      : currencyFormatter.format(
                          pie.generalTaxCredit.niels * -1,
                        )}
                  </span>
                </div>
              </td>
            </tr>
            <tr className="border-b border-gray-200 hover:bg-gray-100">
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span className="font-medium">Arbeidskorting</span>
                  <div className="text-xs italic">
                    {currencyFormatter.format(
                      config.labourTaxCredit.maxLabourTaxCredit,
                    )}{' '}
                    - ((inkomen -{' '}
                    {currencyFormatter.format(
                      config.labourTaxCredit.labourTaxCreditMinThreshold,
                    )}
                    ) *{' '}
                    {Math.round(
                      config.labourTaxCredit.labourTaxCreditPercentage * 100000,
                    ) / 1000}
                    %
                  </div>
                  <div className="text-xs italic">
                    Bij belastbare inkomen hoger dan{' '}
                    {currencyFormatter.format(
                      config.labourTaxCredit.labourTaxCreditMaxThreshold,
                    )}
                    , is de arbeidskorting {currencyFormatter.format(0)}
                  </div>
                </div>
              </td>
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span>
                    {currencyFormatter.format(pie.labourTaxCredit.total * -1)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {config.incomeFromEmployment.bart
                      ? '-'
                      : currencyFormatter.format(pie.labourTaxCredit.bart * -1)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {config.incomeFromEmployment.ian
                      ? '-'
                      : currencyFormatter.format(pie.labourTaxCredit.ian * -1)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {config.incomeFromEmployment.niels
                      ? '-'
                      : currencyFormatter.format(
                          pie.labourTaxCredit.niels * -1,
                        )}
                  </span>
                </div>
              </td>
            </tr>
            <tr className="h-10 border-b">
              <td className="border-r" />
              <td className="border-r" />
              <td colSpan={3} />
            </tr>
            <tr className="border-b border-gray-200 bg-gray-50 hover:bg-gray-100">
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span className="font-medium">Netto winst uit Popup</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span className="font-medium">
                    {currencyFormatter.format(pie.netProfit.total)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(pie.netProfit.bart)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(pie.netProfit.ian)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(pie.netProfit.niels)}</span>
                </div>
              </td>
            </tr>

            <tr className="h-10 border-b">
              <td className="border-r" />
              <td className="border-r" />
              <td colSpan={3} />
            </tr>
            <tr className="border-b border-gray-200 bg-gray-50 hover:bg-gray-100">
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span className="font-medium">
                    Beschikbaar om te onttrekken
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span className="font-medium">
                    {currencyFormatter.format(pie.netLeft.total)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(pie.netLeft.bart)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(pie.netLeft.ian)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(pie.netLeft.niels)}</span>
                </div>
              </td>
            </tr>
            <tr className="border-b border-gray-200 text-xs italic bg-gray-50 hover:bg-gray-100">
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span>Waarvan winst</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span>
                    {currencyFormatter.format(
                      pie.netLeft.total - pie.totalTax.total,
                    )}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {currencyFormatter.format(
                      pie.netLeft.bart - pie.totalTax.bart,
                    )}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {currencyFormatter.format(
                      pie.netLeft.ian - pie.totalTax.ian,
                    )}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {currencyFormatter.format(
                      pie.netLeft.niels - pie.totalTax.niels,
                    )}
                  </span>
                </div>
              </td>
            </tr>
            <tr className="border-b border-gray-200 text-xs italic bg-gray-50 hover:bg-gray-100">
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span>Waarvan belasting (IB & Zvw) €</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span>{currencyFormatter.format(pie.totalTax.total)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(pie.totalTax.bart)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(pie.totalTax.ian)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(pie.totalTax.niels)}</span>
                </div>
              </td>
            </tr>
            <tr className="border-b border-gray-200 text-xs italic bg-gray-50 hover:bg-gray-100">
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span>Waarvan belasting (IB & Zvw) %</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span>
                    {Math.round(pie.totalTaxPercentage.average * 1000) / 10}%
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {Math.round(pie.totalTaxPercentage.bart * 1000) / 10}%
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {Math.round(pie.totalTaxPercentage.ian * 1000) / 10}%
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {Math.round(pie.totalTaxPercentage.niels * 1000) / 10}%
                  </span>
                </div>
              </td>
            </tr>
            <tr className="border-b border-gray-200 text-xs italic bg-gray-50 hover:bg-gray-100">
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span>Reeds onttrokken</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span>{currencyFormatter.format(pie.withDrawals.total)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(pie.withDrawals.bart)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(pie.withDrawals.ian)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(pie.withDrawals.niels)}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="mt-12 shadow-lg p-8 bg-white flex justify-center">
        <HighchartsReact highcharts={Highcharts} options={profitOptions} />
      </div>
    </>
  );
}
