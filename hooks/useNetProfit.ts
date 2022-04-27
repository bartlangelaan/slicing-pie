import {
  GetSlicingPieResponse,
  Person,
} from 'components/Dashboard/GetSlicingPieResponse';
import { useSlicingPie } from 'components/SlicingPieContext';
import { useState } from 'react';
import configs from 'utils/slicingPieConfig';

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

function calculateGeneralTaxCredit(
  income: number,
  generalTaxCreditThreshold: number,
  generalTaxCreditPercentage: number,
  maxGeneralTaxCredit: number,
) {
  return Math.max(
    0,
    maxGeneralTaxCredit -
      (income - generalTaxCreditThreshold) * generalTaxCreditPercentage,
  );
}

function calculateLabourTaxCredit(
  income: number,
  labourTaxCreditMinThreshold: number,
  labourTaxCreditMaxThreshold: number,
  labourTaxCreditPercentage: number,
  maxLabourTaxCredit: number,
) {
  if (income > labourTaxCreditMaxThreshold) {
    return 0;
  }

  return (
    maxLabourTaxCredit -
    (income - labourTaxCreditMinThreshold) * labourTaxCreditPercentage
  );
}

function useNetProfit(props: GetSlicingPieResponse) {
  const { periodFilter } = useSlicingPie();

  const config = configs[periodFilter];

  const [meetsHourCriteriumState, setMeetsHourCriteriumState] = useState(
    config.meetsHourCriterium,
  );

  const toggleMeetsHourCriterium = (person: Person | 'all') => {
    setMeetsHourCriteriumState((current) => ({
      ...current,
      ...(person === 'all'
        ? {
            // These are intentionally all Bart, in order to toggle all values to the inverse of Bart.
            bart: !current.bart,
            ian: !current.bart,
            niels: !current.bart,
          }
        : { [person]: !current[person] }),
    }));
  };

  const meetsHourCriterium = {
    ...meetsHourCriteriumState,
    all:
      meetsHourCriteriumState.bart &&
      meetsHourCriteriumState.ian &&
      meetsHourCriteriumState.niels,
  };

  const [applyStartupDeductionState, setApplyStartupDeductionState] = useState(
    config.applyStartupDeduction,
  );

  const toggleApplyStartupDeduction = (person: Person | 'all') => {
    setApplyStartupDeductionState((current) => ({
      ...current,
      ...(person === 'all'
        ? {
            // These are intentionally all Bart, in order to toggle all values to the inverse of Bart.
            bart: !current.bart,
            ian: !current.bart,
            niels: !current.bart,
          }
        : { [person]: !current[person] }),
    }));
  };

  const applyStartupDeduction = {
    ...applyStartupDeductionState,
    all:
      applyStartupDeductionState.bart &&
      applyStartupDeductionState.ian &&
      meetsHourCriteriumState.niels,
  };

  const [simulatedExtraProfit, setSimulatedExtraProfit] = useState(0);

  const [
    simulatedExtraPersonalCostsState,
    setSimulatedExtraPersonalCostsState,
  ] = useState({
    bart: 0,
    ian: 0,
    niels: 0,
  });

  const setSimulatedExtraCosts = (person: Person, value: number) => {
    setSimulatedExtraPersonalCostsState((current) => ({
      ...current,
      [person]: value || 0,
    }));
  };

  const simulatedExtraPersonalCosts = {
    ...simulatedExtraPersonalCostsState,
    total:
      simulatedExtraPersonalCostsState.bart +
      simulatedExtraPersonalCostsState.ian +
      simulatedExtraPersonalCostsState.niels,
  };

  const [simulatedExtraHoursState, setSimulatedExtraHoursState] = useState({
    bart: 0,
    ian: 0,
    niels: 0,
  });

  const setSimulatedExtraHours = (person: Person, value: number) => {
    setSimulatedExtraHoursState((current) => ({
      ...current,
      [person]: value,
    }));
  };

  const simulatedExtraHours = {
    ...simulatedExtraHoursState,
    total:
      simulatedExtraHoursState.bart +
      simulatedExtraHoursState.ian +
      simulatedExtraHoursState.niels,
  };
  const totalTimeSpentFiltered =
    props.totalTimeSpentFiltered + simulatedExtraHours.total;

  const filteredHours = {
    bart: props.timeSpent.bart.yearFiltered + simulatedExtraHoursState.bart,
    ian: props.timeSpent.ian.yearFiltered + simulatedExtraHoursState.ian,
    niels: props.timeSpent.niels.yearFiltered + simulatedExtraHoursState.niels,
  };

  const allHours = {
    bart:
      props.timeSpent.bart[config.filterHoursFromJuly ? 'fromJuly' : 'year'] +
      simulatedExtraHours.bart,
    ian:
      props.timeSpent.ian[config.filterHoursFromJuly ? 'fromJuly' : 'year'] +
      simulatedExtraHours.ian,
    niels:
      props.timeSpent.niels[config.filterHoursFromJuly ? 'fromJuly' : 'year'] +
      simulatedExtraHours.niels,
  };

  const endDate = config.filterHoursFromJuly
    ? new Date('2021-12-31').getTime()
    : Date.now();

  const numberOfPastWeeks =
    (endDate -
      new Date(
        config.filterHoursFromJuly ? '2021-07-01' : '2022-01-01',
      ).getTime()) /
    (7 * 24 * 60 * 60 * 1000);

  const hoursPerWeek = {
    bart: allHours.bart / numberOfPastWeeks,
    ian: allHours.ian / numberOfPastWeeks,
    niels: allHours.niels / numberOfPastWeeks,
  };

  const piePercentageThisYear = {
    bart: filteredHours.bart / totalTimeSpentFiltered,
    ian: filteredHours.ian / totalTimeSpentFiltered,
    niels: filteredHours.niels / totalTimeSpentFiltered,
    total: 0,
  };

  piePercentageThisYear.total =
    piePercentageThisYear.bart +
    piePercentageThisYear.ian +
    piePercentageThisYear.niels;

  const distributedPiePercentageThisYear = {
    bart: piePercentageThisYear.bart * (1 - config.pieDistributionKey),
    ian: piePercentageThisYear.ian * (1 - config.pieDistributionKey),
    niels: piePercentageThisYear.niels * (1 - config.pieDistributionKey),
    total: 0,
  };

  distributedPiePercentageThisYear.total =
    distributedPiePercentageThisYear.bart +
    distributedPiePercentageThisYear.ian +
    distributedPiePercentageThisYear.niels;

  const distributedPiePercentageLastYear = {
    bart: config.lastYearPie.bart * config.pieDistributionKey,
    ian: config.lastYearPie.ian * config.pieDistributionKey,
    niels: config.lastYearPie.niels * config.pieDistributionKey,
    total: 0,
  };

  distributedPiePercentageLastYear.total =
    distributedPiePercentageLastYear.bart +
    distributedPiePercentageLastYear.ian +
    distributedPiePercentageLastYear.niels;

  const piePercentageResult = {
    bart:
      distributedPiePercentageThisYear.bart +
      distributedPiePercentageLastYear.bart,
    ian:
      distributedPiePercentageThisYear.ian +
      distributedPiePercentageLastYear.ian,
    niels:
      distributedPiePercentageThisYear.niels +
      distributedPiePercentageLastYear.niels,
  };

  const costs = {
    bart:
      props.personalCosts.bart.plus -
      props.personalCosts.bart.min +
      props.personalGeneralJournalDocuments.bart.plus -
      props.personalGeneralJournalDocuments.bart.min +
      simulatedExtraPersonalCostsState.bart,
    ian:
      props.personalCosts.ian.plus -
      props.personalCosts.ian.min +
      props.personalGeneralJournalDocuments.ian.plus -
      props.personalGeneralJournalDocuments.ian.min +
      simulatedExtraPersonalCostsState.ian,
    niels:
      props.personalCosts.niels.plus -
      props.personalCosts.niels.min +
      props.personalGeneralJournalDocuments.niels.plus -
      props.personalGeneralJournalDocuments.niels.min +
      simulatedExtraPersonalCostsState.niels,
    total: 0,
  };

  costs.total = costs.bart + costs.ian + costs.niels;

  const totalRevenue =
    props.totalProfit.plus + props.totalProfit.openPlus + simulatedExtraProfit;

  const grossRevenue = {
    bart: totalRevenue * piePercentageResult.bart,
    ian: totalRevenue * piePercentageResult.ian,
    niels: totalRevenue * piePercentageResult.niels,
    total: 0,
  };

  grossRevenue.total = totalRevenue;

  const generalCostsTotal =
    props.totalProfit.min +
    props.totalProfit.openMin +
    props.totalProfit.costOfSales +
    simulatedExtraPersonalCosts.total;

  const generalCosts = {
    bart: generalCostsTotal * piePercentageResult.bart,
    ian: generalCostsTotal * piePercentageResult.ian,
    niels: generalCostsTotal * piePercentageResult.niels,
    total: 0,
  };

  generalCosts.total = generalCostsTotal;

  const totalProfit =
    props.totalProfit.plus -
    props.totalProfit.min +
    props.totalProfit.openPlus -
    props.totalProfit.openMin -
    props.totalProfit.costOfSales +
    (simulatedExtraProfit || 0);

  const grossProfitBeforePersonalCosts = {
    bart: totalProfit * piePercentageResult.bart,
    ian: totalProfit * piePercentageResult.ian,
    niels: totalProfit * piePercentageResult.niels,
    total: 0,
  };

  grossProfitBeforePersonalCosts.total = totalProfit;

  const grossProfit = {
    bart: grossProfitBeforePersonalCosts.bart - costs.bart,
    ian: grossProfitBeforePersonalCosts.ian - costs.ian,
    niels: grossProfitBeforePersonalCosts.niels - costs.niels,
  };

  const selfEmployedDeduction = {
    bart: calculateSelfEmployedDeduction(
      grossProfit.bart,
      meetsHourCriterium.bart,
      config.maxSelfEmployedDeduction,
    ),
    ian: calculateSelfEmployedDeduction(
      grossProfit.ian,
      meetsHourCriterium.ian,
      config.maxSelfEmployedDeduction,
    ),
    niels: calculateSelfEmployedDeduction(
      grossProfit.niels,
      meetsHourCriterium.niels,
      config.maxSelfEmployedDeduction,
    ),
    total: 0,
  };

  selfEmployedDeduction.total =
    selfEmployedDeduction.bart +
    selfEmployedDeduction.ian +
    selfEmployedDeduction.niels;

  const startupDeduction = {
    bart: calculateStartupDeduction(
      grossProfit.bart,
      meetsHourCriterium.bart,
      applyStartupDeduction.bart,
      config.maxStartupDeduction,
    ),
    ian: calculateStartupDeduction(
      grossProfit.ian,
      meetsHourCriterium.ian,
      applyStartupDeduction.ian,
      config.maxStartupDeduction,
    ),
    niels: calculateStartupDeduction(
      grossProfit.niels,
      meetsHourCriterium.niels,
      applyStartupDeduction.niels,
      config.maxStartupDeduction,
    ),
    total: 0,
  };

  startupDeduction.total =
    startupDeduction.bart + startupDeduction.ian + startupDeduction.niels;

  const SSIDeduction = {
    bart: config.SSIDeductionValue.bart * config.SSIDectionPercentage,
    ian: config.SSIDeductionValue.ian * config.SSIDectionPercentage,
    niels: config.SSIDeductionValue.niels * config.SSIDectionPercentage,
    total: 0,
  };

  SSIDeduction.total =
    SSIDeduction.bart + SSIDeduction.ian + SSIDeduction.niels;

  const entrepreneursDeduction = {
    bart:
      selfEmployedDeduction.bart + startupDeduction.bart + SSIDeduction.bart,
    ian: selfEmployedDeduction.ian + startupDeduction.ian + SSIDeduction.ian,
    niels:
      selfEmployedDeduction.niels + startupDeduction.niels + SSIDeduction.niels,
    total: 0,
  };

  entrepreneursDeduction.total =
    entrepreneursDeduction.bart +
    entrepreneursDeduction.ian +
    entrepreneursDeduction.niels;

  const grossProfitAfterEntrepreneurDeduction = {
    bart: grossProfit.bart - entrepreneursDeduction.bart,
    ian: grossProfit.ian - entrepreneursDeduction.ian,
    niels: grossProfit.niels - entrepreneursDeduction.niels,
    total: 0,
  };

  grossProfitAfterEntrepreneurDeduction.total =
    grossProfitAfterEntrepreneurDeduction.bart +
    grossProfitAfterEntrepreneurDeduction.ian +
    grossProfitAfterEntrepreneurDeduction.niels;

  const profitExemption = {
    bart:
      (grossProfit.bart - entrepreneursDeduction.bart) *
      config.profitExemptionPercentage,
    ian:
      (grossProfit.ian - entrepreneursDeduction.ian) *
      config.profitExemptionPercentage,
    niels:
      (grossProfit.niels - entrepreneursDeduction.niels) *
      config.profitExemptionPercentage,
    total: 0,
  };

  profitExemption.total =
    profitExemption.bart + profitExemption.ian + profitExemption.niels;

  const grossProfitAfterExemption = {
    bart: grossProfit.bart - entrepreneursDeduction.bart - profitExemption.bart,
    ian: grossProfit.ian - entrepreneursDeduction.ian - profitExemption.ian,
    niels:
      grossProfit.niels - entrepreneursDeduction.niels - profitExemption.niels,
    total: 0,
  };

  grossProfitAfterExemption.total =
    grossProfitAfterExemption.bart +
    grossProfitAfterExemption.ian +
    grossProfitAfterExemption.niels;

  const netTax1 = {
    bart:
      Math.min(grossProfitAfterExemption.bart, config.taxPercentage2From) *
      config.taxPercentage1,
    ian:
      Math.min(grossProfitAfterExemption.ian, config.taxPercentage2From) *
      config.taxPercentage1,
    niels:
      Math.min(grossProfitAfterExemption.niels, config.taxPercentage2From) *
      config.taxPercentage1,
    total: 0,
  };

  netTax1.total = netTax1.bart + netTax1.ian + netTax1.niels;

  const netTax2 = {
    bart: Math.max(
      0,
      (grossProfitAfterExemption.bart - config.taxPercentage2From) *
        config.taxPercentage2,
    ),
    ian: Math.max(
      0,
      (grossProfitAfterExemption.ian - config.taxPercentage2From) *
        config.taxPercentage2,
    ),
    niels: Math.max(
      0,
      (grossProfitAfterExemption.niels - config.taxPercentage2From) *
        config.taxPercentage2,
    ),
    total: 0,
  };

  netTax2.total = netTax2.bart + netTax2.ian + netTax2.niels;

  const generalTaxCredit = {
    bart: config.incomeFromEmployment.bart
      ? 0
      : calculateGeneralTaxCredit(
          grossProfitAfterExemption.bart,
          config.generalTaxCredit.generalTaxCreditThreshold,
          config.generalTaxCredit.generalTaxCreditPercentage,
          config.generalTaxCredit.maxGeneralTaxCredit,
        ),
    ian: config.incomeFromEmployment.ian
      ? 0
      : calculateGeneralTaxCredit(
          grossProfitAfterExemption.ian,
          config.generalTaxCredit.generalTaxCreditThreshold,
          config.generalTaxCredit.generalTaxCreditPercentage,
          config.generalTaxCredit.maxGeneralTaxCredit,
        ),
    niels: config.incomeFromEmployment.niels
      ? 0
      : calculateGeneralTaxCredit(
          grossProfitAfterExemption.niels,
          config.generalTaxCredit.generalTaxCreditThreshold,
          config.generalTaxCredit.generalTaxCreditPercentage,
          config.generalTaxCredit.maxGeneralTaxCredit,
        ),
    total: 0,
  };
  generalTaxCredit.total =
    generalTaxCredit.bart + generalTaxCredit.ian + generalTaxCredit.niels;

  const labourTaxCredit = {
    bart: config.incomeFromEmployment.bart
      ? 0
      : calculateLabourTaxCredit(
          grossProfitAfterExemption.bart,
          config.labourTaxCredit.labourTaxCreditMinThreshold,
          config.labourTaxCredit.labourTaxCreditMaxThreshold,
          config.labourTaxCredit.labourTaxCreditPercentage,
          config.labourTaxCredit.maxLabourTaxCredit,
        ),
    ian: config.incomeFromEmployment.ian
      ? 0
      : calculateLabourTaxCredit(
          grossProfitAfterExemption.ian,
          config.labourTaxCredit.labourTaxCreditMinThreshold,
          config.labourTaxCredit.labourTaxCreditMaxThreshold,
          config.labourTaxCredit.labourTaxCreditPercentage,
          config.labourTaxCredit.maxLabourTaxCredit,
        ),
    niels: config.incomeFromEmployment.niels
      ? 0
      : calculateLabourTaxCredit(
          grossProfitAfterExemption.niels,
          config.labourTaxCredit.labourTaxCreditMinThreshold,
          config.labourTaxCredit.labourTaxCreditMaxThreshold,
          config.labourTaxCredit.labourTaxCreditPercentage,
          config.labourTaxCredit.maxLabourTaxCredit,
        ),
    total: 0,
  };

  labourTaxCredit.total =
    labourTaxCredit.bart + labourTaxCredit.ian + labourTaxCredit.niels;

  const netTax = {
    bart: netTax1.bart + netTax2.bart,
    ian: netTax1.ian + netTax2.ian,
    niels: netTax1.niels + netTax2.niels,
    total: 0,
  };

  netTax.total = netTax.bart + netTax.ian + netTax.niels;

  const contributionHIA = {
    bart: calculateHIA(
      grossProfitAfterExemption.bart,
      config.HIAPercentage,
      config.maxHIA,
    ),
    ian: calculateHIA(
      grossProfitAfterExemption.ian,
      config.HIAPercentage,
      config.maxHIA,
    ),
    niels: calculateHIA(
      grossProfitAfterExemption.niels,
      config.HIAPercentage,
      config.maxHIA,
    ),
    total: 0,
  };

  contributionHIA.total =
    contributionHIA.bart + contributionHIA.ian + contributionHIA.niels;

  const netProfit = {
    bart: grossProfit.bart - netTax.bart - contributionHIA.bart,
    ian: grossProfit.ian - netTax.ian - contributionHIA.ian,
    niels: grossProfit.niels - netTax.niels - contributionHIA.niels,
    total: 0,
  };

  netProfit.total = netProfit.bart + netProfit.ian + netProfit.niels;

  const withDrawals = {
    bart:
      props.personalFinancialMutations.bart.min -
      props.personalFinancialMutations.bart.plus,
    ian:
      props.personalFinancialMutations.ian.min -
      props.personalFinancialMutations.ian.plus,
    niels:
      props.personalFinancialMutations.niels.min -
      props.personalFinancialMutations.niels.plus,
    total: 0,
  };

  withDrawals.total = withDrawals.bart + withDrawals.ian + withDrawals.niels;

  const netLeft = {
    bart: grossProfit.bart - withDrawals.bart,
    ian: grossProfit.ian - withDrawals.ian,
    niels: grossProfit.niels - withDrawals.niels,
    total: 0,
  };

  netLeft.total = netLeft.bart + netLeft.ian + netLeft.niels;

  const totalTax = {
    bart: netTax.bart + contributionHIA.bart,
    ian: netTax.ian + contributionHIA.ian,
    niels: netTax.niels + contributionHIA.niels,
    total: 0,
  };

  totalTax.total = totalTax.bart + totalTax.ian + totalTax.niels;

  const totalTaxPercentage = {
    bart: totalTax.bart / grossProfit.bart,
    ian: totalTax.ian / grossProfit.ian,
    niels: totalTax.niels / grossProfit.niels,
    average: 0,
  };

  totalTaxPercentage.average =
    (totalTaxPercentage.bart +
      totalTaxPercentage.ian +
      totalTaxPercentage.niels) /
    3;

  return {
    toggleMeetsHourCriterium,
    meetsHourCriterium,
    toggleApplyStartupDeduction,
    applyStartupDeduction,
    simulatedExtraProfit,
    setSimulatedExtraProfit,
    setSimulatedExtraCosts,
    simulatedExtraPersonalCosts,
    setSimulatedExtraHours,
    simulatedExtraHours,
    totalTimeSpentFiltered,
    filteredHours,
    allHours,
    numberOfPastWeeks,
    hoursPerWeek,
    piePercentageThisYear,
    distributedPiePercentageThisYear,
    distributedPiePercentageLastYear,
    piePercentageResult,
    costs,
    totalRevenue,
    grossRevenue,
    generalCosts,
    totalProfit,
    grossProfitBeforePersonalCosts,
    grossProfit,
    selfEmployedDeduction,
    startupDeduction,
    SSIDeduction,
    entrepreneursDeduction,
    grossProfitAfterEntrepreneurDeduction,
    profitExemption,
    grossProfitAfterExemption,
    netTax1,
    netTax2,
    generalTaxCredit,
    labourTaxCredit,
    netTax,
    contributionHIA,
    netProfit,
    withDrawals,
    netLeft,
    totalTax,
    totalTaxPercentage,
  };
}

export default useNetProfit;
