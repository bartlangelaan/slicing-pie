import useAxios from 'axios-hooks';
import React from 'react';
import { Loader } from '../Loader';
import { ClientRevenueTable } from './ClientRevenueTable';
import { GetSlicingPieResponse } from './GetSlicingPieResponse';
import { NetProfitTable } from './NetProfitTable';
import { SlicingPieChart } from './SlicingPieChart';

export function Dashboard() {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [{ data }] = useAxios<GetSlicingPieResponse>({
    url: '/api/get-slicing-pie',
  });

  if (!data) return <Loader />;

  return (
    <>
      <SlicingPieChart {...data} />
      <NetProfitTable {...data} />
      <ClientRevenueTable {...data} />
    </>
  );
}
