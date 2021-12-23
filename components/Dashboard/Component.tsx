import { ErrorBoundary } from 'react-error-boundary';
import { Loader } from '../Loader';
import { useSlicingPie } from '../SlicingPieContext';
import { ClientRevenueTable } from './ClientRevenueTable';
import { NetProfitTable } from './NetProfitTable';
import { ProjectInfoTable } from './ProjectInfoTable';
import { SlicingPieChart } from './SlicingPieChart';

export function Dashboard() {
  const { data } = useSlicingPie();

  if (!data) return <Loader />;

  return (
    <ErrorBoundary
      FallbackComponent={Loader}
      onError={() => {
        window.localStorage.removeItem('slicing-pie.data');

        window.location.reload();
      }}
    >
      <SlicingPieChart {...data} />
      <NetProfitTable {...data} />
      <ClientRevenueTable {...data} />
      <ProjectInfoTable {...data} />
    </ErrorBoundary>
  );
}
