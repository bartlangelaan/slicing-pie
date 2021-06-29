import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async (_req: NextApiRequest, res: NextApiResponse) => {
  const response = await axios.get(
    'https://moneybird.com/api/v2/313185156605150255/financial_mutations.json',
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
