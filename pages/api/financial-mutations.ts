import { NextApiRequest, NextApiResponse } from 'next';
import { basicAuthCheck } from '../../utils/access';
import { api, requestAll } from './get-slicing-pie';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  await basicAuthCheck(req, res);

  const financialMutationsSyncResponse = await requestAll<
    {
      id: string;
      version: number;
    }[]
  >('/financial_mutations/synchronization.json', { cache: { maxAge: 0 } });

  const financialMutationsResponses = [];

  // eslint-disable-next-line no-restricted-syntax
  for (const financialMutationsRequest of financialMutationsSyncResponse) {
    // eslint-disable-next-line no-await-in-loop
    const financialMutationsResponse = await api.post<
      {
        amount: string;
        ledger_account_bookings: {
          ledger_account_id: string;
          price: string;
        }[];
      }[]
    >('/financial_mutations/synchronization.json', {
      ids: [financialMutationsRequest.id],
      version: financialMutationsRequest.version,
    });

    financialMutationsResponses.push(financialMutationsResponse.data[0]);
  }

  res.json({
    data: financialMutationsResponses,
  });
};
