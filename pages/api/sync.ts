/* eslint-disable no-restricted-syntax */
/* eslint-disable no-console, no-await-in-loop */
import axios from 'axios';
import { NextApiRequest, NextApiResponse } from 'next';
import { mongo } from 'utils/mongo';
import parseLinkHeader from 'parse-link-header';
import { unserialize } from 'utils/serialize';
import { quarters } from 'utils/quarters';
import chunk from 'lodash/chunk';
import { years } from 'utils/years';

const moneybird = axios.create({
  baseURL: 'https://moneybird.com/api/v2/313185156605150255',
  headers: {
    authorization: `Bearer ${process.env.MONEYBIRD_API_KEY}`,
  },
});

const typesToSync = ['time_entries'];

const typesToSyncSupported = [
  'financial_mutations',
  'contacts',
  'documents/general_journal_documents',
  'documents/purchase_invoices',
  'documents/receipts',
  'sales_invoices',
];

const periodAddition = '?filter=period%3A202001..202512';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  async function getRes() {
    return {
      tasks: await tasksCollection().find({}).sort({ _id: -1 }).toArray(),
    };
  }

  async function runTask({ syncVersion, action }: Task) {
    if (action.action === 'syncSupported') {
      const listRes = await moneybird.get<{ id: number }[]>(
        `/${action.type}/synchronization.json${periodAddition}`,
      );

      const idChunks = chunk(
        listRes.data.map((d) => d.id),
        100,
      );
      if (idChunks.length)
        await tasksCollection().insertMany(
          idChunks.map((ids) => ({
            syncVersion,
            state: 'pending',
            action: { action: 'syncSupportedChunk', type: action.type, ids },
          })),
        );
    } else if (action.action === 'syncSupportedChunk') {
      const mbRes = await moneybird.post<{ id: number }[]>(
        `/${action.type}/synchronization.json`,
        {
          ids: action.ids,
        },
      );
      if (mbRes.data.length) {
        await mongo
          .db()
          .collection(action.type)
          .insertMany(
            mbRes.data.map((item) => ({ ...unserialize(item), syncVersion })),
          );
      }
    } else if (action.action === 'sync') {
      const mbRes = await moneybird.get<object[]>(
        action.url ?? `/${action.type}.json${periodAddition}`,
      );

      if (mbRes.data.length)
        await mongo
          .db()
          .collection(action.type)
          .insertMany(
            mbRes.data.map((item) => ({ ...unserialize(item), syncVersion })),
          );

      const link = parseLinkHeader(mbRes.headers.link);
      if (link?.next?.url) {
        await tasksCollection().insertOne({
          syncVersion,
          state: 'pending',
          action: { action: 'sync', type: action.type, url: link.next.url },
        });
      }
    } else if (action.action === 'deleteOldVersions') {
      await mongo
        .db()
        .collection(action.type)
        .deleteMany({ syncVersion: { $lt: syncVersion } });
    } else if (action.action === 'revalidate') {
      await res.revalidate(action.url);
    }
  }

  try {
    await mongo.connect();

    if (req.query.restart) {
      await tasksCollection().deleteMany({});
      console.log('Restarted.');
    }

    const task = await claimTask();
    console.log({ task });

    if (task) {
      await runTask(task);
      await tasksCollection().updateOne(
        // eslint-disable-next-line no-underscore-dangle
        { _id: task._id },
        { $set: { state: 'done' } },
      );
      return res.json(await getRes());
    }

    const runningTask = await getLastTask('running');
    console.log({ runningTask });
    if (runningTask) {
      return res.json(await getRes());
    }

    const doneTask = await getLastTask('done');
    console.log({ doneTask });

    if (!doneTask) {
      // Create new (first) tasks
      const syncVersion = Math.round(new Date().getTime());
      console.log('Creating tasks 1', syncVersion);

      await tasksCollection().insertMany([
        ...typesToSync.map((type) => ({
          syncVersion,
          state: 'pending' as const,
          action: { action: 'sync' as const, type },
        })),
        ...typesToSyncSupported.map((type) => ({
          syncVersion,
          state: 'pending' as const,
          action: {
            action: 'syncSupported' as const,
            type,
          },
        })),
      ]);
      return res.json(await getRes());
    }

    const { syncVersion, action } = doneTask;

    if (
      action.action === 'sync' ||
      action.action === 'syncSupportedChunk' ||
      action.action === 'syncSupported'
    ) {
      console.log('Creating tasks 2', syncVersion);
      await tasksCollection().insertMany(
        [...typesToSync, ...typesToSyncSupported].map((type) => ({
          syncVersion: doneTask.syncVersion,
          state: 'pending',
          action: { action: 'deleteOldVersions', type },
        })),
      );
      return res.json(await getRes());
    }

    if (doneTask.action.action === 'deleteOldVersions') {
      console.log('Creating tasks 3', syncVersion);
      await tasksCollection().insertMany(
        [
          ...quarters.map((quarter) => quarter.hoursUrl),
          ...years.map((year) => year.pieUrl),
        ].map((url) => ({
          syncVersion: doneTask.syncVersion,
          state: 'pending',
          action: { action: 'revalidate', url },
        })),
      );
      return res.json(await getRes());
    }

    console.log('All done! Deleting all tasks.');
    await tasksCollection().deleteMany({ syncVersion: doneTask.syncVersion });

    return res.json(await getRes());
  } catch (err: any) {
    console.error(err);
    return res.json({ status: 'error', error: err.message });
  }
};

function tasksCollection() {
  return mongo.db().collection<Task>('sync_tasks');
}

async function claimTask() {
  const claim = await tasksCollection().findOneAndUpdate(
    { state: 'pending' },
    { $set: { state: 'running' } },
  );
  return claim.value;
}

async function getLastTask(state: Task['state']) {
  const [task] = await tasksCollection()
    .find({ state })
    .sort({ _id: -1 })
    .limit(1)
    .toArray();
  return task;
}

interface Task {
  syncVersion: number;
  state: 'pending' | 'running' | 'done';
  action:
    | { action: 'syncSupported'; type: string }
    | { action: 'syncSupportedChunk'; type: string; ids: number[] }
    | { action: 'sync'; type: string; url?: string }
    | { action: 'deleteOldVersions'; type: string }
    | { action: 'revalidate'; url: string };
}
