/* eslint-disable @typescript-eslint/no-var-requires */
const { format } = require('date-fns');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compiler: {
    styledComponents: true,
  },
  experimental: {
    newNextLinkBehavior: true,
  },
  redirects: async () => {
    return [
      {
        source: '/',
        destination: `/pie/${format(new Date(), 'yyyy')}`,
        permanent: false,
      },
      {
        source: '/pie',
        destination: `/pie/${format(new Date(), 'yyyy')}`,
        permanent: false,
      },
      {
        source: '/hours',
        destination: `/hours/${format(new Date(), 'yyyy/Q')}`,
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
