import Highcharts from 'highcharts';
import HighchartsExporting from 'highcharts/modules/exporting';
import { NextPageContext } from 'next';
import Head from 'next/head';
import styled from 'styled-components';

import { Dashboard } from '../components/Dashboard/Component';
import { Loader } from '../components/Loader';
import { basicAuthCheck } from '../utils/access';

if (typeof Highcharts === 'object') {
  HighchartsExporting(Highcharts);
}

const Header = styled.header`
  background-color: #3790c3;
`;

export default function Home() {
  return (
    <>
      <Head>
        <title>Slicing pie - Popup IO</title>
      </Head>
      <div className="bg-white flex flex-col min-h-screen">
        <Header className="text-white p-8">
          <h1 className="text-2xl flex items-center content-center">
            <img
              src="/logo-popup-io-cropped-white.png"
              alt="Logo Popup IO"
              width={150}
            />
            <span className="ml-4 -mt-2">-</span>
            <span className="ml-4 -mt-2">Slicing pie</span>
          </h1>
        </Header>
        <div className="flex-1 flex items-center justify-center bg-gray-50 flex-col">
          {typeof window !== 'undefined' ? <Dashboard /> : <Loader />}
        </div>
      </div>
    </>
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
