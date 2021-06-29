import { NextApiRequest, NextApiResponse } from 'next';
import { requestAll } from './get-slicing-pie';

export default async (_req: NextApiRequest, res: NextApiResponse) => {
  const response = await requestAll(
    '/time_entries.json?filter=period:202011..202112',
  );

  res.json({
    data: response,
  });
};
