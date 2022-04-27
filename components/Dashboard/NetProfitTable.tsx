import { useMemo, useState } from 'react';
import Highcharts from 'highcharts';
import styled from 'styled-components';
import HighchartsReact from 'highcharts-react-official';
import { GetSlicingPieResponse } from './GetSlicingPieResponse';
import { useSlicingPie } from '../SlicingPieContext';

const config2021 = {
  taxPercentage: 0.371,
  HIAPercentage: 0.0575,
  maxHIA: 3353,
  filterHoursFromJuly: true,
  hourCriterium: 1225 - 24 * 26,
  minHoursPerWeek: (1225 - 24 * 26) / 26,
  maxSelfEmployedDeduction: 6670,
  maxStartupDeduction: 2123,
  SSIDeductionValueBart: 0,
  SSIDeductionValueIan: 3122.32,
  SSIDeductionValueNiels: 778.42,
  minSSIDeduction: 2401,
  maxSSIDeduction: 59170,
  SSIDectionPercentage: 0.28,
  profitExemptionPercentage: 0.14,
  pieDistributionKey: 0,
  lastYearPie: {
    bart: 0,
    ian: 0,
    niels: 0,
  },
};

const config2022 = {
  ...config2021,
  filterHoursFromJuly: false,
  hourCriterium: 1225,
  minHoursPerWeek: 1225 / 52,
  pieDistributionKey: 0.2,
  SSIDeductionValueBart: 0,
  SSIDeductionValueIan: 0,
  SSIDeductionValueNiels: 0,
  lastYearPie: {
    bart: 0.0669,
    ian: 0.7853,
    niels: 0.1478,
  },
};

const configs = {
  2021: config2021,
  2022: config2022,
};

const currencyFormatter = Intl.NumberFormat('nl', {
  style: 'currency',
  currency: 'EUR',
});

function calculateSelfEmployedDeduction(
  grossProfit: number,
  hourCriterium: boolean,
  maxSelfEmployedDeduction: number,
) {
  if (!hourCriterium) return 0;

  if (grossProfit < maxSelfEmployedDeduction) return grossProfit;

  return maxSelfEmployedDeduction;
}

function calculateStartupDeduction(
  grossProfit: number,
  hourCriterium: boolean,
  applyStartupDeduction: boolean,
  maxDeduction: number,
) {
  if (!hourCriterium || !applyStartupDeduction) return 0;

  if (grossProfit < maxDeduction) return grossProfit;

  return maxDeduction;
}

function calculateHIA(
  grossProfitAfterEntrepreneurDeduction: number,
  HIAPercentage: number,
  maxHIA: number,
) {
  const HIA = grossProfitAfterEntrepreneurDeduction * HIAPercentage;

  return HIA > maxHIA ? maxHIA : HIA;
}

const TableHead = styled.thead`
  top: 78px;
`;

