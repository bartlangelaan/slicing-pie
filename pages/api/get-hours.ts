import { NextApiRequest, NextApiResponse } from 'next';
import { basicAuthCheck } from '../../utils/access';
import { requestAll } from './get-slicing-pie';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  await basicAuthCheck(req, res);

  const response = await requestAll(
    '/time_entries.json?filter=period:202011..202112',
  );

  res.json({
    data: response,
  });
};
