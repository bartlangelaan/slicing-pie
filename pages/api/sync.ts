/* eslint-disable no-console, no-await-in-loop */
import axios from 'axios';
import { NextApiRequest, NextApiResponse } from 'next';
import { mongo } from 'utils/mongo';
import parseLinkHeader from 'parse-link-header';
import { unserialize } from 'utils/serialize';
import { quarters } from 'utils/quarters';
import { basicAuthCheck } from '../../utils/access';

const moneybird = axios.create({
  baseURL: 'https://moneybird.com/api/v2/313185156605150255',
  headers: {
    authorization: `Bearer ${process.env.MONEYBIRD_API_KEY}`,
  },
});

const typesToSync = [
  'time_entries',
  'documents/general_journal_documents',
  'documents/purchase_invoices',
  'documents/receipts',
  'sales_invoices',
];

const typesToSyncSupported = ['financial_mutations', 'contacts'];

export default async (req: NextApiRequest, res: NextApiResponse) => {
  await basicAuthCheck(req, res);

  try {
    const syncVersion = Math.round(new Date().getTime());

    await Promise.all([
      ...typesToSync.map((type) => sync(syncVersion, type)),
      ...typesToSyncSupported.map((type) => sync(syncVersion, type, true)),
    ]);
    await Promise.all([
      ...[...typesToSync, ...typesToSyncSupported].map((type) =>
        deleteOldVersions(syncVersion, type),
      ),
      ...quarters.map((quarter) => res.revalidate(quarter.hoursUrl)),
    ]);

    res.json({
      status: 'ok',
    });
  } catch (err: any) {
    console.error(err);
    res.json({ status: 'error', error: err.message });
  } finally {
    await mongo.close();
  }
};

async function sync(syncVersion: number, type: string, syncSupported = false) {
  let next = syncSupported ? `/${type}/synchronization.json` : `/${type}.json`;
  while (next) {
    console.log(syncVersion, next);
    const res = await moneybird.get<object[]>(next);

    if (res.data.length === 0) {
      break;
    }

    const items = syncSupported
      ? (
          await moneybird.post<object[]>(`/${type}/synchronization.json`, {
            ids: res.data.map((d: any) => d.id),
          })
        ).data
      : res.data;

    await mongo.connect();
    await mongo
      .db()
      .collection(type)
      .insertMany(items.map((item) => ({ ...unserialize(item), syncVersion })));

    const link = parseLinkHeader(res.headers.link);
    if (!link?.next?.url) {
      break;
    }
    next = link.next.url;
  }
}

async function deleteOldVersions(syncVersion: number, type: string) {
  await mongo.connect();
  await mongo
    .db()
    .collection(type)
    .deleteMany({ syncVersion: { $lt: syncVersion } });
}
