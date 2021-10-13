import Highcharts from 'highcharts';
import HighchartsExporting from 'highcharts/modules/exporting';
import { NextPageContext } from 'next';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import styled from 'styled-components';

import { useState } from 'react';
import { Loader } from '../components/Loader';
import { basicAuthCheck } from '../utils/access';

const DynamicDashboard = dynamic<any>(
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

const Header = styled.header<{ isRefreshingData: boolean }>`
  background-color: ${(p) => (p.isRefreshingData ? '#c38437' : '#3790c3')};
  transition: ease-in-out 0.2s;
`;

export default function Home() {
  const [isRefreshingData, setIsRefreshingData] = useState(true);

  return (
    <>
      <Head>
        <title>Slicing pie - Popup IO</title>
      </Head>
      <div className="bg-white flex flex-col min-h-screen">
        <Header
          className="text-white p-6 flex sticky top-0 z-10"
          isRefreshingData={isRefreshingData}
        >
          <h1 className="text-xl flex items-center content-center flex-1">
            <img
              src="/logo-popup-io-cropped-white.png"
              alt="Logo Popup IO"
              width={120}
            />
            <span className="ml-4 -mt-2">-</span>
            <span className="ml-4 -mt-2">Slicing pie</span>
          </h1>
          <span>
            <span
              title={isRefreshingData ? 'Refreshing data' : 'Up-to-date'}
              className={`material-icons material-icons-outlined${
                isRefreshingData ? ' animate-spin' : ''
              }`}
            >
              autorenew
            </span>
          </span>
        </Header>
        <div className="flex-1 flex items-center justify-center bg-gray-50 flex-col">
          <DynamicDashboard
            isRefreshingData={isRefreshingData}
            setIsRefreshingData={setIsRefreshingData}
          />
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
