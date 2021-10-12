import { useState } from 'react';
import { GetSlicingPieResponse } from './GetSlicingPieResponse';

const config = {
  taxPercentage: 0.371,
  HIAPercentage: 0.0575,
  hourCriteriumFromJuly: 1225 - 24 * 26,
  hourCriteriumFromJulyUnfitForWork: 800 - 16 * 26,
  minHoursPerWeekFromJuly: (1225 - 24 * 26) / 26,
  minHoursPerWeekUnfitForWork: (800 - 16 * 26) / 26,
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

export function NetProfitTable(props: GetSlicingPieResponse) {
  const [unfitForWorkAll, setUnfitForWorkAll] = useState(false);
  const [unfitForWorkBart, setUnfitForWorkBart] = useState(false);
  const [unfitForWorkIan, setUnfitForWorkIan] = useState(true);
  const [unfitForWorkNiels, setUnfitForWorkNiels] = useState(false);

  const [applyDeductionAll, setApplyDeductionAll] = useState(false);
  const [applyDeductionBart, setApplyDeductionBart] = useState(false);
  const [applyDeductionIan, setApplyDeductionIan] = useState(false);
  const [applyDeductionNiels, setApplyDeductionNiels] = useState(false);

  const [simulatedExtraCostsBart, setSimulatedExtraCostsBart] = useState(0);
  const [simulatedExtraCostsIan, setSimulatedExtraCostsIan] = useState(0);
  const [simulatedExtraCostsNiels, setSimulatedExtraCostsNiels] = useState(0);

  const weeksSinceJuly =
    (Date.now() - new Date('2021-07-01').getTime()) / (7 * 24 * 60 * 60 * 1000);

  const hoursPerWeekSinceJulyBart =
    props.timeSpent.bart.fromJuly / weeksSinceJuly;
  const hoursPerWeekSinceJulyIan =
    props.timeSpent.ian.fromJuly / weeksSinceJuly;
  const hoursPerWeekSinceJulyNiels =
    props.timeSpent.niels.fromJuly / weeksSinceJuly;

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
    props.totalProfit.openMin;

  const grossProfitBart =
    totalProfit *
      (props.timeSpent.bart.yearFiltered / props.totalTimeSpentFiltered) || 0;
  const grossProfitIan =
    totalProfit *
      (props.timeSpent.ian.yearFiltered / props.totalTimeSpentFiltered) || 0;
  const grossProfitNiels =
    totalProfit *
      (props.timeSpent.niels.yearFiltered / props.totalTimeSpentFiltered) || 0;

  const grossTaxBart = grossProfitBart * config.taxPercentage;
  const grossTaxIan = grossProfitIan * config.taxPercentage;
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
  const profitExemptionIan = (grossProfitIan - costsIan) * 0.14;
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
    grossProfitIan - costsIan - netTaxIan - contributionHIAIan;
  const netProfitNiels =
    grossProfitNiels - costsNiels - netTaxNiels - contributionHIANiels;

  const netProfit = netProfitBart + netProfitIan + netProfitNiels;

  const withDrawalsBart =
    props.personalFinancialMutations.bart.plus -
    props.personalFinancialMutations.bart.min;
  const withDrawalsIan =
    props.personalFinancialMutations.ian.plus -
    props.personalFinancialMutations.ian.min;
  const withDrawalsNiels =
    props.personalFinancialMutations.niels.plus -
    props.personalFinancialMutations.niels.min;

  const totalWithDrawals = withDrawalsBart + withDrawalsIan + withDrawalsNiels;

  const netLeftBart = netProfitBart - withDrawalsBart;
  const netLeftIan = netProfitIan - withDrawalsIan;
  const netLeftNiels = netProfitNiels - withDrawalsNiels;

  const netLeft = netLeftBart + netLeftIan + netLeftNiels;

  return (
    <div>
      <div className="bg-white shadow-md rounded my-6">
        <table className="min-w-max w-full table-auto">
          <thead>
            <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
              <th
                className="py-3 px-6 text-right top-0 sticky bg-gray-200"
                scope="col"
              >
                &nbsp;
              </th>
              <th
                className="py-3 px-6 text-right top-0 sticky bg-gray-200"
                scope="col"
              >
                Totaal
              </th>
              <th
                className="py-3 px-6 text-right top-0 sticky bg-gray-200"
                scope="col"
              >
                Bart
              </th>
              <th
                className="py-3 px-6 text-right top-0 sticky bg-gray-200"
                scope="col"
              >
                Ian
              </th>
              <th
                className="py-3 px-6 text-right top-0 sticky bg-gray-200"
                scope="col"
              >
                Niels
              </th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm font-light">
            <tr className="border-b border-gray-200 hover:bg-gray-100 mb-10">
              <td className="py-3 px-6 text-right whitespace-nowrap border-r">
                <div>
                  <span className="font-medium">Bruto winst</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right whitespace-nowrap border-r">
                <div>
                  <span className="font-medium">
                    {currencyFormatter.format(totalProfit)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right whitespace-nowrap">
                <div>
                  <span>{currencyFormatter.format(grossProfitBart)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right whitespace-nowrap">
                <div>
                  <span>{currencyFormatter.format(grossProfitIan)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right whitespace-nowrap">
                <div>
                  <span>{currencyFormatter.format(grossProfitNiels)}</span>
                </div>
              </td>
            </tr>
            <tr className="border-b border-gray-200 text-xs italic hover:bg-gray-100">
              <td className="py-3 px-6 text-right whitespace-nowrap border-r">
                <div>
                  <span>
                    Bruto inkomstenbelasting ({config.taxPercentage * 100}%)
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right whitespace-nowrap border-r">
                <div>
                  <span>{currencyFormatter.format(grossTax)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right whitespace-nowrap">
                <div>
                  <span>{currencyFormatter.format(grossTaxBart)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right whitespace-nowrap">
                <div>
                  <span>{currencyFormatter.format(grossTaxIan)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right whitespace-nowrap">
                <div>
                  <span>{currencyFormatter.format(grossTaxNiels)}</span>
                </div>
              </td>
            </tr>
            <tr className="h-10 border-b">
              <td className="border-r" />
              <td className="border-r" />
              <td colSpan={3} />
            </tr>
            <tr className="border-b border-gray-200 hover:bg-gray-100">
              <td className="py-3 px-6 text-right whitespace-nowrap border-r">
                <div>
                  <span className="font-medium">Kosten</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right whitespace-nowrap border-r">
                <div>
                  <span className="font-medium">
                    {currencyFormatter.format(totalCosts)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right whitespace-nowrap">
                <div>
                  <span>{currencyFormatter.format(costsBart)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right whitespace-nowrap">
                <div>
                  <span>{currencyFormatter.format(costsIan)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right whitespace-nowrap">
                <div>
                  <span>{currencyFormatter.format(costsNiels)}</span>
                </div>
              </td>
            </tr>
            <tr className="border-b border-gray-200 text-xs italic hover:bg-gray-100">
              <td className="py-3 px-6 text-right whitespace-nowrap border-r">
                <div>
                  <span>Simuleer extra kosten</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right whitespace-nowrap border-r">
                <div>
                  <span>{currencyFormatter.format(simulatedExtraCosts)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right whitespace-nowrap">
                <div>
                  <span>
                    €{' '}
                    <input
                      className="appearance-none w-32 bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                      type="number"
                      value={simulatedExtraCostsBart}
                      size={60}
                      onChange={(e) => {
                        setSimulatedExtraCostsBart(parseFloat(e.target.value));
                      }}
                    />
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right whitespace-nowrap">
                <div>
                  <span>
                    €{' '}
                    <input
                      className="appearance-none w-32 bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                      type="number"
                      value={simulatedExtraCostsIan}
                      size={60}
                      onChange={(e) => {
                        setSimulatedExtraCostsIan(parseFloat(e.target.value));
                      }}
                    />
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right whitespace-nowrap">
                <div>
                  <span>
                    €{' '}
                    <input
                      className="appearance-none w-32 bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                      type="number"
                      value={simulatedExtraCostsNiels}
                      size={60}
                      onChange={(e) => {
                        setSimulatedExtraCostsNiels(parseFloat(e.target.value));
                      }}
                    />
                  </span>
                </div>
              </td>
            </tr>
            <tr className="border-b border-gray-200 text-xs italic hover:bg-gray-100">
              <td className="py-3 px-6 text-right whitespace-nowrap border-r">
                <div>
                  <span>Subtotaal bruto winst</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right whitespace-nowrap border-r">
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
              <td className="py-3 px-6 text-right whitespace-nowrap">
                <div>
                  <span>
                    {currencyFormatter.format(grossProfitBart - costsBart)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right whitespace-nowrap">
                <div>
                  <span>
                    {currencyFormatter.format(grossProfitIan - costsIan)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right whitespace-nowrap">
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
              <td className="py-3 px-6 text-right whitespace-nowrap border-r">
                <div>
                  <span className="font-medium">Mkb-winstvrijstelling</span>
                  <div className="text-xs italic">Altijd 14%</div>
                </div>
              </td>
              <td className="py-3 px-6 text-right whitespace-nowrap border-r">
                <div>
                  <span className="font-medium">
                    {currencyFormatter.format(profitExemption)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right whitespace-nowrap">
                <div>
                  <span>{currencyFormatter.format(profitExemptionBart)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right whitespace-nowrap">
                <div>
                  <span>{currencyFormatter.format(profitExemptionIan)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right whitespace-nowrap">
                <div>
                  <span>{currencyFormatter.format(profitExemptionNiels)}</span>
                </div>
              </td>
            </tr>
            <tr className="border-b border-gray-200 text-xs italic hover:bg-gray-100">
              <td className="py-3 px-6 text-right whitespace-nowrap border-r">
                <div>
                  <span>Subtotaal bruto winst</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right whitespace-nowrap border-r">
                <div>
                  <span>
                    {currencyFormatter.format(grossProfitAfterExemption)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right whitespace-nowrap">
                <div>
                  <span>
                    {currencyFormatter.format(grossProfitAfterExemptionBart)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right whitespace-nowrap">
                <div>
                  <span>
                    {currencyFormatter.format(grossProfitAfterExemptionIan)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right whitespace-nowrap">
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
              <td className="py-3 px-6 text-right whitespace-nowrap border-r">
                <div>
                  <span className="font-medium">(Deels) arbeidsongeschikt</span>
                </div>
              </td>
              <td className="py-3 px-6 text-center whitespace-nowrap border-r">
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
              <td className="py-3 px-6 text-center whitespace-nowrap">
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
              <td className="py-3 px-6 text-center whitespace-nowrap">
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
              <td className="py-3 px-6 text-center whitespace-nowrap">
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
              <td className="py-3 px-6 text-right whitespace-nowrap border-r">
                <div>
                  <span className="font-medium">Voldoet aan urencriterium</span>
                  <div className="text-xs italic">1 juli t/m 31 december</div>
                </div>
              </td>
              <td className="py-3 px-6 text-center whitespace-nowrap border-r">
                <input
                  type="checkbox"
                  className="form-checkbox rounded bg-gray-200"
                  checked={hourCriteriumAll}
                  disabled
                />
              </td>
              <td className="py-3 px-6 text-center whitespace-nowrap">
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
                    {props.timeSpent.bart.fromJuly.toFixed(0)} /{' '}
                    {(unfitForWorkBart
                      ? config.hourCriteriumFromJulyUnfitForWork
                      : config.hourCriteriumFromJuly
                    ).toFixed(0)}{' '}
                    uren geboekt
                  </div>
                </div>
              </td>
              <td className="py-3 px-6 text-center whitespace-nowrap">
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
                    {props.timeSpent.ian.fromJuly.toFixed(0)} /{' '}
                    {(unfitForWorkIan
                      ? config.hourCriteriumFromJulyUnfitForWork
                      : config.hourCriteriumFromJuly
                    ).toFixed(0)}{' '}
                    uren geboekt
                  </div>
                </div>
              </td>
              <td className="py-3 px-6 text-center whitespace-nowrap">
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
                    {props.timeSpent.niels.fromJuly.toFixed(0)} /{' '}
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
              <td className="py-3 px-6 text-right whitespace-nowrap border-r">
                <div>
                  <span className="font-medium">Pas ondernemersaftrek toe</span>
                  <div className="text-xs italic">
                    Wel of niet de zelfstandigenaftrek & startersaftrek
                    toepassen?
                  </div>
                </div>
              </td>
              <td className="py-3 px-6 text-center whitespace-nowrap border-r">
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
              <td className="py-3 px-6 text-center whitespace-nowrap">
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
              <td className="py-3 px-6 text-center whitespace-nowrap">
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
              <td className="py-3 px-6 text-center whitespace-nowrap">
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
              <td className="py-3 px-6 text-right whitespace-nowrap border-r">
                <div>
                  <span className="font-medium">Zelfstandigenaftrek</span>
                  <div className="text-xs italic">
                    Max. 100%, &euro; 6670, of &euro; 0 bij
                    arbeidsongeschiktheid
                  </div>
                </div>
              </td>
              <td className="py-3 px-6 text-right whitespace-nowrap border-r">
                <div>
                  <span className="font-medium">
                    {currencyFormatter.format(selfEmployedDeduction)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right whitespace-nowrap">
                <div>
                  <span>
                    {currencyFormatter.format(selfEmployedDeductionBart)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right whitespace-nowrap">
                <div>
                  <span>
                    {currencyFormatter.format(selfEmployedDeductionIan)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right whitespace-nowrap">
                <div>
                  <span>
                    {currencyFormatter.format(selfEmployedDeductionNiels)}
                  </span>
                </div>
              </td>
            </tr>
            <tr className="border-b border-gray-200 hover:bg-gray-100">
              <td className="py-3 px-6 text-right whitespace-nowrap border-r">
                <div>
                  <span className="font-medium">Startersaftrek</span>
                  <div className="text-xs italic">
                    Max. 100%, &euro; 2123, of &euro; 12.000 bij
                    arbeidsongeschiktheid
                  </div>
                </div>
              </td>
              <td className="py-3 px-6 text-right whitespace-nowrap border-r">
                <div>
                  <span className="font-medium">
                    {currencyFormatter.format(startupDeduction)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right whitespace-nowrap">
                <div>
                  <span>{currencyFormatter.format(startupDeductionBart)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right whitespace-nowrap">
                <div>
                  <span>{currencyFormatter.format(startupDeductionIan)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right whitespace-nowrap">
                <div>
                  <span>{currencyFormatter.format(startupDeductionNiels)}</span>
                </div>
              </td>
            </tr>
            <tr className="border-b border-gray-200 text-xs italic hover:bg-gray-100">
              <td className="py-3 px-6 text-right whitespace-nowrap border-r">
                <div>
                  <span>Subtotaal bruto winst</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right whitespace-nowrap border-r">
                <div>
                  <span>
                    {currencyFormatter.format(grossProfitAfterDeduction)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right whitespace-nowrap">
                <div>
                  <span>
                    {currencyFormatter.format(grossProfitAfterDeductionBart)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right whitespace-nowrap">
                <div>
                  <span>
                    {currencyFormatter.format(grossProfitAfterDeductionIan)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right whitespace-nowrap">
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
              <td className="py-3 px-6 text-right whitespace-nowrap border-r">
                <div>
                  <span className="font-medium">Netto winst</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right whitespace-nowrap border-r">
                <div>
                  <span className="font-medium">
                    {currencyFormatter.format(netProfit)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right whitespace-nowrap">
                <div>
                  <span>{currencyFormatter.format(netProfitBart)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right whitespace-nowrap">
                <div>
                  <span>{currencyFormatter.format(netProfitIan)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right whitespace-nowrap">
                <div>
                  <span>{currencyFormatter.format(netProfitNiels)}</span>
                </div>
              </td>
            </tr>
            <tr className="border-b border-gray-200 text-xs italic bg-gray-50 hover:bg-gray-100">
              <td className="py-3 px-6 text-right whitespace-nowrap border-r">
                <div>
                  <span>
                    Netto inkomstenbelasting ({config.taxPercentage * 100}%)
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right whitespace-nowrap border-r">
                <div>
                  <span>{currencyFormatter.format(netTax)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right whitespace-nowrap">
                <div>
                  <span>{currencyFormatter.format(netTaxBart)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right whitespace-nowrap">
                <div>
                  <span>{currencyFormatter.format(netTaxIan)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right whitespace-nowrap">
                <div>
                  <span>{currencyFormatter.format(netTaxNiels)}</span>
                </div>
              </td>
            </tr>
            <tr className="border-b border-gray-200 text-xs italic bg-gray-50 hover:bg-gray-100">
              <td className="py-3 px-6 text-right whitespace-nowrap border-r">
                <div>
                  <span>Inkomensafhankelijke bijdrage Zvw en Wlz (5.75%)</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right whitespace-nowrap border-r">
                <div>
                  <span>{currencyFormatter.format(contributionHIA)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right whitespace-nowrap">
                <div>
                  <span>{currencyFormatter.format(contributionHIABart)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right whitespace-nowrap">
                <div>
                  <span>{currencyFormatter.format(contributionHIAIan)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right whitespace-nowrap">
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
              <td className="py-3 px-6 text-right whitespace-nowrap border-r">
                <div>
                  <span className="font-medium">Over na onttrekkingen</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right whitespace-nowrap border-r">
                <div>
                  <span className="font-medium">
                    {currencyFormatter.format(netLeft)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right whitespace-nowrap">
                <div>
                  <span>{currencyFormatter.format(netLeftBart)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right whitespace-nowrap">
                <div>
                  <span>{currencyFormatter.format(netLeftIan)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right whitespace-nowrap">
                <div>
                  <span>{currencyFormatter.format(netLeftNiels)}</span>
                </div>
              </td>
            </tr>
            <tr className="border-b border-gray-200 text-xs italic bg-gray-50 hover:bg-gray-100">
              <td className="py-3 px-6 text-right whitespace-nowrap border-r">
                <div>
                  <span>Onttrekkingen</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right whitespace-nowrap border-r">
                <div>
                  <span>{currencyFormatter.format(totalWithDrawals)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right whitespace-nowrap">
                <div>
                  <span>{currencyFormatter.format(withDrawalsBart)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right whitespace-nowrap">
                <div>
                  <span>{currencyFormatter.format(withDrawalsIan)}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right whitespace-nowrap">
                <div>
                  <span>{currencyFormatter.format(withDrawalsNiels)}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
