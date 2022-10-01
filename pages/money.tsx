/* eslint-disable no-param-reassign */
/* eslint-disable no-underscore-dangle */
/* eslint-disable react/prop-types, no-nested-ternary */
import { Container } from '@mui/material';
import { Layout } from 'components/Layout';
import { InferGetStaticPropsType } from 'next';
import { mongo } from 'utils/mongo';
import {
  PurchaseInvoice,
  SalesInvoice,
  TimeEntry,
} from 'utils/moneybird-types';
import groupBy from 'lodash/groupBy';
import mapValues from 'lodash/mapValues';
import {
  categoriesToApply8020To,
  categoriesToSkipAsCosts,
  costOfSalesLedgerAccountIds,
  ledgerAccountsIds,
} from 'utils/get-slicing-pie';

function bookyear(field: string) {
  return {
    $cond: {
      if: {
        $lt: [field, new Date('2021-01-01')],
      },
      then: 2021,
      else: {
        $year: field,
      },
    },
  };
}

function getHours() {
  return mongo
    .db()
    .collection<TimeEntry>('time_entries')
    .aggregate<{
      _id: {
        user: string;
        year: number;
      };
      totalSeconds: number;
    }>([
      // Filter out all that end with [S].
      {
        $match: {
          'project.name': {
            $regex: '.*(?<!\\[S\\])$',
          },
        },
      },
      // Calculate the duration and bookYear.
      {
        $addFields: {
          duration: {
            $subtract: [
              {
                $dateDiff: {
                  startDate: '$started_at',
                  endDate: '$ended_at',
                  unit: 'second',
                },
              },
              '$paused_duration',
            ],
          },
          bookYear: bookyear('$started_at'),
        },
      },
      // Group on name and bookyear, and return the sum of calculated duration.
      {
        $group: {
          _id: {
            user: '$user.name',
            year: '$bookYear',
          },
          totalSeconds: {
            $sum: '$duration',
          },
        },
      },
    ])
    .toArray();
}

function getPiePerYear(hours: Awaited<ReturnType<typeof getHours>>) {
  const piePerYear = Object.values(groupBy(hours, (h) => h._id.year))
    .sort((a, b) => a[0]._id.year - b[0]._id.year)
    .map((collection) => ({
      year: collection[0]._id.year,
      totalSeconds: collection.reduce(
        (total, item) => total + item.totalSeconds,
        0,
      ),
      names: groupByNameUnique(collection, (item) => item._id.user),
    }))
    .map((year) => ({
      ...year,
      names: mapValues(year.names, (nameValue) => {
        return {
          totalSeconds: nameValue.totalSeconds,
          percentageThisYear: nameValue.totalSeconds / year.totalSeconds,
          percentage: 0,
        };
      }),
    }));

  piePerYear.forEach((year, i) => {
    Object.entries(year.names).forEach(([name, value]) => {
      const prevYear = piePerYear[i - 1]?.names[name as Name];
      value.percentage = prevYear
        ? prevYear.percentage * 0.2 + value.percentageThisYear * 0.8
        : value.percentageThisYear;
    });
  });
  return piePerYear;
}

function getInvoices() {
  return mongo
    .db()
    .collection<SalesInvoice>('sales_invoices')
    .aggregate<{
      _id: { year: number; state: SalesInvoice['state'] };
      price: number;
    }>([
      {
        $addFields: {
          bookYear: bookyear('$invoice_date'),
        },
      },
      {
        $group: {
          _id: {
            year: '$bookYear',
            state: '$state',
          },
          price: {
            $sum: {
              $toDouble: '$total_price_excl_tax',
            },
          },
        },
      },
    ])
    .toArray();
}

const categories = {
  'bart-withdrawal': [ledgerAccountsIds.bart.withdrawal],
  'ian-withdrawal': [ledgerAccountsIds.ian.withdrawal],
  'niels-withdrawal': [ledgerAccountsIds.niels.withdrawal],
  'bart-costs': ledgerAccountsIds.bart.costs,
  'ian-costs': ledgerAccountsIds.ian.costs,
  'niels-costs': ledgerAccountsIds.niels.costs,
  'bart-deposit': [ledgerAccountsIds.bart.deposit],
  'ian-deposit': [ledgerAccountsIds.ian.deposit],
  'niels-deposit': [ledgerAccountsIds.niels.deposit],
  'skip-as-costs': categoriesToSkipAsCosts,
  '8020': categoriesToApply8020To,
  sales: costOfSalesLedgerAccountIds,
};

