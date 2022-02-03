import axios from 'axios';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  GetSlicingPieResponse,
  GetSlicingPieErrorResponse,
} from './Dashboard/GetSlicingPieResponse';

type YearFilter = 2021 | 2022;

type CacheData = { [key in YearFilter]?: GetSlicingPieResponse } | null;

function useSlicingPieContextValue() {
  const [periodFilter, setPeriodFilter] = useState<YearFilter>(2022);

  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  const canRetry = !retryAfter || Date.now() > retryAfter;

  useEffect(() => {
    if (!retryAfter) return () => {};

    const interval = setInterval(() => {
      if (!retryAfter) {
        clearInterval(interval);
      }

      if (Date.now() > retryAfter) {
        setRetryAfter(null);
        clearInterval(interval);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [retryAfter]);

  const [isRefreshingSlicingPie, setIsRefreshingSlicingPie] = useState<{
    [key in YearFilter]?: boolean;
  }>({
    [periodFilter]: true,
  });
  const [hiddenModeEnabled, setHiddenModeEnabled] = useState(
    typeof window !== 'undefined'
      ? window.localStorage.getItem('slicing-pie.hidden-mode') === 'true'
      : false,
  );

  const dataStringFromCache =
    typeof window !== 'undefined'
      ? window.localStorage.getItem('slicing-pie.data')
      : null;
  let dataFromCache: CacheData = null;

  try {
    if (dataStringFromCache) {
      dataFromCache = JSON.parse(dataStringFromCache) as CacheData;
    }
  } catch {
    // Skip.
  }

  const [data, setData] = useState<CacheData>(dataFromCache);
  const [
    hiddenModeData,
    // setHiddenModeData
  ] = useState<GetSlicingPieResponse | null>(null);

  const controller = useRef(
    typeof window !== 'undefined' ? new AbortController() : null,
  );

  const fetchData = useCallback(async () => {
    // Cancel previous load request.
    controller.current?.abort();
    controller.current = new AbortController();

    setIsRefreshingSlicingPie((currentIsRefreshingSlicingPie) => ({
      ...currentIsRefreshingSlicingPie,
      [periodFilter]: true,
    }));

    const response = await axios.get<
      GetSlicingPieResponse | GetSlicingPieErrorResponse
    >(`/api/get-slicing-pie?periodFilter=${periodFilter}`, {
      signal: controller.current?.signal,
    });

    if (response.data?.status === 200) {
      setData((currentData) => {
        const newData: CacheData = {
          ...currentData,
          [periodFilter]: response.data,
        };

        window.localStorage.setItem(
          'slicing-pie.data',
          JSON.stringify(newData),
        );

        return newData;
      });
    } else {
      setRetryAfter(parseInt(response.data.retryAfter, 10) * 1000);
    }

    setIsRefreshingSlicingPie((currentIsRefreshingSlicingPie) => ({
      ...currentIsRefreshingSlicingPie,
      [periodFilter]: false,
    }));
  }, [periodFilter]);

  useEffect(() => {
    fetchData();

    return () => {
      controller.current?.abort();
    };
  }, [fetchData]);

  // useEffect(() => {
  //   const timeout = window.setTimeout(() => {
  //     axios
  //       .get<GetSlicingPieResponse>('/api/get-slicing-pie?hidden=true')
  //       .then((response) => {
  //         setHiddenModeData(response.data);
  //       });
  //   }, 1000);

  //   return () => {
  //     clearTimeout(timeout);
  //   };
  // }, []);

  useEffect(() => {
    localStorage.setItem(
      'slicing-pie.hidden-mode',
      hiddenModeEnabled ? 'true' : 'false',
    );
  }, [hiddenModeEnabled]);

  return {
    isRefreshingSlicingPie: !!isRefreshingSlicingPie[periodFilter],
    setIsRefreshingSlicingPie,
    data:
      hiddenModeEnabled && hiddenModeData
        ? hiddenModeData
        : data?.[periodFilter],
    fetchData,
    hiddenModeEnabled,
    setHiddenModeEnabled,
    periodFilter,
    setPeriodFilter,
    retryAfter,
    canRetry,
    setRetryAfter,
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
