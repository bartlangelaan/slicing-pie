import { Person } from '../../pages/api/get-slicing-pie';

export type GetSlicingPieResponse = {
  timeSpent: {
    [key in Person]: {
      year: number;
      fromJuly: number;
      yearFiltered: number;
      fromJulyFiltered: number;
    };
  };
  personalFinancialMutations: {
    [key in Person]: { plus: number; min: number };
  };
  personalCosts: { [key in Person]: { plus: number; min: number } };
  totalTimeSpent: number;
  totalTimeSpentFiltered: number;
  totalProfit: { plus: number; min: number; openPlus: number; openMin: number };
  revenuePerAccount: {
    id: string;
    company: string;
    revenue: number;
    goodwillValuePerson: Person | null;
    goodwillValue: number;
  }[];
};
