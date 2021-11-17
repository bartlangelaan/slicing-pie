import { useMemo, useState } from 'react';
import Highcharts from 'highcharts';
import styled from 'styled-components';
import HighchartsReact from 'highcharts-react-official';
import { GetSlicingPieResponse } from './GetSlicingPieResponse';

const config = {
  taxPercentage: 0.371,
  HIAPercentage: 0.0575,
  hourCriteriumFromJuly: 1225 - 24 * 26,
  hourCriteriumFromJulyUnfitForWork: 800 - 16 * 26,
  minHoursPerWeekFromJuly: (1225 - 24 * 26) / 26,
  minHoursPerWeekUnfitForWork: (800 - 16 * 26) / 26,
  // Year costs / number of days * number of days from 01/09 - 31/12
  fiscalCarAdditionIan: (4649 / 365) * 120,
  // fiscalCarAdditionIan: 0,
};

const currencyFormatter = Intl.NumberFormat('nl', {
  style: 'currency',
  currency: 'EUR',
});

function calculateSelfEmployedDeduction(
  grossProfit: number,
  hourCriterium: boolean,
  applyDeduction: boolean,
  unfitForWork: boolean,
) {
  if (!hourCriterium || !applyDeduction || unfitForWork) return 0;

  if (grossProfit < 6670) return grossProfit;

  return 6670;
}

function calculateStartupDeduction(
  grossProfit: number,
  hourCriterium: boolean,
  applyDeduction: boolean,
  unfitForWork: boolean,
) {
  if (!hourCriterium || !applyDeduction) return 0;

  const maxDeduction = unfitForWork ? 12000 : 2123;

  if (grossProfit < maxDeduction) return grossProfit;

  return maxDeduction;
}

const TableHead = styled.thead`
  top: 78px;
`;

