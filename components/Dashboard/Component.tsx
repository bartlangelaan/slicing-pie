import React from 'react';
import { Person } from '../../pages/api/get-slicing-pie';
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
  personalCosts: { [key in Person]: { plus: number; min: number } };
  totalTimeSpent: number;
  totalProfit: { plus: number; min: number };
}

export function Dashboard(props: Props) {
  return (
    <>
      <SlicingPieChart timeSpent={props.timeSpent} />
      <NetProfitTable {...props} />
      <ProfitBarChart {...props} />
    </>
  );
}
