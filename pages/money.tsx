/* eslint-disable no-param-reassign */
/* eslint-disable no-underscore-dangle */
/* eslint-disable react/prop-types, no-nested-ternary */
import {
  Box,
  Checkbox,
  Container,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Tooltip,
  Typography,
} from '@mui/material';
import { Layout } from 'components/Layout';
import { InferGetStaticPropsType } from 'next';
import { mongo } from 'utils/mongo';
import { SalesInvoice, TimeEntry } from 'utils/moneybird-types';
import groupBy from 'lodash/groupBy';
import mapValues from 'lodash/mapValues';
import {
  categoriesToApply8020To,
  categoriesToSkipAsCosts,
  costOfSalesLedgerAccountIds,
  ledgerAccountsIds,
} from 'utils/get-slicing-pie';
import { serialize, unserialize } from 'utils/serialize';
import { Fragment, useState } from 'react';
import uniq from 'lodash/uniq';
import sumBy from 'lodash/sumBy';
import capitalize from 'lodash/capitalize';

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
      items: { price: number; description: string }[];
    }>([
      {
        $addFields: {
          bookYear: bookyear('$invoice_date'),
          bookPrice: {
            $toDouble: '$total_price_excl_tax',
          },
        },
      },
      {
        $group: {
          _id: {
            year: '$bookYear',
            state: '$state',
          },
          price: {
            $sum: '$bookPrice',
          },
          items: {
            $push: {
              price: '$bookPrice',
              reference: '$reference',
              companyName: '$contact.company_name',
              description: '$details.description',
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
      items: { price: number; description: string }[];
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
          // TODO: check the currency exchange rate.
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
            $push: {
              price: '$bookPrice',
              description: '$details.description',
            },
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
            $push: {
              price: '$bookPrice',
              date: '$date',
              message: '$message',
            },
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
const names: Name[] = ['bart', 'ian', 'niels'];

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
    props: serialize({ financialMutations, piePerYear, invoices, costs }),
  };
}

export default function MoneyPage(
  props: InferGetStaticPropsType<typeof getStaticProps>,
) {
  const allInvoiceStates = uniq(props.invoices.map((i) => i._id.state));

  const [invoiceStates, setInvoiceStates] = useState(allInvoiceStates);

  const yearResults = props.piePerYear.map((year) => {
    const invoices = props.invoices.filter(
      (i) => invoiceStates.includes(i._id.state) && i._id.year === year.year,
    );
    const invoicesTotal = sumBy(invoices, (i) => i.price);
    const costs = props.costs.filter((c) => c._id.year === year.year);
    const costsForAll = costs.filter(
      (c) => !names.some((name) => c._id.category.startsWith(`${name}-`)),
    );
    const costsForAllTotal = sumBy(costsForAll, (c) => c.price);

    return {
      year: year.year,
      invoices,
      invoicesTotal,
      costsForAll,
      costsForAllTotal,
      names: mapValues(year.names, (slice, name) => {
        const personalCosts = costs.filter((c) =>
          c._id.category.startsWith(`${name}-`),
        );
        const personalCostsTotal = sumBy(personalCosts, (c) => c.price);
        return {
          percentage: slice.percentage,
          result: (invoicesTotal - costsForAllTotal) * slice.percentage,
          personalCosts,
          personalCostsTotal,
        };
      }),
    };
  });

  const totals = groupByNameUnique(
    names.map((name) => {
      const result = sumBy(yearResults, (r) => r.names[name].result);
      const personalCosts = yearResults
        .map((r) => r.names[name].personalCosts)
        .flat();
      const personalCostsTotal = sumBy(
        yearResults,
        (r) => r.names[name].personalCostsTotal,
      );
      const withdrawn = props.financialMutations.filter((m) =>
        m._id.startsWith(`${name}-`),
      );
      const withdrawnTotal = -sumBy(withdrawn, (m) => m.price);
      const balance = (result - personalCostsTotal - withdrawnTotal).toFixed(2);

      return {
        name,
        result,
        personalCosts,
        personalCostsTotal,
        withdrawnTotal,
        balance,
      };
    }),
    (t) => t.name,
  );

  return (
    <Layout>
      <Container>
        <Box>
          <FormControl component="div">
            <FormLabel>Facturen</FormLabel>
            <FormGroup>
              {allInvoiceStates.map((invoiceState) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={invoiceStates.includes(invoiceState)}
                      onChange={
                        invoiceStates.includes(invoiceState)
                          ? () => {
                              setInvoiceStates(
                                invoiceStates.filter((i) => i !== invoiceState),
                              );
                            }
                          : () => {
                              setInvoiceStates([
                                ...invoiceStates,
                                invoiceState,
                              ]);
                            }
                      }
                    />
                  }
                  label={invoiceState}
                />
              ))}
            </FormGroup>
          </FormControl>
        </Box>

        {names.map((name) => {
          return (
            <Fragment key={name}>
              <Typography variant="h2">{capitalize(name)}</Typography>
              {yearResults.map((year) => {
                return (
                  <Typography key={year.year}>
                    <strong>Jaar {year.year}</strong> ({year.invoicesTotal} -{' '}
                    {year.costsForAllTotal}) *{' '}
                    {(year.names[name].percentage * 100).toFixed(2)}% ={' '}
                    {year.names[name].result.toFixed(2)}
                  </Typography>
                );
              })}
              <Typography>
                <strong>Totaal</strong> {totals[name].result.toFixed(2)}
              </Typography>
              <Typography>
                <strong>Persoonlijke kosten</strong>{' '}
                <Tooltip
                  title={
                    <>
                      {totals[name].personalCosts.map((c) =>
                        c.items.map((cc) => (
                          <Typography>
                            {cc.price.toFixed(2)} {cc.description}
                          </Typography>
                        )),
                      )}
                    </>
                  }
                >
                  <span>{totals[name].personalCostsTotal}</span>
                </Tooltip>
              </Typography>
              <Typography>
                <strong>Reeds opgenomen</strong> {totals[name].withdrawnTotal}{' '}
                (let op: klopt nog niet, hier moeten privé betaalde dingen nog
                bij opgeteld worden.)
              </Typography>
              <Typography>
                <strong>Saldo</strong> {totals[name].balance} (let op: hier moet
                nog belasting over betaald worden)
              </Typography>
            </Fragment>
          );
        })}
        <Typography variant="h2">Ruwe data</Typography>
        <pre>
          <code>{JSON.stringify(unserialize(props), null, 2)}</code>
        </pre>
      </Container>
    </Layout>
  );
}
