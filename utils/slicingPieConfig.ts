const config2021 = {
  taxPercentageBracket1: 0.371,
  taxPercentageBracket2: 0.495,
  taxPercentageBracket2From: 68508,
  taxRateAdjustmentBracket2: 0.063,
  HIAPercentage: 0.0575,
  maxHIA: 3353,
  generalTaxCredit: {
    generalTaxCreditThreshold: 21044,
    generalTaxCreditPercentage: 0.05977,
    maxGeneralTaxCredit: 2837,
  },
  labourTaxCredit: {
    labourTaxCreditMinThreshold: 35652,
    labourTaxCreditMaxThreshold: 105737,
    labourTaxCreditPercentage: 0.06,
    maxLabourTaxCredit: 4205,
  },
  filterHoursFromJuly: true,
  hourCriterium: 1225 - 24 * 26,
  minHoursPerWeek: (1225 - 24 * 26) / 26,
  maxSelfEmployedDeduction: 6670,
  maxStartupDeduction: 2123,
  SSIDeductionValue: {
    bart: 0,
    ian: 3122.32,
    niels: 778.42,
  },
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
  applyStartupDeduction: {
    bart: false,
    ian: false,
    niels: false,
  },
  meetsHourCriterium: {
    bart: false,
    ian: true,
    niels: false,
  },
  incomeFromEmployment: {
    bart: true,
    ian: true,
    niels: true,
  },
};

const config2022 = {
  ...config2021,
  taxPercentageBracket1: 0.3707,
  taxPercentageBracket2: 0.495,
  taxRateAdjustmentBracket2: 0.095,
  maxSelfEmployedDeduction: 6310,
  maxStartupDeduction: 2123,
  taxPercentageBracket2From: 69399,
  generalTaxCredit: {
    generalTaxCreditThreshold: 21318,
    generalTaxCreditPercentage: 0.06007,
    maxGeneralTaxCredit: 2888,
  },
  labourTaxCredit: {
    labourTaxCreditMinThreshold: 36650,
    labourTaxCreditMaxThreshold: 109347,
    labourTaxCreditPercentage: 0.0586,
    maxLabourTaxCredit: 4260,
  },
  HIAPercentage: 0.055,
  maxHIA: 3284,
  filterHoursFromJuly: false,
  hourCriterium: 1225,
  minHoursPerWeek: 1225 / 52,
  pieDistributionKey: 0.2,
  SSIDeductionValue: {
    bart: 0,
    ian: 0,
    niels: 0,
  },
  lastYearPie: {
    bart: 0.0669,
    ian: 0.7853,
    niels: 0.1478,
  },
  applyStartupDeduction: {
    bart: false,
    ian: true,
    niels: false,
  },
  meetsHourCriterium: {
    bart: false,
    ian: true,
    niels: false,
  },
  incomeFromEmployment: {
    bart: true,
    ian: false,
    niels: true,
  },
};

const configs = {
  2021: config2021,
  2022: config2022,
};

export default configs;
