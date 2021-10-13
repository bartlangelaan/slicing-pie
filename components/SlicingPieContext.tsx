import axios from 'axios';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { GetSlicingPieResponse } from './Dashboard/GetSlicingPieResponse';

function useSlicingPieContextValue() {
  const [isRefreshingSlicingPie, setIsRefreshingSlicingPie] = useState(true);

  const dataStringFromCache =
    typeof window !== 'undefined'
      ? window.localStorage.getItem('slicing-pie.data')
      : null;
  let dataFromCache: GetSlicingPieResponse | null = null;

  try {
    if (dataStringFromCache) {
      dataFromCache = JSON.parse(dataStringFromCache) as GetSlicingPieResponse;
    }
  } catch {
    // Skip.
  }

  const [data, setData] = useState<GetSlicingPieResponse | null>(dataFromCache);

  const fetchData = useCallback(async () => {
    setIsRefreshingSlicingPie(true);

    const response = await axios.get<GetSlicingPieResponse>(
      '/api/get-slicing-pie',
    );

    if (response.data) {
      setData(response.data);
      window.localStorage.setItem(
        'slicing-pie.data',
        JSON.stringify(response.data),
      );
    }

    setIsRefreshingSlicingPie(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    isRefreshingSlicingPie,
    setIsRefreshingSlicingPie,
    data,
    fetchData,
  };
}

const SlicingPieContext = createContext<
  ReturnType<typeof useSlicingPieContextValue> | undefined
>(undefined);

interface Props {
  children: ReactNode;
}

export function SlicingPieProvider({ children }: Props) {
  const value = useSlicingPieContextValue();
  return (
    <SlicingPieContext.Provider value={value}>
      {children}
    </SlicingPieContext.Provider>
  );
}

export const useSlicingPie = () => {
  const context = useContext(SlicingPieContext);
  if (context === undefined) {
    throw new Error('useSlicingPie must be used within a SlicingPieProvider');
  }
  return context;
};
