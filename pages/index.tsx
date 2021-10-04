import useAxios from 'axios-hooks';
import Highcharts from 'highcharts';
import HighchartsExporting from 'highcharts/modules/exporting';
import { NextPageContext } from 'next';
import initializeBasicAuth from 'nextjs-basic-auth';
import { Props, Dashboard } from '../components/Dashboard/Component';

const users = [
  { user: process.env.AUTH_USERNAME!, password: process.env.AUTH_PASSWORD! },
];

const basicAuthCheck = initializeBasicAuth({
  users,
});

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
      {!data ? 'Loading...' : <Dashboard {...data} />}
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
