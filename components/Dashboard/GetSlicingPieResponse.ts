export type Person = 'bart' | 'ian' | 'niels';

export type GetSlicingPieResponse = {
  status: 200;
  year: string;
  timeSpent: {
    [key in Person]: {
      year: number;
      fromJuly: number;
      yearFiltered: number;
      fromJulyFiltered: number;
    };
  };
  personalGeneralJournalDocuments: {
    [key in Person]: { plus: number; min: number };
  };
  personalFinancialMutations: {
    [key in Person]: { plus: number; min: number };
  };
  personalPurchaseInvoices: object;
  personalReceipts: object;
  personalCosts: { [key in Person]: { plus: number; min: number } };
  totalTimeSpent: number;
  totalTimeSpentFiltered: number;
  totalProfit: {
    plus: number;
    min: number;
    openPlus: number;
    openMin: number;
    personalPlus: number;
    personalMin: number;
    costOfSales: number;
  };
  revenuePerAccount: {
    id: string;
    company: string;
    revenue: number;
    goodwillValuePerson: Person | null;
    goodwillValue: number;
  }[];
  timeSpentPerProject: {
    id: string;
    name: string;
    skipped: boolean;
    timeSpent: { [key in Person]: { billable: number; nonBillable: number } };
  }[];
};

export interface GetSlicingPieErrorResponse {
  status: 429;
  retryAfter: string;
}
