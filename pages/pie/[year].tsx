import Highcharts from 'highcharts';
import HighchartsExporting from 'highcharts/modules/exporting';
import { GetStaticPropsContext, InferGetStaticPropsType } from 'next';
import Head from 'next/head';
import dynamic from 'next/dynamic';

import { Layout } from 'components/Layout';
import { getSlicingPie } from 'utils/get-slicing-pie';
import { SlicingPieDataProvider } from 'components/SlicingPieContext';
import { years } from 'utils/years';
import { Loader } from '../../components/Loader';

const DynamicDashboard = dynamic(
  () =>
    import('../../components/Dashboard/Component').then(
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

export async function getStaticPaths() {
  return {
    paths: years.map(({ year }) => ({
      params: {
        year,
      },
    })),
    fallback: false,
  };
}

export async function getStaticProps(
  context: GetStaticPropsContext<{ year: string }>,
) {
  return {
    props: {
      data: await getSlicingPie(context.params!.year),
      year: parseInt(context.params!.year, 10),
    },
  };
}

export default function Home(
  props: InferGetStaticPropsType<typeof getStaticProps>,
) {
  return (
    <Layout>
      <Head>
        <title>Slicing pie - Popup IO</title>
      </Head>
      <div className="bg-white flex flex-col min-h-screen">
        <div className="flex-1 flex items-center justify-center bg-gray-50 flex-col">
          <SlicingPieDataProvider
            value={{ data: props.data, periodFilter: props.year }}
          >
            <DynamicDashboard />
          </SlicingPieDataProvider>
        </div>
      </div>
    </Layout>
  );
}
