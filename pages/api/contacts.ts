import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { basicAuthCheck } from '../../utils/access';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  await basicAuthCheck(req, res);

  const response = await axios.get(
    'https://moneybird.com/api/v2/313185156605150255/contacts.json',
    {
      headers: {
        authorization: `Bearer ${process.env.MONEYBIRD_API_KEY}`,
      },
    },
  );

  // console.log(response);

  res.json({
    data: response.data,
  });
};
