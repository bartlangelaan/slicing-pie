const config2021 = {
  taxPercentage: 0.371,
  HIAPercentage: 0.0575,
  maxHIA: 3353,
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
};

const config2022 = {
  ...config2021,
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
};

const configs = {
  2021: config2021,
  2022: config2022,
};

export default configs;
