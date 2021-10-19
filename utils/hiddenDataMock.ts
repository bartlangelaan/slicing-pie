import { GetSlicingPieResponse } from '../components/Dashboard/GetSlicingPieResponse';

export const hiddenDataMock = {
  totalProfit: {
    plus: 2000,
    min: 1000,
    openPlus: 0,
    openMin: 0,
    personalPlus: 0,
    personalMin: 200,
  },
  personalCosts: {
    bart: {
      plus: 0,
      min: 0,
    },
    ian: {
      plus: 150,
      min: 0,
    },
    niels: {
      plus: 50,
      min: 0,
    },
  },
  personalFinancialMutations: {
    bart: {
      plus: 0,
      min: 0,
    },
    ian: {
      plus: 100,
      min: 200,
    },
    niels: {
      plus: 0,
      min: 0,
    },
  },
  personalPurchaseInvoices: {
    bart: {
      plus: 0,
      min: 0,
    },
    ian: {
      plus: 0,
      min: 0,
    },
    niels: {
      plus: 0,
      min: 0,
    },
  },
  personalReceipts: {
    bart: {
      plus: 0,
      min: 0,
    },
    ian: {
      plus: 0,
      min: 0,
    },
    niels: {
      plus: 0,
      min: 0,
    },
  },
  timeSpent: {
    bart: {
      year: 100,
      yearFiltered: 100,
      fromJuly: 50,
      fromJulyFiltered: 50,
    },
    ian: {
      year: 500,
      yearFiltered: 500,
      fromJuly: 300,
      fromJulyFiltered: 300,
    },
    niels: {
      year: 150,
      yearFiltered: 150,
      fromJuly: 80,
      fromJulyFiltered: 80,
    },
  },
  totalTimeSpent: 750,
  totalTimeSpentFiltered: 750,
  revenuePerAccount: [
    {
      revenue: 2000,
      goodwillValuePerson: 'ian',
      goodwillValue: 0,
      id: '123456789',
      company: 'Dummy account',
    },
  ],
  timeSpentPerProject: [
    {
      id: '123456789',
      name: 'Dummy project',
      skipped: false,
      timeSpent: {
        bart: {
          billable: 0,
          nonBillable: 0,
        },
        ian: {
          billable: 0,
          nonBillable: 0,
        },
        niels: {
          billable: 0,
          nonBillable: 0,
        },
      },
    },
  ],
} as GetSlicingPieResponse;