function getCosts() {
  return mongo
    .db()
    .collection('documents/purchase_invoices')
    .aggregate<{
      _id: {
        category: string;
        year: number;
      };
      price: number;
      items: string[];
    }>([
      {
        $unionWith: { coll: 'documents/receipts' },
      },
      {
        $unwind: '$details',
      },
      {
        $addFields: {
          bookYear: bookyear('$date'),
          bookPrice: {
            $toDouble: {
              $ifNull: [
                '$details.total_price_excl_tax_with_discount_base',
                '$details.price',
              ],
            },
          },
          category: {
            $switch: {
              default: 'unknown',
              branches: Object.entries(categories).map(([category, ids]) => ({
                case: { $in: ['$details.ledger_account_id', ids] },
                then: category,
              })),
            },
          },
        },
      },
      {
        $group: {
          _id: {
            category: '$category',
            year: '$bookYear',
          },
          price: {
            $sum: '$bookPrice',
          },
          items: {
            $addToSet: '$details.description',
          },
        },
      },
      {
        $sort: {
          '_id.year': 1,
          '_id.category': 1,
        },
      },
    ])
    .toArray();
}

function getFinancialMutations() {
  return mongo
    .db()
    .collection('financial_mutations')
    .aggregate<{
      _id: string; // category
      price: number;
      items: string[];
    }>([
      {
        $unwind: '$ledger_account_bookings',
      },
      {
        $addFields: {
          bookPrice: {
            $toDouble: {
              $ifNull: ['$todo', '$ledger_account_bookings.price'],
            },
          },
          category: {
            $switch: {
              default: 'unknown',
              branches: Object.entries(categories).map(([category, ids]) => ({
                case: {
                  $in: ['$ledger_account_bookings.ledger_account_id', ids],
                },
                then: category,
              })),
            },
          },
        },
      },
      {
        $group: {
          _id: '$category',
          price: {
            $sum: '$bookPrice',
          },
          items: {
            $addToSet: '$message',
          },
        },
      },
      {
        $sort: {
          '_id.category': 1,
        },
      },
    ])
    .toArray();
}

function groupByName<T>(
  collection: T[],
  getName: (item: T) => string,
): { bart: T[]; ian: T[]; niels: T[] } {
  return {
    bart: [],
    ian: [],
    niels: [],
    ...groupBy(collection, (item) => {
      const name = getName(item).toLowerCase();
      if (name.includes('bart')) return 'bart';
      if (name.includes('ian')) return 'ian';
      if (name.includes('niels')) return 'niels';
      throw Error(`Not recognizing name ${item}.`);
    }),
  };
}

type Name = keyof ReturnType<typeof groupByName>;

function groupByNameUnique<T>(
  collection: T[],
  getName: (item: T) => string,
): { bart: T; ian: T; niels: T } {
  const grouped = groupByName(collection, getName);

  Object.keys(grouped).forEach((name) => {
    if (grouped[name as Name].length !== 1) {
      throw new Error(`No entry for ${name}`);
    }
  });

  return {
    bart: grouped.bart[0],
    ian: grouped.ian[0],
    niels: grouped.niels[0],
  };
}

export async function getStaticProps() {
  const [hours, invoices, costs, financialMutations] = await Promise.all([
    getHours(),
    getInvoices(),
    getCosts(),
    getFinancialMutations(),
  ]);

  const piePerYear = getPiePerYear(hours);

  return {
    props: { financialMutations, piePerYear, invoices, costs },
  };
}

export default function MoneyPage(
  props: InferGetStaticPropsType<typeof getStaticProps>,
) {
  return (
    <Layout>
      <Container sx={{ mb: 1, flexGrow: 1 }}>
        <pre>
          <code>{JSON.stringify(props, null, 2)}</code>
        </pre>
      </Container>
    </Layout>
  );
}
