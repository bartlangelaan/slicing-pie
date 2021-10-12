import Highcharts from 'highcharts';
import HighchartsExporting from 'highcharts/modules/exporting';
import { NextPageContext } from 'next';

import { Dashboard } from '../components/Dashboard/Component';
import { basicAuthCheck } from '../utils/access';

if (typeof Highcharts === 'object') {
  HighchartsExporting(Highcharts);
}

export default function Home() {
  return (
    <div className="bg-white">
      <h1>Popup IO</h1>
      {typeof window !== 'undefined' ? <Dashboard /> : <h2>Loading...</h2>}
    </div>
  );
}

export async function getServerSideProps(ctx: NextPageContext) {
  const { req, res } = ctx;

  if (!req || !res) return {};

  await basicAuthCheck(req, res);

  return {
    props: {},
  };
}
