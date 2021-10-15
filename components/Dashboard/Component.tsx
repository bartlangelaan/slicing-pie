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
    <>
      <SlicingPieChart {...data} />
      <NetProfitTable {...data} />
      <ClientRevenueTable {...data} />
      <ProjectInfoTable {...data} />
    </>
  );
}
