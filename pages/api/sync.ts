/* eslint-disable no-console, no-await-in-loop */
import axios from 'axios';
import { NextApiRequest, NextApiResponse } from 'next';
import { mongo } from 'utils/mongo';
import parseLinkHeader from 'parse-link-header';
import { unserialize } from 'utils/serialize';
import { quarters } from 'utils/quarters';
import chunk from 'lodash/chunk';
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
      ...typesToSyncSupported.map((type) => syncSupported(syncVersion, type)),
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

async function syncSupported(syncVersion: number, type: string) {
  const listRes = await moneybird.get<object[]>(
    `/${type}/synchronization.json`,
  );

  const idChunks = chunk(
    listRes.data.map((d: any) => d.id),
    100,
  );

  const items = (
    await Promise.all(
      idChunks.map(async (ids) => {
        const res = await moneybird.post<object[]>(
          `/${type}/synchronization.json`,
          {
            ids,
          },
        );
        return res.data;
      }),
    )
  ).flat();

  await mongo.connect();
  await mongo
    .db()
    .collection(type)
    .insertMany(items.map((item) => ({ ...unserialize(item), syncVersion })));
}

async function sync(syncVersion: number, type: string) {
  let next = `/${type}.json`;
  while (next) {
    console.log(syncVersion, next);
    const res = await moneybird.get<object[]>(next);

    if (res.data.length === 0) {
      break;
    }

    await mongo.connect();
    await mongo
      .db()
      .collection(type)
      .insertMany(
        res.data.map((item) => ({ ...unserialize(item), syncVersion })),
      );

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
