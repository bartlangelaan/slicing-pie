import { useState } from 'react';
import { Person } from '../../pages/api/get-slicing-pie';

const currencyFormatter = Intl.NumberFormat('nl', {
  style: 'currency',
  currency: 'EUR',
});

export interface Props {
  timeSpent: {
    [key in Person]: {
      year: number;
      fromJuly: number;
      yearFiltered: number;
      fromJulyFiltered: number;
    };
  };
  personalCosts: { [key in Person]: { plus: number; min: number } };
  totalTimeSpent: number;
  totalProfit: { plus: number; min: number };
}

function calculateSelfEmployedDeduction(
  grossProfit: number,
  hourCriterium: boolean,
  unfitForWork: boolean,
) {
  if (!hourCriterium || unfitForWork) return 0;

  if (grossProfit < 6670) return grossProfit;

  return 6670;
}

function calculateStartupDeduction(
  grossProfit: number,
  hourCriterium: boolean,
  unfitForWork: boolean,
) {
  if (!hourCriterium) return 0;

  const maxDeduction = unfitForWork ? 12000 : 2123;

  if (grossProfit < maxDeduction) return grossProfit;

  return maxDeduction;
}

export function NetProfitTable(props: Props) {
  const [unfitForWorkAll, setUnfitForWorkAll] = useState(false);
  const [unfitForWorkBart, setUnfitForWorkBart] = useState(false);
  const [unfitForWorkIan, setUnfitForWorkIan] = useState(true);
  const [unfitForWorkNiels, setUnfitForWorkNiels] = useState(false);

  const [hourCriteriumAll, setHourCriteriumAll] = useState(false);
  const [hourCriteriumBart, setHourCriteriumBart] = useState(false);
  const [hourCriteriumIan, setHourCriteriumIan] = useState(true);
  const [hourCriteriumNiels, setHourCriteriumNiels] = useState(false);

  const totalProfit = props.totalProfit.plus - props.totalProfit.min;

  const grossProfitBart =
    totalProfit * (props.timeSpent.bart.yearFiltered / props.totalTimeSpent) ||
    0;
  const grossProfitIan =
    totalProfit * (props.timeSpent.ian.yearFiltered / props.totalTimeSpent) ||
    0;
  const grossProfitNiels =
    totalProfit * (props.timeSpent.niels.yearFiltered / props.totalTimeSpent) ||
    0;

  const grossTaxBart = grossProfitBart * 0.371;
  const grossTaxIan = grossProfitIan * 0.371;
  const grossTaxNiels = grossProfitNiels * 0.371;

  const grossTax = grossTaxBart + grossTaxIan + grossTaxNiels;

  const costsBart =
    props.personalCosts.bart.plus - props.personalCosts.bart.min;
  const costsIan = props.personalCosts.ian.plus - props.personalCosts.ian.min;
  const costsNiels =
    props.personalCosts.niels.plus - props.personalCosts.niels.min;

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
    unfitForWorkBart,
  );
  const selfEmployedDeductionIan = calculateSelfEmployedDeduction(
    grossProfitAfterExemptionIan,
    hourCriteriumIan,
    unfitForWorkIan,
  );
  const selfEmployedDeductionNiels = calculateSelfEmployedDeduction(
    grossProfitAfterExemptionNiels,
    hourCriteriumNiels,
    unfitForWorkNiels,
  );

  const selfEmployedDeduction =
    selfEmployedDeductionBart +
    selfEmployedDeductionIan +
    selfEmployedDeductionNiels;

  const startupDeductionBart = calculateStartupDeduction(
    grossProfitAfterExemptionBart - selfEmployedDeductionBart,
    hourCriteriumBart,
    unfitForWorkBart,
  );
  const startupDeductionIan = calculateStartupDeduction(
    grossProfitAfterExemptionIan - selfEmployedDeductionIan,
    hourCriteriumIan,
    unfitForWorkIan,
  );
  const startupDeductionNiels = calculateStartupDeduction(
    grossProfitAfterExemptionNiels - selfEmployedDeductionNiels,
    hourCriteriumNiels,
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

  const netTaxBart = grossProfitAfterDeductionBart * 0.371;
  const netTaxIan = grossProfitAfterDeductionIan * 0.371;
  const netTaxNiels = grossProfitAfterDeductionNiels * 0.371;

  const netTax = netTaxBart + netTaxIan + netTaxNiels;

  const netProfitBart = grossProfitBart - costsBart - netTaxBart;
  const netProfitIan = grossProfitIan - costsIan - netTaxIan;
  const netProfitNiels = grossProfitNiels - costsNiels - netTaxNiels;

  const netProfit = netProfitBart + netProfitIan + netProfitNiels;

  return (
    <div className="overflow-x-auto">
      <div className="bg-white shadow-md rounded my-6">
        <table className="min-w-max w-full table-auto">
          <thead>
            <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-right">&nbsp;</th>
              <th className="py-3 px-6 text-right">Totaal</th>
              <th className="py-3 px-6 text-right">Bart</th>
              <th className="py-3 px-6 text-right">Ian</th>
              <th className="py-3 px-6 text-right">Niels</th>
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
                    {currencyFormatter.format(
                      props.totalProfit.plus - props.totalProfit.min,
                    )}
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
                  <span>Bruto inkomstenbelasting (37.1%)</span>
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
                  className="form-checkbox rounded"
                  checked={hourCriteriumAll}
                  onChange={() => {
                    setHourCriteriumAll((currentHourCriteriumAll) => {
                      setHourCriteriumBart(!currentHourCriteriumAll);
                      setHourCriteriumIan(!currentHourCriteriumAll);
                      setHourCriteriumNiels(!currentHourCriteriumAll);

                      return !currentHourCriteriumAll;
                    });
                  }}
                />
              </td>
              <td className="py-3 px-6 text-center whitespace-nowrap">
                <div>
                  <input
                    type="checkbox"
                    className="form-checkbox rounded"
                    checked={hourCriteriumBart}
                    onChange={() => {
                      setHourCriteriumBart(
                        (currentHourCriteriumBart) => !currentHourCriteriumBart,
                      );
                    }}
                  />
                  <div className="mt-2">
                    min.{' '}
                    {(unfitForWorkBart
                      ? (800 - 16 * 26) / 26
                      : (1225 - 24 * 26) / 26
                    ).toFixed(1)}{' '}
                    uur / week
                  </div>
                  <div className="mt-2">
                    {props.timeSpent.bart.fromJuly.toFixed(0)} /{' '}
                    {(unfitForWorkBart
                      ? 800 - 16 * 26
                      : 1225 - 24 * 26
                    ).toFixed(0)}{' '}
                    uren geboekt
                  </div>
                </div>
              </td>
              <td className="py-3 px-6 text-center whitespace-nowrap">
                <div>
                  <input
                    type="checkbox"
                    className="form-checkbox rounded"
                    checked={hourCriteriumIan}
                    onChange={() => {
                      setHourCriteriumIan(
                        (currentHourCriteriumIan) => !currentHourCriteriumIan,
                      );
                    }}
                  />
                  <div className="mt-2">
                    min.{' '}
                    {(unfitForWorkIan
                      ? (800 - 16 * 26) / 26
                      : (1225 - 24 * 26) / 26
                    ).toFixed(1)}{' '}
                    uur / week
                  </div>
                  <div className="mt-2">
                    {props.timeSpent.ian.fromJuly.toFixed(0)} /{' '}
                    {(unfitForWorkIan ? 800 - 16 * 26 : 1225 - 24 * 26).toFixed(
                      0,
                    )}{' '}
                    uren geboekt
                  </div>
                </div>
              </td>
              <td className="py-3 px-6 text-center whitespace-nowrap">
                <div>
                  <input
                    type="checkbox"
                    className="form-checkbox rounded"
                    checked={hourCriteriumNiels}
                    onChange={() => {
                      setHourCriteriumNiels(
                        (currentHourCriteriumNiels) =>
                          !currentHourCriteriumNiels,
                      );
                    }}
                  />
                  <div className="mt-2">
                    min.{' '}
                    {(unfitForWorkNiels
                      ? (800 - 16 * 26) / 26
                      : (1225 - 24 * 26) / 26
                    ).toFixed(1)}{' '}
                    uur / week
                  </div>
                  <div className="mt-2">
                    {props.timeSpent.niels.fromJuly.toFixed(0)} /{' '}
                    {(unfitForWorkNiels
                      ? 800 - 16 * 26
                      : 1225 - 24 * 26
                    ).toFixed(0)}{' '}
                    uren geboekt
                  </div>
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
                  <span>Netto inkomstenbelasting (37.1%)</span>
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
          </tbody>
        </table>
      </div>
    </div>
  );
}