export function NetProfitTable(props: GetSlicingPieResponse) {
  const { periodFilter } = useSlicingPie();

  const config = configs[periodFilter];

  const [meetsHourCriteriumAll, setMeetsHourCriteriumAll] = useState(false);
  const [meetsHourCriteriumBart, setMeetsHourCriteriumBart] = useState(false);
  const [meetsHourCriteriumIan, setMeetsHourCriteriumIan] = useState(true);
  const [meetsHourCriteriumNiels, setMeetsHourCriteriumNiels] = useState(false);

  const [applyStartupDeductionAll, setApplyDeductionAll] = useState(false);
  const [applyStartupDeductionBart, setApplyDeductionBart] = useState(false);
  const [applyStartupDeductionIan, setApplyDeductionIan] = useState(false);
  const [applyStartupDeductionNiels, setApplyDeductionNiels] = useState(false);

  const [simulatedExtraProfit, setSimulatedExtraProfit] = useState(0);

  const [simulatedExtraCostsBart, setSimulatedExtraCostsBart] = useState(0);
  const [simulatedExtraCostsIan, setSimulatedExtraCostsIan] = useState(0);
  const [simulatedExtraCostsNiels, setSimulatedExtraCostsNiels] = useState(0);

  const [simulatedExtraHoursBart, setSimulatedExtraHoursBart] = useState(0);
  const [simulatedExtraHoursIan, setSimulatedExtraHoursIan] = useState(0);
  const [simulatedExtraHoursNiels, setSimulatedExtraHoursNiels] = useState(0);

  const numberOfPastWeeks =
    (Date.now() -
      new Date(
        config.filterHoursFromJuly ? '2021-07-01' : '2022-01-01',
      ).getTime()) /
    (7 * 24 * 60 * 60 * 1000);

  const simulatedExtraHours =
    (simulatedExtraHoursBart || 0) +
    (simulatedExtraHoursIan || 0) +
    (simulatedExtraHoursNiels || 0);
  const totalTimeSpentFiltered =
    props.totalTimeSpentFiltered + simulatedExtraHours;

  const filteredHoursBart =
    props.timeSpent.bart.yearFiltered + (simulatedExtraHoursBart || 0);
  const filteredHoursIan =
    props.timeSpent.ian.yearFiltered + (simulatedExtraHoursIan || 0);
  const filteredHoursNiels =
    props.timeSpent.niels.yearFiltered + (simulatedExtraHoursNiels || 0);

  const allHhoursBart =
    props.timeSpent.bart[config.filterHoursFromJuly ? 'fromJuly' : 'year'] +
    (simulatedExtraHoursBart || 0);
  const allHhoursIan =
    props.timeSpent.ian[config.filterHoursFromJuly ? 'fromJuly' : 'year'] +
    (simulatedExtraHoursIan || 0);
  const allHhoursNiels =
    props.timeSpent.niels[config.filterHoursFromJuly ? 'fromJuly' : 'year'] +
    (simulatedExtraHoursNiels || 0);

  const hoursPerWeekBart = allHhoursBart / numberOfPastWeeks;
  const hoursPerWeekIan = allHhoursIan / numberOfPastWeeks;
  const hoursPerWeekNiels = allHhoursNiels / numberOfPastWeeks;

  const percentageBartThisYear = filteredHoursBart / totalTimeSpentFiltered;
  const percentageIanThisYear = filteredHoursIan / totalTimeSpentFiltered;
  const percentageNielsThisYear = filteredHoursNiels / totalTimeSpentFiltered;

  const distributedPercentageBartThisYear =
    percentageBartThisYear * (1 - config.pieDistributionKey);
  const distributedPercentageIanThisYear =
    percentageIanThisYear * (1 - config.pieDistributionKey);
  const distributedPercentageNielsThisYear =
    percentageNielsThisYear * (1 - config.pieDistributionKey);

  const distributedPercentageBartLastYear =
    config.lastYearPie.bart * config.pieDistributionKey;
  const distributedPercentageIanLastYear =
    config.lastYearPie.ian * config.pieDistributionKey;
  const distributedPercentageNielsLastYear =
    config.lastYearPie.niels * config.pieDistributionKey;

  const percentageBart =
    distributedPercentageBartThisYear + distributedPercentageBartLastYear;
  const percentageIan =
    distributedPercentageIanThisYear + distributedPercentageIanLastYear;
  const percentageNiels =
    distributedPercentageNielsThisYear + distributedPercentageNielsLastYear;

  const costsBart =
    props.personalCosts.bart.plus -
    props.personalCosts.bart.min +
    props.personalGeneralJournalDocuments.bart.plus -
    props.personalGeneralJournalDocuments.bart.min +
    (simulatedExtraCostsBart || 0);
  const costsIan =
    props.personalCosts.ian.plus -
    props.personalCosts.ian.min +
    props.personalGeneralJournalDocuments.ian.plus -
    props.personalGeneralJournalDocuments.ian.min +
    (simulatedExtraCostsIan || 0);
  const costsNiels =
    props.personalCosts.niels.plus -
    props.personalCosts.niels.min +
    props.personalGeneralJournalDocuments.niels.plus -
    props.personalGeneralJournalDocuments.niels.min +
    (simulatedExtraCostsNiels || 0);

  const simulatedExtraPersonalCosts =
    (simulatedExtraCostsBart || 0) +
    (simulatedExtraCostsIan || 0) +
    (simulatedExtraCostsNiels || 0);

  const totalPersonalCosts = costsBart + costsIan + costsNiels;

  const totalRevenue =
    props.totalProfit.plus +
    props.totalProfit.openPlus +
    (simulatedExtraProfit || 0);

  const grossRevenueBart = totalRevenue * percentageBart || 0;
  const grossRevenueIan = totalRevenue * percentageIan || 0;
  const grossRevenueNiels = totalRevenue * percentageNiels || 0;

  const generalCosts =
    props.totalProfit.min +
    props.totalProfit.openMin +
    props.totalProfit.costOfSales +
    (simulatedExtraPersonalCosts || 0);

  const generalCostsBart = generalCosts * percentageBart || 0;
  const generalCostsIan = generalCosts * percentageIan || 0;
  const generalCostsNiels = generalCosts * percentageNiels || 0;

  const totalProfit =
    props.totalProfit.plus -
    props.totalProfit.min +
    props.totalProfit.openPlus -
    props.totalProfit.openMin -
    props.totalProfit.costOfSales +
    (simulatedExtraProfit || 0);

  const grossProfitBeforePersonalCostsBart = totalProfit * percentageBart || 0;
  const grossProfitBeforePersonalCostsIan = totalProfit * percentageIan || 0;
  const grossProfitBeforePersonalCostsNiels =
    totalProfit * percentageNiels || 0;

  const grossProfitBart = grossProfitBeforePersonalCostsBart - costsBart;
  const grossProfitIan = grossProfitBeforePersonalCostsIan - costsIan;
  const grossProfitNiels = grossProfitBeforePersonalCostsNiels - costsNiels;

  const selfEmployedDeductionBart = calculateSelfEmployedDeduction(
    grossProfitBart,
    meetsHourCriteriumBart,
    config.maxSelfEmployedDeduction,
  );
  const selfEmployedDeductionIan = calculateSelfEmployedDeduction(
    grossProfitIan,
    meetsHourCriteriumIan,
    config.maxSelfEmployedDeduction,
  );
  const selfEmployedDeductionNiels = calculateSelfEmployedDeduction(
    grossProfitNiels,
    meetsHourCriteriumNiels,
    config.maxSelfEmployedDeduction,
  );

  const selfEmployedDeduction =
    selfEmployedDeductionBart +
    selfEmployedDeductionIan +
    selfEmployedDeductionNiels;

  const startupDeductionBart = calculateStartupDeduction(
    grossProfitBart,
    meetsHourCriteriumBart,
    applyStartupDeductionBart,
    config.maxStartupDeduction,
  );
  const startupDeductionIan = calculateStartupDeduction(
    grossProfitIan,
    meetsHourCriteriumIan,
    applyStartupDeductionIan,
    config.maxStartupDeduction,
  );
  const startupDeductionNiels = calculateStartupDeduction(
    grossProfitNiels,
    meetsHourCriteriumNiels,
    applyStartupDeductionNiels,
    config.maxStartupDeduction,
  );

  const startupDeduction =
    startupDeductionBart + startupDeductionIan + startupDeductionNiels;

  const SSIDeductionBart =
    config.SSIDeductionValueBart * config.SSIDectionPercentage;
  const SSIDeductionIan =
    config.SSIDeductionValueIan * config.SSIDectionPercentage;
  const SSIDeductionNiels =
    config.SSIDeductionValueNiels * config.SSIDectionPercentage;

  const SSIDeduction = SSIDeductionBart + SSIDeductionIan + SSIDeductionNiels;

  const entrepreneursDeductionBart =
    selfEmployedDeductionBart + startupDeductionBart + SSIDeductionBart;
  const entrepreneursDeductionIan =
    selfEmployedDeductionIan + startupDeductionIan + SSIDeductionIan;
  const entrepreneursDeductionNiels =
    selfEmployedDeductionNiels + startupDeductionNiels + SSIDeductionNiels;

  const entrepreneursDeduction =
    entrepreneursDeductionBart +
    entrepreneursDeductionIan +
    entrepreneursDeductionNiels;

  const grossProfitAfterEntrepreneurDeductionBart =
    grossProfitBart - entrepreneursDeductionBart;
  const grossProfitAfterEntrepreneurDeductionIan =
    grossProfitIan - entrepreneursDeductionIan;
  const grossProfitAfterEntrepreneurDeductionNiels =
    grossProfitNiels - entrepreneursDeductionNiels;

  const grossProfitAfterEntrepreneurDeduction =
    grossProfitAfterEntrepreneurDeductionBart +
    grossProfitAfterEntrepreneurDeductionIan +
    grossProfitAfterEntrepreneurDeductionNiels;

  const profitExemptionBart =
    (grossProfitBart - entrepreneursDeductionBart) *
    config.profitExemptionPercentage;
  const profitExemptionIan =
    (grossProfitIan - entrepreneursDeductionIan) *
    config.profitExemptionPercentage;
  const profitExemptionNiels =
    (grossProfitNiels - entrepreneursDeductionNiels) *
    config.profitExemptionPercentage;

  const profitExemption =
    profitExemptionBart + profitExemptionIan + profitExemptionNiels;

  const grossProfitAfterExemptionBart =
    grossProfitBart - entrepreneursDeductionBart - profitExemptionBart;
  const grossProfitAfterExemptionIan =
    grossProfitIan - entrepreneursDeductionIan - profitExemptionIan;
  const grossProfitAfterExemptionNiels =
    grossProfitNiels - entrepreneursDeductionNiels - profitExemptionNiels;

  const grossProfitAfterExemption =
    grossProfitAfterExemptionBart +
    grossProfitAfterExemptionIan +
    grossProfitAfterExemptionNiels;

  const netTaxBart = grossProfitAfterExemptionBart * config.taxPercentage;
  const netTaxIan = grossProfitAfterExemptionIan * config.taxPercentage;
  const netTaxNiels = grossProfitAfterExemptionNiels * config.taxPercentage;

  const netTax = netTaxBart + netTaxIan + netTaxNiels;

  const contributionHIABart = calculateHIA(
    grossProfitAfterExemptionBart,
    config.HIAPercentage,
    config.maxHIA,
  );
  const contributionHIAIan = calculateHIA(
    grossProfitAfterExemptionIan,
    config.HIAPercentage,
    config.maxHIA,
  );
  const contributionHIANiels = calculateHIA(
    grossProfitAfterExemptionNiels,
    config.HIAPercentage,
    config.maxHIA,
  );

  const contributionHIA =
    contributionHIABart + contributionHIAIan + contributionHIANiels;

  const netProfitBart = grossProfitBart - netTaxBart - contributionHIABart;
  const netProfitIan = grossProfitIan - netTaxIan - contributionHIAIan;
  const netProfitNiels =
    grossProfitNiels - costsNiels - netTaxNiels - contributionHIANiels;

  const netProfit = netProfitBart + netProfitIan + netProfitNiels;

  const withDrawalsBart =
    props.personalFinancialMutations.bart.min -
    props.personalFinancialMutations.bart.plus;
  const withDrawalsIan =
    props.personalFinancialMutations.ian.min -
    props.personalFinancialMutations.ian.plus;
  const withDrawalsNiels =
    props.personalFinancialMutations.niels.min -
    props.personalFinancialMutations.niels.plus;

  const totalWithDrawals = withDrawalsBart + withDrawalsIan + withDrawalsNiels;

  const netLeftBart = grossProfitBart - withDrawalsBart;
  const netLeftIan = grossProfitIan - withDrawalsIan;
  const netLeftNiels = grossProfitNiels - costsNiels - withDrawalsNiels;

  const netLeft = netLeftBart + netLeftIan + netLeftNiels;

  const totalTaxBart = netTaxBart + contributionHIABart;
  const totalTaxIan = netTaxIan + contributionHIAIan;
  const totalTaxNiels = netTaxNiels + contributionHIANiels;

  const totalTax = totalTaxBart + totalTaxIan + totalTaxNiels;

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
              applyStartupDeduction: applyStartupDeductionBart,
              deduction: entrepreneursDeductionBart,
              netTax: netTaxBart,
              contributionHIA: contributionHIABart,
              meetsHourCriterium: meetsHourCriteriumBart,
            },
            Ian: {
              applyStartupDeduction: applyStartupDeductionIan,
              deduction: entrepreneursDeductionIan,
              netTax: netTaxIan,
              contributionHIA: contributionHIAIan,
              meetsHourCriterium: meetsHourCriteriumIan,
            },
            Niels: {
              applyStartupDeduction: applyStartupDeductionNiels,
              deduction: entrepreneursDeductionNiels,
              netTax: netTaxNiels,
              contributionHIA: contributionHIANiels,
              meetsHourCriterium: meetsHourCriteriumNiels,
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
          data: [costsBart, costsIan, costsNiels],
          color: 'pink',
        },
        {
          type: 'column',
          name: 'Belasting',
          data: [
            netTaxBart + contributionHIABart,
            netTaxIan + contributionHIAIan,
            netTaxNiels + contributionHIANiels,
          ],
          color: '#5b91b7',
        },
        {
          type: 'column',
          name: 'Nettowinst',
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
  }, [
    applyStartupDeductionBart,
    applyStartupDeductionIan,
    applyStartupDeductionNiels,
    contributionHIABart,
    contributionHIAIan,
    contributionHIANiels,
    costsBart,
    costsIan,
    costsNiels,
    entrepreneursDeductionBart,
    entrepreneursDeductionIan,
    entrepreneursDeductionNiels,
    meetsHourCriteriumBart,
    meetsHourCriteriumIan,
    meetsHourCriteriumNiels,
    netProfitBart,
    netProfitIan,
    netProfitNiels,
    netTaxBart,
    netTaxIan,
    netTaxNiels,
  ]);

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
                    value={simulatedExtraProfit || 0}
                    size={60}
                    onChange={(e) => {
                      setSimulatedExtraProfit(parseFloat(e.target.value));
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
                    {currencyFormatter.format(simulatedExtraPersonalCosts)}
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
                    value={simulatedExtraCostsBart || 0}
                    size={60}
                    onChange={(e) => {
                      setSimulatedExtraCostsBart(parseFloat(e.target.value));
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
                    value={simulatedExtraCostsIan || 0}
                    size={60}
                    onChange={(e) => {
                      setSimulatedExtraCostsIan(parseFloat(e.target.value));
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
                    value={simulatedExtraCostsNiels || 0}
                    size={60}
                    onChange={(e) => {
                      setSimulatedExtraCostsNiels(parseFloat(e.target.value));
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
                  <span>{simulatedExtraHours || 0}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div className="relative ml-auto w-max">
                  <input
                    className="appearance-none w-28 bg-gray-200 text-gray-700 border border-gray-200 rounded py-2 pl-6 pr-2 leading-tight focus:outline-none focus:bg-white focus:border-gray-500 text-sm"
                    type="number"
                    value={simulatedExtraHoursBart || 0}
                    size={60}
                    onChange={(e) => {
                      setSimulatedExtraHoursBart(parseInt(e.target.value, 10));
                    }}
                  />
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div className="relative ml-auto w-max">
                  <input
                    className="appearance-none w-28 bg-gray-200 text-gray-700 border border-gray-200 rounded py-2 pl-6 pr-2 leading-tight focus:outline-none focus:bg-white focus:border-gray-500 text-sm"
                    type="number"
                    value={simulatedExtraHoursIan || 0}
                    size={60}
                    onChange={(e) => {
                      setSimulatedExtraHoursIan(parseInt(e.target.value, 10));
                    }}
                  />
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div className="relative ml-auto w-max">
                  <input
                    className="appearance-none w-28 bg-gray-200 text-gray-700 border border-gray-200 rounded py-2 pl-6 pr-2 leading-tight focus:outline-none focus:bg-white focus:border-gray-500 text-sm"
                    type="number"
                    value={simulatedExtraHoursNiels || 0}
                    size={60}
                    onChange={(e) => {
                      setSimulatedExtraHoursNiels(parseInt(e.target.value, 10));
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
                  checked={meetsHourCriteriumAll}
                  onChange={() => {
                    setMeetsHourCriteriumAll((currentMeetsHourCriteriumAll) => {
                      setMeetsHourCriteriumBart(!currentMeetsHourCriteriumAll);
                      setMeetsHourCriteriumIan(!currentMeetsHourCriteriumAll);
                      setMeetsHourCriteriumNiels(!currentMeetsHourCriteriumAll);

                      return !currentMeetsHourCriteriumAll;
                    });
                  }}
                />
              </td>
              <td className="py-3 px-6 text-center">
                <div>
                  <input
                    type="checkbox"
                    className="form-checkbox rounded"
                    checked={meetsHourCriteriumBart}
                    onChange={() => {
                      setMeetsHourCriteriumBart(
                        (currentMeetsHourCriteriumBart) =>
                          !currentMeetsHourCriteriumBart,
                      );
                    }}
                  />
                  <div className="mt-2">
                    min. {config.minHoursPerWeek.toFixed(1)} uur / week
                  </div>
                  <div className="mt-2">
                    nu {hoursPerWeekBart.toFixed(1)} uur / week
                  </div>
                  <div className="mt-2">
                    {allHhoursBart.toFixed(0)} /{' '}
                    {config.hourCriterium.toFixed(0)} uren geboekt
                  </div>
                </div>
              </td>
              <td className="py-3 px-6 text-center">
                <div>
                  <input
                    type="checkbox"
                    className="form-checkbox rounded"
                    checked={meetsHourCriteriumIan}
                    onChange={() => {
                      setMeetsHourCriteriumIan(
                        (currentMeetsHourCriteriumIan) =>
                          !currentMeetsHourCriteriumIan,
                      );
                    }}
                  />
                  <div className="mt-2">
                    min. {config.minHoursPerWeek.toFixed(1)} uur / week
                  </div>
                  <div className="mt-2">
                    nu {hoursPerWeekIan.toFixed(1)} uur / week
                  </div>
                  <div className="mt-2">
                    {allHhoursIan.toFixed(0)} /{' '}
                    {config.hourCriterium.toFixed(0)} uren geboekt
                  </div>
                </div>
              </td>
              <td className="py-3 px-6 text-center">
                <div>
                  <input
                    type="checkbox"
                    className="form-checkbox rounded"
                    checked={meetsHourCriteriumNiels}
                    onChange={() => {
                      setMeetsHourCriteriumNiels(
                        (currentMeetsHourCriteriumNiels) =>
                          !currentMeetsHourCriteriumNiels,
                      );
                    }}
                  />
                  <div className="mt-2">
                    min. {config.minHoursPerWeek.toFixed(1)} uur / week
                  </div>
                  <div className="mt-2">
                    nu {hoursPerWeekNiels.toFixed(1)} uur / week
                  </div>
                  <div className="mt-2">
                    {allHhoursNiels.toFixed(0)} /{' '}
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
                  checked={applyStartupDeductionAll}
                  onChange={() => {
                    setApplyDeductionAll((currentApplyDeductionAll) => {
                      setApplyDeductionBart(!currentApplyDeductionAll);
                      setApplyDeductionIan(!currentApplyDeductionAll);
                      setApplyDeductionNiels(!currentApplyDeductionAll);

                      return !currentApplyDeductionAll;
                    });
                  }}
                />
              </td>
              <td className="py-3 px-6 text-center">
                <div>
                  <input
                    type="checkbox"
                    className="form-checkbox rounded"
                    checked={applyStartupDeductionBart}
                    onChange={() => {
                      setApplyDeductionBart(
                        (currentApplyDeductionBart) =>
                          !currentApplyDeductionBart,
                      );
                    }}
                  />
                </div>
              </td>
              <td className="py-3 px-6 text-center">
                <div>
                  <input
                    type="checkbox"
                    className="form-checkbox rounded"
                    checked={applyStartupDeductionIan}
                    onChange={() => {
                      setApplyDeductionIan(
                        (currentApplyDeductionIan) => !currentApplyDeductionIan,
                      );
                    }}
                  />
                </div>
              </td>
              <td className="py-3 px-6 text-center">
                <div>
                  <input
                    type="checkbox"
                    className="form-checkbox rounded"
                    checked={applyStartupDeductionNiels}
                    onChange={() => {
                      setApplyDeductionNiels(
                        (currentApplyDeductionNiels) =>
                          !currentApplyDeductionNiels,
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
                  <span>{Math.round(percentageBart * 1000) / 10}%</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{Math.round(percentageIan * 1000) / 10}%</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{Math.round(percentageNiels * 1000) / 10}%</span>
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
                  <span>
                    {Math.round(
                      (percentageBartThisYear +
                        percentageIanThisYear +
                        percentageNielsThisYear) *
                        100,
                    )}
                    %
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{Math.round(percentageBartThisYear * 1000) / 10}%</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{Math.round(percentageIanThisYear * 1000) / 10}%</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {Math.round(percentageNielsThisYear * 1000) / 10}%
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
                  <span>
                    {Math.round(
                      (config.lastYearPie.bart +
                        config.lastYearPie.ian +
                        config.lastYearPie.niels) *
                        100,
                    )}
                    %
                  </span>
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
                    {currencyFormatter.format(totalProfit)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {currencyFormatter.format(
                      grossProfitBeforePersonalCostsBart,
                    )}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {currencyFormatter.format(
                      grossProfitBeforePersonalCostsIan,
                    )}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {currencyFormatter.format(
                      grossProfitBeforePersonalCostsNiels,
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
                  <span>{currencyFormatter.format(totalRevenue)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(grossRevenueBart)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(grossRevenueIan)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(grossRevenueNiels)}</span>
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
                  <span>{currencyFormatter.format(generalCosts)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(generalCostsBart)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(generalCostsIan)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(generalCostsNiels)}</span>
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
                    {currencyFormatter.format(totalPersonalCosts)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(costsBart)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(costsIan)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(costsNiels)}</span>
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
                        totalPersonalCosts,
                    )}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(grossProfitBart)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(grossProfitIan)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(grossProfitNiels)}</span>
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
                    {currencyFormatter.format(selfEmployedDeduction)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {currencyFormatter.format(selfEmployedDeductionBart)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {currencyFormatter.format(selfEmployedDeductionIan)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {currencyFormatter.format(selfEmployedDeductionNiels)}
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
                    {currencyFormatter.format(startupDeduction)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(startupDeductionBart)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(startupDeductionIan)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(startupDeductionNiels)}</span>
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
                    {currencyFormatter.format(SSIDeduction)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(SSIDeductionBart)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(SSIDeductionIan)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(SSIDeductionNiels)}</span>
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
                    {currencyFormatter.format(entrepreneursDeduction)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {currencyFormatter.format(entrepreneursDeductionBart)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {currencyFormatter.format(entrepreneursDeductionIan)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {currencyFormatter.format(entrepreneursDeductionNiels)}
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
                      grossProfitAfterEntrepreneurDeduction,
                    )}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {currencyFormatter.format(
                      grossProfitAfterEntrepreneurDeductionBart,
                    )}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {currencyFormatter.format(
                      grossProfitAfterEntrepreneurDeductionIan,
                    )}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {currencyFormatter.format(
                      grossProfitAfterEntrepreneurDeductionNiels,
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
                    {currencyFormatter.format(profitExemption)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(profitExemptionBart)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(profitExemptionIan)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(profitExemptionNiels)}</span>
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
                    {currencyFormatter.format(grossProfitAfterExemption)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {currencyFormatter.format(grossProfitAfterExemptionBart)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {currencyFormatter.format(grossProfitAfterExemptionIan)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {currencyFormatter.format(grossProfitAfterExemptionNiels)}
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
                  <span className="font-medium">Netto winst</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span className="font-medium">
                    {currencyFormatter.format(netProfit)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(netProfitBart)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(netProfitIan)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(netProfitNiels)}</span>
                </div>
              </td>
            </tr>
            <tr className="border-b border-gray-200 text-xs italic bg-gray-50 hover:bg-gray-100">
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span>
                    Netto inkomstenbelasting ({config.taxPercentage * 100}%)
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span>{currencyFormatter.format(netTax)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(netTaxBart)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(netTaxIan)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(netTaxNiels)}</span>
                </div>
              </td>
            </tr>
            <tr className="border-b border-gray-200 text-xs italic bg-gray-50 hover:bg-gray-100">
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span>
                    Inkomensafhankelijke bijdrage Zvw en Wlz (5.75%, max.{' '}
                    {currencyFormatter.format(3353)})
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span>{currencyFormatter.format(contributionHIA)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(contributionHIABart)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(contributionHIAIan)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(contributionHIANiels)}</span>
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
                    {currencyFormatter.format(netLeft)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(netLeftBart)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(netLeftIan)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(netLeftNiels)}</span>
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
                  <span>{currencyFormatter.format(netLeft - totalTax)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {currencyFormatter.format(netLeftBart - totalTaxBart)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {currencyFormatter.format(netLeftIan - totalTaxIan)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {currencyFormatter.format(netLeftNiels - totalTaxNiels)}
                  </span>
                </div>
              </td>
            </tr>
            <tr className="border-b border-gray-200 text-xs italic bg-gray-50 hover:bg-gray-100">
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span>Waarvan belasting (IB & Zvw)</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span>{currencyFormatter.format(totalTax)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(totalTaxBart)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(totalTaxIan)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(totalTaxNiels)}</span>
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
                  <span>{currencyFormatter.format(totalWithDrawals)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(withDrawalsBart)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(withDrawalsIan)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(withDrawalsNiels)}</span>
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
