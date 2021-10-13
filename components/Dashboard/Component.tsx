import useAxios from 'axios-hooks';
import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { Loader } from '../Loader';
import { ClientRevenueTable } from './ClientRevenueTable';
import { GetSlicingPieResponse } from './GetSlicingPieResponse';
import { NetProfitTable } from './NetProfitTable';
import { SlicingPieChart } from './SlicingPieChart';

interface Props {
  isRefreshingData: boolean;
  setIsRefreshingData: Dispatch<SetStateAction<boolean>>;
}

export function Dashboard(props: Props) {
  const dataStringFromCache = localStorage.getItem('slicing-pie.data');
  let dataFromCache: GetSlicingPieResponse | null = null;

  try {
    if (dataStringFromCache) {
      dataFromCache = JSON.parse(dataStringFromCache) as GetSlicingPieResponse;
    }
  } catch {
    // Skip.
  }

  const [data, setData] = useState<GetSlicingPieResponse | null>(dataFromCache);

  const [{ data: responseData }] = useAxios<GetSlicingPieResponse>({
    url: '/api/get-slicing-pie',
  });

  const { setIsRefreshingData } = props;

  useEffect(() => {
    if (!responseData) return;

    setData(responseData);
    setIsRefreshingData(false);

    localStorage.setItem('slicing-pie.data', JSON.stringify(responseData));
  }, [responseData, setIsRefreshingData]);

  if (!data) return <Loader />;

  return (
    <>
      <SlicingPieChart {...data} />
      <NetProfitTable {...data} />
      <ClientRevenueTable {...data} />
    </>
  );
}
