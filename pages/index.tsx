import useAxios from 'axios-hooks';
import Highcharts from 'highcharts';
import HighchartsExporting from 'highcharts/modules/exporting';
import { Props, Dashboard } from '../components/Dashboard/Component';

if (typeof Highcharts === 'object') {
  HighchartsExporting(Highcharts);
}

export default function Home() {
  if (typeof window === 'undefined') return null;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [{ data }] = useAxios<Props>({
    url: '/api/get-slicing-pie',
  });

  return (
    <div className="bg-white">
      <h1>Popup IO</h1>
      {!data ? (
        'Loading...'
      ) : (
        <Dashboard
          timeSpent={data.timeSpent}
          totalProfit={data.totalProfit}
          totalTimeSpent={data.totalTimeSpent}
          personalCosts={data.personalCosts}
        />
      )}
    </div>
  );
}
