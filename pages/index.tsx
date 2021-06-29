import useAxios from 'axios-hooks';
import Highcharts from 'highcharts';
import HighchartsExporting from 'highcharts/modules/exporting';
import { Props, Dashboard } from '../components/Dashboard/Component';

if (typeof Highcharts === 'object') {
  HighchartsExporting(Highcharts);
}

export default function Home() {
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
