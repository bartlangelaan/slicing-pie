import React from 'react';
import { Person } from '../../pages/api/get-slicing-pie';
import { ClientRevenueTable } from './ClientRevenueTable';
import { NetProfitTable } from './NetProfitTable';
import { ProfitBarChart } from './ProfitBarChart';
import { SlicingPieChart } from './SlicingPieChart';

export interface Props {
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
  totalProfit: { plus: number; min: number };
  revenuePerAccount: {
    id: string;
    company: string;
    revenue: number;
    goodwillValuePerson: Person | null;
    goodwillValue: number;
  }[];
}

export function Dashboard(props: Props) {
  return (
    <>
      <SlicingPieChart timeSpent={props.timeSpent} />
      <NetProfitTable {...props} />
      <ProfitBarChart {...props} />
      <ClientRevenueTable {...props} />
    </>
  );
}
