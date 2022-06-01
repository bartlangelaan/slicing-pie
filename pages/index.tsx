import Highcharts from 'highcharts';
import HighchartsExporting from 'highcharts/modules/exporting';
import { NextPageContext } from 'next';
import Head from 'next/head';
import dynamic from 'next/dynamic';

import { Loader } from '../components/Loader';
import { Header } from '../components/Header';
import { useSlicingPie } from '../components/SlicingPieContext';

import 'tailwindcss/tailwind.css';
import '../styles/globals.css';

const DynamicDashboard = dynamic(
  () =>
    import('../components/Dashboard/Component').then(
      ({ Dashboard }) => Dashboard as any,
    ),
  {
    ssr: false,
    loading: Loader,
  },
);

if (typeof Highcharts === 'object') {
  HighchartsExporting(Highcharts);
}

export default function Home() {
  const { retryAfter } = useSlicingPie();

  return (
    <>
      <Head>
        <title>Slicing pie - Popup IO</title>
      </Head>
      <div className="bg-white flex flex-col min-h-screen">
        <Header />
        <div className="flex-1 flex items-center justify-center bg-gray-50 flex-col">
          {retryAfter ? (
            <>
              <h1 className="text-2xl">Moneybird rate limit overschreden</h1>
              <p>
                Probeer het opnieuw om{' '}
                {new Date(retryAfter).toLocaleTimeString('nl')}
              </p>
            </>
          ) : (
            <DynamicDashboard />
          )}
        </div>
      </div>
    </>
  );
}

export async function getServerSideProps(ctx: NextPageContext) {
  const { req, res } = ctx;

  if (!req || !res) return {};

  return {
    props: {},
  };
}