export function NetProfitTable(props: GetSlicingPieResponse) {
  const [unfitForWorkAll, setUnfitForWorkAll] = useState(false);
  const [unfitForWorkBart, setUnfitForWorkBart] = useState(false);
  const [unfitForWorkIan, setUnfitForWorkIan] = useState(true);
  const [unfitForWorkNiels, setUnfitForWorkNiels] = useState(false);

  const [applyDeductionAll, setApplyDeductionAll] = useState(false);
  const [applyDeductionBart, setApplyDeductionBart] = useState(false);
  const [applyDeductionIan, setApplyDeductionIan] = useState(false);
  const [applyDeductionNiels, setApplyDeductionNiels] = useState(false);

  const [simulatedExtraProfit, setSimulatedExtraProfit] = useState(0);

  const [simulatedExtraCostsBart, setSimulatedExtraCostsBart] = useState(0);
  const [simulatedExtraCostsIan, setSimulatedExtraCostsIan] = useState(0);
  const [simulatedExtraCostsNiels, setSimulatedExtraCostsNiels] = useState(0);

  const [simulatedExtraHoursBart, setSimulatedExtraHoursBart] = useState(0);
  const [simulatedExtraHoursIan, setSimulatedExtraHoursIan] = useState(0);
  const [simulatedExtraHoursNiels, setSimulatedExtraHoursNiels] = useState(0);

  const weeksSinceJuly =
    (Date.now() - new Date('2021-07-01').getTime()) / (7 * 24 * 60 * 60 * 1000);

  const simulatedExtraHours =
    simulatedExtraHoursBart + simulatedExtraHoursIan + simulatedExtraHoursNiels;
  const totalTimeSpentFiltered =
    props.totalTimeSpentFiltered + simulatedExtraHours;

  const hoursBart =
    props.timeSpent.bart.yearFiltered + (simulatedExtraHoursBart || 0);
  const hoursIan =
    props.timeSpent.ian.yearFiltered + (simulatedExtraHoursIan || 0);
  const hoursNiels =
    props.timeSpent.niels.yearFiltered + (simulatedExtraHoursNiels || 0);

  const hoursFromJulyBart =
    props.timeSpent.bart.fromJuly + (simulatedExtraHoursBart || 0);
  const hoursFromJulyIan =
    props.timeSpent.ian.fromJuly + (simulatedExtraHoursIan || 0);
  const hoursFromJulyNiels =
    props.timeSpent.niels.fromJuly + (simulatedExtraHoursNiels || 0);

  const hoursPerWeekSinceJulyBart = hoursFromJulyBart / weeksSinceJuly;
  const hoursPerWeekSinceJulyIan = hoursFromJulyIan / weeksSinceJuly;
  const hoursPerWeekSinceJulyNiels = hoursFromJulyNiels / weeksSinceJuly;

  const hourCriteriumBart =
    (unfitForWorkBart &&
      hoursPerWeekSinceJulyBart > config.minHoursPerWeekUnfitForWork) ||
    (!unfitForWorkBart &&
      hoursPerWeekSinceJulyBart > config.minHoursPerWeekFromJuly);
  const hourCriteriumIan =
    (unfitForWorkIan &&
      hoursPerWeekSinceJulyIan > config.minHoursPerWeekUnfitForWork) ||
    (!unfitForWorkIan &&
      hoursPerWeekSinceJulyIan > config.minHoursPerWeekFromJuly);
  const hourCriteriumNiels =
    (unfitForWorkNiels &&
      hoursPerWeekSinceJulyNiels > config.minHoursPerWeekUnfitForWork) ||
    (!unfitForWorkNiels &&
      hoursPerWeekSinceJulyNiels > config.minHoursPerWeekFromJuly);
  const hourCriteriumAll =
    hourCriteriumBart && hourCriteriumIan && hourCriteriumNiels;

  const totalProfit =
    props.totalProfit.plus -
    props.totalProfit.min +
    props.totalProfit.openPlus -
    props.totalProfit.openMin +
    props.totalProfit.personalMin -
    props.totalProfit.personalPlus +
    (simulatedExtraProfit || 0);

  const percentageBart = hoursBart / totalTimeSpentFiltered;
  const percentageIan = hoursIan / totalTimeSpentFiltered;
  const percentageNiels = hoursNiels / totalTimeSpentFiltered;

  const grossProfitBart = totalProfit * percentageBart || 0;
  const grossProfitIan = totalProfit * percentageIan || 0;
  const grossProfitNiels = totalProfit * percentageNiels || 0;

  const grossProfit = grossProfitBart + grossProfitIan + grossProfitNiels;

  const grossTaxBart = grossProfitBart * config.taxPercentage;
  const grossTaxIan =
    (grossProfitIan + config.fiscalCarAdditionIan) * config.taxPercentage;
  const grossTaxNiels = grossProfitNiels * config.taxPercentage;

  const grossTax = grossTaxBart + grossTaxIan + grossTaxNiels;

  const costsBart =
    props.personalCosts.bart.plus -
    props.personalCosts.bart.min +
    (simulatedExtraCostsBart || 0);
  const costsIan =
    props.personalCosts.ian.plus -
    props.personalCosts.ian.min +
    (simulatedExtraCostsIan || 0);
  const costsNiels =
    props.personalCosts.niels.plus -
    props.personalCosts.niels.min +
    (simulatedExtraCostsNiels || 0);

  const simulatedExtraCosts =
    (simulatedExtraCostsBart || 0) +
    (simulatedExtraCostsIan || 0) +
    (simulatedExtraCostsNiels || 0);

  const totalCosts = costsBart + costsIan + costsNiels;

  const profitExemptionBart = (grossProfitBart - costsBart) * 0.14;
  const profitExemptionIan =
    (grossProfitIan + config.fiscalCarAdditionIan - costsIan) * 0.14;
  const profitExemptionNiels = (grossProfitNiels - costsNiels) * 0.14;

  const profitExemption =
    profitExemptionBart + profitExemptionIan + profitExemptionNiels;

  const grossProfitAfterExemptionBart =
    grossProfitBart - costsBart - profitExemptionBart;
  const grossProfitAfterExemptionIan =
    grossProfitIan - costsIan - profitExemptionIan;
  const grossProfitAfterExemptionNiels =
    grossProfitNiels - costsNiels - profitExemptionNiels;

  const grossProfitAfterExemption =
    grossProfitAfterExemptionBart +
    grossProfitAfterExemptionIan +
    grossProfitAfterExemptionNiels;

  const selfEmployedDeductionBart = calculateSelfEmployedDeduction(
    grossProfitAfterExemptionBart,
    hourCriteriumBart,
    applyDeductionBart,
    unfitForWorkBart,
  );
  const selfEmployedDeductionIan = calculateSelfEmployedDeduction(
    grossProfitAfterExemptionIan,
    hourCriteriumIan,
    applyDeductionIan,
    unfitForWorkIan,
  );
  const selfEmployedDeductionNiels = calculateSelfEmployedDeduction(
    grossProfitAfterExemptionNiels,
    hourCriteriumNiels,
    applyDeductionNiels,
    unfitForWorkNiels,
  );

  const selfEmployedDeduction =
    selfEmployedDeductionBart +
    selfEmployedDeductionIan +
    selfEmployedDeductionNiels;

  const startupDeductionBart = calculateStartupDeduction(
    grossProfitAfterExemptionBart - selfEmployedDeductionBart,
    hourCriteriumBart,
    applyDeductionBart,
    unfitForWorkBart,
  );
  const startupDeductionIan = calculateStartupDeduction(
    grossProfitAfterExemptionIan - selfEmployedDeductionIan,
    hourCriteriumIan,
    applyDeductionIan,
    unfitForWorkIan,
  );
  const startupDeductionNiels = calculateStartupDeduction(
    grossProfitAfterExemptionNiels - selfEmployedDeductionNiels,
    hourCriteriumNiels,
    applyDeductionNiels,
    unfitForWorkNiels,
  );

  const startupDeduction =
    startupDeductionBart + startupDeductionIan + startupDeductionNiels;

  const entrepreneursDeductionBart =
    selfEmployedDeductionBart + startupDeductionBart;
  const entrepreneursDeductionIan =
    selfEmployedDeductionIan + startupDeductionIan;
  const entrepreneursDeductionNiels =
    selfEmployedDeductionNiels + startupDeductionNiels;

  // const entrepreneursDeduction =
  //   entrepreneursDeductionBart +
  //   entrepreneursDeductionIan +
  //   entrepreneursDeductionNiels;

  const grossProfitAfterDeductionBart =
    grossProfitBart -
    costsBart -
    profitExemptionBart -
    entrepreneursDeductionBart;
  const grossProfitAfterDeductionIan =
    grossProfitIan - costsIan - profitExemptionIan - entrepreneursDeductionIan;
  const grossProfitAfterDeductionNiels =
    grossProfitNiels -
    costsNiels -
    profitExemptionNiels -
    entrepreneursDeductionNiels;

  const grossProfitAfterDeduction =
    grossProfitAfterDeductionBart +
    grossProfitAfterDeductionIan +
    grossProfitAfterDeductionNiels;

  const netTaxBart = grossProfitAfterDeductionBart * config.taxPercentage;
  const netTaxIan = grossProfitAfterDeductionIan * config.taxPercentage;
  const netTaxNiels = grossProfitAfterDeductionNiels * config.taxPercentage;

  const netTax = netTaxBart + netTaxIan + netTaxNiels;

  const contributionHIABart =
    grossProfitAfterDeductionBart * config.HIAPercentage;
  const contributionHIAIan =
    grossProfitAfterDeductionIan * config.HIAPercentage;
  const contributionHIANiels =
    grossProfitAfterDeductionNiels * config.HIAPercentage;

  const contributionHIA =
    contributionHIABart + contributionHIAIan + contributionHIANiels;

  const netProfitBart =
    grossProfitBart - costsBart - netTaxBart - contributionHIABart;
  const netProfitIan =
    grossProfitIan -
    costsIan -
    netTaxIan -
    contributionHIAIan -
    config.fiscalCarAdditionIan;
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

  const netLeftBart = grossProfitBart - costsBart - withDrawalsBart;
  const netLeftIan = grossProfitIan - costsIan - withDrawalsIan;
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
              grossTax: grossTaxBart,
              applyDeduction: applyDeductionBart,
              deduction: entrepreneursDeductionBart,
              netTax: netTaxBart,
              contributionHIA: contributionHIABart,
            },
            Ian: {
              grossTax: grossTaxIan,
              applyDeduction: applyDeductionIan,
              deduction: entrepreneursDeductionIan,
              netTax: netTaxIan,
              contributionHIA: contributionHIAIan,
            },
            Niels: {
              grossTax: grossTaxNiels,
              applyDeduction: applyDeductionNiels,
              deduction: entrepreneursDeductionNiels,
              netTax: netTaxNiels,
              contributionHIA: contributionHIANiels,
            },
          };

          const person = val.x as unknown as keyof typeof taxes;

          return `
            <b>Winstberekening ${person}</b><br/><br/>

            Bruto winst: ${currencyFormatter.format(
              val.points[0].point.total || 0,
            )}<br/><br/>

            Kosten: ${currencyFormatter.format(val.points[0].point.y || 0)}<br/>
            Aftrekposten: ${
              taxes[person].applyDeduction
                ? currencyFormatter.format(taxes[person].deduction || 0)
                : 'N.v.t.'
            }<br/>
            Bruto IB: ${currencyFormatter.format(
              taxes[person].grossTax || 0,
            )}<br/>
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
          name: 'Kosten',
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
    applyDeductionBart,
    applyDeductionIan,
    applyDeductionNiels,
    contributionHIABart,
    contributionHIAIan,
    contributionHIANiels,
    costsBart,
    costsIan,
    costsNiels,
    entrepreneursDeductionBart,
    entrepreneursDeductionIan,
    entrepreneursDeductionNiels,
    grossTaxBart,
    grossTaxIan,
    grossTaxNiels,
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
                  <span>Simuleer extra kosten</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right border-r italic">
                <div>
                  <span>{currencyFormatter.format(simulatedExtraCosts)}</span>
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
            <tr className="border-b border-gray-200 hover:bg-gray-100 mb-10">
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span className="font-medium">Bruto winst</span>
                  <div className="text-xs italic">
                    <a
                      href="https://moneybird.com/313185156605150255/sales_invoices/filter/period:this_year,state:scheduled%7Copen%7Cpending_payment%7Clate%7Creminded%7Cpaid"
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                    >
                      Alle betaalde en openstaande facturen
                    </a>
                  </div>
                </div>
              </td>
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span className="font-medium">
                    {currencyFormatter.format(grossProfit)}
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
            <tr className="border-b border-gray-200 text-xs italic hover:bg-gray-100">
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span>Slicing pie</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span>100%</span>
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
            <tr className="h-10 border-b">
              <td className="border-r" />
              <td className="border-r" />
              <td colSpan={3} />
            </tr>
            <tr className="border-b border-gray-200 hover:bg-gray-100 mb-10">
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span className="font-medium">
                    Bruto inkomstenbelasting ({config.taxPercentage * 100}%)
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span>{currencyFormatter.format(grossTax)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(grossTaxBart)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(grossTaxIan)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(grossTaxNiels)}</span>
                </div>
              </td>
            </tr>
            <tr className="border-b border-gray-200 text-xs italic hover:bg-gray-100">
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span>Waarvan fiscale bijtelling</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span>
                    {currencyFormatter.format(config.fiscalCarAdditionIan)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(0)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {currencyFormatter.format(config.fiscalCarAdditionIan)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>{currencyFormatter.format(0)}</span>
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
                  <span className="font-medium">Kosten</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span className="font-medium">
                    {currencyFormatter.format(totalCosts)}
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
                  <span>Subtotaal bruto winst</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span>
                    {currencyFormatter.format(
                      props.totalProfit.plus -
                        props.totalProfit.min -
                        totalCosts,
                    )}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {currencyFormatter.format(grossProfitBart - costsBart)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {currencyFormatter.format(grossProfitIan - costsIan)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {currencyFormatter.format(grossProfitNiels - costsNiels)}
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
                  <div className="text-xs italic">Altijd 14%</div>
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
                  <span>Subtotaal bruto winst</span>
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
            <tr className="border-b border-gray-200 hover:bg-gray-100">
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span className="font-medium">(Deels) arbeidsongeschikt</span>
                </div>
              </td>
              <td className="py-3 px-6 text-center border-r">
                <input
                  type="checkbox"
                  className="form-checkbox rounded"
                  checked={unfitForWorkAll}
                  onChange={() => {
                    setUnfitForWorkAll((currentUnfitForWorkAll) => {
                      setUnfitForWorkBart(!currentUnfitForWorkAll);
                      setUnfitForWorkIan(!currentUnfitForWorkAll);
                      setUnfitForWorkNiels(!currentUnfitForWorkAll);

                      return !currentUnfitForWorkAll;
                    });
                  }}
                />
              </td>
              <td className="py-3 px-6 text-center">
                <div>
                  <input
                    type="checkbox"
                    className="form-checkbox rounded"
                    checked={unfitForWorkBart}
                    onChange={() => {
                      setUnfitForWorkBart(
                        (currentUnfitForWorkBart) => !currentUnfitForWorkBart,
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
                    checked={unfitForWorkIan}
                    onChange={() => {
                      setUnfitForWorkIan(
                        (currentUnfitForWorkIan) => !currentUnfitForWorkIan,
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
                    checked={unfitForWorkNiels}
                    onChange={() => {
                      setUnfitForWorkNiels(
                        (currentUnfitForWorkNiels) => !currentUnfitForWorkNiels,
                      );
                    }}
                  />
                </div>
              </td>
            </tr>
            <tr className="border-b border-gray-200 hover:bg-gray-100">
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span className="font-medium">Voldoet aan urencriterium</span>
                  <div className="text-xs italic">
                    Automatisch berekend o.b.v. geschreven uren tussen 1 juli en
                    31 december
                  </div>
                </div>
              </td>
              <td className="py-3 px-6 text-center border-r">
                <input
                  type="checkbox"
                  className="form-checkbox rounded bg-gray-200"
                  checked={hourCriteriumAll}
                  disabled
                />
              </td>
              <td className="py-3 px-6 text-center">
                <div>
                  <input
                    type="checkbox"
                    className="form-checkbox rounded bg-gray-200"
                    checked={hourCriteriumBart}
                    disabled
                  />
                  <div className="mt-2">
                    min.{' '}
                    {(unfitForWorkBart
                      ? config.minHoursPerWeekUnfitForWork
                      : config.minHoursPerWeekFromJuly
                    ).toFixed(1)}{' '}
                    uur / week
                  </div>
                  <div className="mt-2">
                    nu {hoursPerWeekSinceJulyBart.toFixed(1)} uur / week
                  </div>
                  <div className="mt-2">
                    {hoursFromJulyBart.toFixed(0)} /{' '}
                    {(unfitForWorkBart
                      ? config.hourCriteriumFromJulyUnfitForWork
                      : config.hourCriteriumFromJuly
                    ).toFixed(0)}{' '}
                    uren geboekt
                  </div>
                </div>
              </td>
              <td className="py-3 px-6 text-center">
                <div>
                  <input
                    type="checkbox"
                    className="form-checkbox rounded bg-gray-200"
                    checked={hourCriteriumIan}
                    disabled
                  />
                  <div className="mt-2">
                    min.{' '}
                    {(unfitForWorkIan
                      ? config.minHoursPerWeekUnfitForWork
                      : config.minHoursPerWeekFromJuly
                    ).toFixed(1)}{' '}
                    uur / week
                  </div>
                  <div className="mt-2">
                    nu {hoursPerWeekSinceJulyIan.toFixed(1)} uur / week
                  </div>
                  <div className="mt-2">
                    {hoursFromJulyIan.toFixed(0)} /{' '}
                    {(unfitForWorkIan
                      ? config.hourCriteriumFromJulyUnfitForWork
                      : config.hourCriteriumFromJuly
                    ).toFixed(0)}{' '}
                    uren geboekt
                  </div>
                </div>
              </td>
              <td className="py-3 px-6 text-center">
                <div>
                  <input
                    type="checkbox"
                    className="form-checkbox rounded bg-gray-200"
                    checked={hourCriteriumNiels}
                    disabled
                  />
                  <div className="mt-2">
                    min.{' '}
                    {(unfitForWorkNiels
                      ? config.minHoursPerWeekUnfitForWork
                      : config.minHoursPerWeekFromJuly
                    ).toFixed(1)}{' '}
                    uur / week
                  </div>
                  <div className="mt-2">
                    nu {hoursPerWeekSinceJulyNiels.toFixed(1)} uur / week
                  </div>
                  <div className="mt-2">
                    {hoursFromJulyNiels.toFixed(0)} /{' '}
                    {(unfitForWorkNiels
                      ? config.hourCriteriumFromJulyUnfitForWork
                      : config.hourCriteriumFromJuly
                    ).toFixed(0)}{' '}
                    uren geboekt
                  </div>
                </div>
              </td>
            </tr>
            <tr className="border-b border-gray-200 hover:bg-gray-100">
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span className="font-medium">Pas ondernemersaftrek toe</span>
                  <div className="text-xs italic">
                    Wel of niet de zelfstandigenaftrek & startersaftrek
                    toepassen?
                  </div>
                </div>
              </td>
              <td className="py-3 px-6 text-center border-r">
                <input
                  type="checkbox"
                  className="form-checkbox rounded"
                  checked={applyDeductionAll}
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
                    checked={applyDeductionBart}
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
                    checked={applyDeductionIan}
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
                    checked={applyDeductionNiels}
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
            <tr className="border-b border-gray-200 hover:bg-gray-100">
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span className="font-medium">Zelfstandigenaftrek</span>
                  <div className="text-xs italic">
                    Max. 100%, &euro; 6670, of &euro; 0 bij
                    arbeidsongeschiktheid
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
                    Max. 100%, &euro; 2123, of &euro; 12.000 bij
                    arbeidsongeschiktheid
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
            <tr className="border-b border-gray-200 text-xs italic hover:bg-gray-100">
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span>Subtotaal bruto winst</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right border-r">
                <div>
                  <span>
                    {currencyFormatter.format(grossProfitAfterDeduction)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {currencyFormatter.format(grossProfitAfterDeductionBart)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {currencyFormatter.format(grossProfitAfterDeductionIan)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right">
                <div>
                  <span>
                    {currencyFormatter.format(grossProfitAfterDeductionNiels)}
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
                  <span>Inkomensafhankelijke bijdrage Zvw en Wlz (5.75%)</span>
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
