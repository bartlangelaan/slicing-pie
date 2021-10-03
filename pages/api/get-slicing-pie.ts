import { NextApiRequest, NextApiResponse } from 'next';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { setup, RedisStore } from 'axios-cache-adapter';
import redis from 'redis';

axios.defaults.baseURL = 'https://moneybird.com/api/v2/313185156605150255';
axios.defaults.headers = {
  authorization: `Bearer ${process.env.MONEYBIRD_API_KEY}`,
};

const client = redis.createClient({
  url: process.env.REDIS,
});
const store = new RedisStore(client);
// client.set('bla', 'joe');
export const api = setup({
  // `axios` options
  baseURL: axios.defaults.baseURL,
  // `axios-cache-adapter` options
  cache: {
    maxAge: 365 * 24 * 60 * 60 * 1000,
    store, // Pass `RedisStore` store to `axios-cache-adapter`
    exclude: {
      // Only exclude PUT, PATCH and DELETE methods from cache
      methods: ['put', 'patch', 'delete'],
    },
  },
});

const ledgerAccountsIds = {
  bart: {
    withdrawal: '314080108962908154',
    deposit: '314080108885313527',
    costs: '325419662362806156',
    user: '314636212260308719',
    skipProjects: [''],
  },
  ian: {
    withdrawal: '314079948882052598',
    deposit: '314079948801312243',
    costs: '325319664846505435',
    user: '313176631829071688',
    skipProjects: ['325298306787837389'],
  },
  niels: {
    withdrawal: '314080117682865253',
    deposit: '314080117647213666',
    costs: '325419671342811059',
    user: '314352839788856769',
    skipProjects: [''],
  },
};

export type Person = keyof typeof ledgerAccountsIds;

function getInitialObject() {
  return {
    bart: { plus: 0, min: 0 },
    ian: { plus: 0, min: 0 },
    niels: { plus: 0, min: 0 },
  } as { [key in Person]: { plus: number; min: number } };
}

function findPerson(id: string) {
  return Object.keys(ledgerAccountsIds).find((name) => {
    const personIds = ledgerAccountsIds[name as Person];

    return (
      id === personIds.withdrawal ||
      id === personIds.deposit ||
      id === personIds.costs ||
      id === personIds.user
    );
  }) as Person | undefined;
}

async function request<T>(
  url: string,
  page: number,
  result: AxiosResponse<T>[],
  requestConfig?: AxiosRequestConfig,
) {
  const token = url.includes('?') ? '&' : '?';

  const res = await api.get<T>(`${url}${token}page=${page}`, requestConfig);

  result.push(res);

  if (res.headers.link?.includes('next')) {
    await request<T>(url, page + 1, result);
  }

  return result;
}

export async function requestAll<T>(
  url: string,
  requestConfig?: AxiosRequestConfig,
) {
  const result = [] as AxiosResponse<T>[];

  const res = await request<T>(url, 1, result, requestConfig);

  return res.map((req) => req.data).flat();
}

export default async (_req: NextApiRequest, res: NextApiResponse) => {
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

  const purchaseInvoicesRequest = requestAll<
    {
      details: {
        ledger_account_id: string;
        price: string;
        total_price_excl_tax_with_discount_base?: string;
      }[];
      payments: {
        ledger_account_id: string;
        price: string;
        price_base?: string;
      }[];
    }[]
  >('/documents/purchase_invoices.json');

  const receiptsRequest = requestAll<
    {
      details: { ledger_account_id: string; price: string }[];
      payments: { ledger_account_id: string; price: string }[];
    }[]
  >('/documents/receipts.json');

  const timeEntriesRequest = requestAll<
    {
      started_at: string;
      ended_at: string;
      paused_duration: number;
      billable: boolean;
      user: { id: string };
      project?: { id: string };
    }[]
  >('/time_entries.json?filter=period:202011..202112');

  const salesInvoicesRequest = requestAll<
    {
      state: string;
      total_price_excl_tax: string;
      contact: {
        id: string;
        company_name: string;
        custom_fields: { id: string; name: string; value: string }[];
      };
    }[]
  >('/sales_invoices.json?filter=state:pending_payment|paid|open');

  const [
    purchaseInvoicesResponse,
    receiptsResponse,
    timeEntriesResponse,
    salesInvoicesResponse,
  ] = await Promise.all([
    purchaseInvoicesRequest,
    receiptsRequest,
    timeEntriesRequest,
    salesInvoicesRequest,
  ]);

  const contactsResponse = await axios.post<
    {
      id: string;
      company_name: string;
      custom_fields: { id: string; name: string; value: string }[];
    }[]
  >('/contacts/synchronization.json', {
    ids: Array.from(
      new Set(salesInvoicesResponse.map((item) => item.contact.id)),
    ),
  });

  const totalProfit = financialMutationsResponses.reduce(
    (total, item) => {
      const price = parseFloat(item.amount);

      return {
        plus: price > 0 ? total.plus + price : total.plus,
        min: price < 0 ? total.min - price : total.min,
      };
    },
    { plus: 0, min: 0 },
  );

  const personalFinancialMutations = financialMutationsResponses.reduce(
    (total, item) => {
      return item.ledger_account_bookings.reduce((subTotal, booking) => {
        const person = findPerson(booking.ledger_account_id);

        if (!person) return subTotal;

        const price = parseFloat(booking.price);

        if (price > 0) totalProfit.plus += price;
        else totalProfit.min += price;

        return {
          ...subTotal,
          [person]: {
            plus: subTotal[person].plus + (price > 0 ? price : 0),
            min: subTotal[person].min + (price < 0 ? price : 0),
          },
        };
      }, total);
    },
    getInitialObject(),
  );

  const personalPurchaseInvoices = purchaseInvoicesResponse.reduce(
    (total, item) => {
      return item.payments.reduce((subTotal, booking) => {
        const person = findPerson(booking.ledger_account_id);

        if (!person) return subTotal;

        const price = parseFloat(booking.price_base || booking.price);

        return {
          ...subTotal,
          [person]: {
            plus: subTotal[person].plus + (price > 0 ? price : 0),
            min: subTotal[person].min + (price < 0 ? price : 0),
          },
        };
      }, total);
    },
    getInitialObject(),
  );

  const personalReceipts = receiptsResponse.reduce((total, item) => {
    return item.payments.reduce((subTotal, booking) => {
      const person = findPerson(booking.ledger_account_id);

      if (!person) return subTotal;

      const price = parseFloat(booking.price);

      return {
        ...subTotal,
        [person]: {
          plus: subTotal[person].plus + (price > 0 ? price : 0),
          min: subTotal[person].min + (price < 0 ? price : 0),
        },
      };
    }, total);
  }, getInitialObject());

  const personalCosts = purchaseInvoicesResponse.reduce((total, item) => {
    return item.details.reduce((subTotal, detail) => {
      const person = findPerson(detail.ledger_account_id);

      if (!person) return subTotal;

      let price = parseFloat(
        detail.total_price_excl_tax_with_discount_base || detail.price,
      );

      if (item.details.length === 1 && item.payments.length === 1) {
        price = parseFloat(
          item.payments[0].price_base || item.payments[0].price,
        );
      }

      return {
        ...subTotal,
        [person]: {
          plus: subTotal[person].plus + (price > 0 ? price : 0),
          min: subTotal[person].min + (price < 0 ? price : 0),
        },
      };
    }, total);
  }, getInitialObject());

  let totalTimeSpent = 0;

  const timeSpent = timeEntriesResponse.reduce(
    (total, item) => {
      const person = findPerson(item.user.id);

      if (!person) return total;

      const shouldSkip =
        item.project &&
        ledgerAccountsIds[person].skipProjects.includes(item.project.id);

      const startDate = new Date(item.started_at);
      const endDate = new Date(item.ended_at);

      const duration =
        (endDate.getTime() - startDate.getTime()) / 1000 - item.paused_duration;

      const timeEntrySpent = duration / 3600;

      totalTimeSpent += timeEntrySpent;

      return {
        ...total,
        [person]: {
          year: total[person].year + timeEntrySpent,
          yearFiltered:
            total[person].yearFiltered + (shouldSkip ? 0 : timeEntrySpent),
          fromJuly:
            total[person].fromJuly +
            (startDate.getTime() > new Date('2021-07-01').getTime()
              ? timeEntrySpent
              : 0),
          fromJulyFiltered:
            total[person].fromJulyFiltered +
            (!shouldSkip &&
            startDate.getTime() > new Date('2021-07-01').getTime()
              ? timeEntrySpent
              : 0),
        },
      };
    },
    {
      bart: { year: 0, fromJuly: 0, yearFiltered: 0, fromJulyFiltered: 0 },
      ian: { year: 0, fromJuly: 0, yearFiltered: 0, fromJulyFiltered: 0 },
      niels: { year: 0, fromJuly: 0, yearFiltered: 0, fromJulyFiltered: 0 },
    } as {
      [key in Person]: {
        year: number;
        fromJuly: number;
        yearFiltered: number;
        fromJulyFiltered: number;
      };
    },
  );

  const revenuePerAccount = contactsResponse.data
    .map((item) => {
      const goodwillValuePerson = (item.custom_fields
        .find((field) => field.id === '325602584896210834')
        ?.value.toLowerCase() || null) as Person | null;

      const goodwillValue = parseFloat(
        item.custom_fields.find((field) => field.id === '325602513599334133')
          ?.value || '0',
      );

      const salesInvoices = salesInvoicesResponse.filter(
        (invoice) => invoice.contact.id === item.id,
      );

      const revenue = salesInvoices.reduce(
        (t, invoice) => t + parseFloat(invoice.total_price_excl_tax),
        0,
      );

      return {
        revenue,
        goodwillValuePerson,
        goodwillValue,
        id: item.id,
        company: item.company_name,
      };
    })
    .sort((a, b) => {
      if (a.revenue > b.revenue) return -1;

      if (a.revenue < b.revenue) return 1;

      return 0;
    });

  res.json({
    totalProfit,
    personalCosts,
    personalFinancialMutations,
    personalPurchaseInvoices,
    personalReceipts,
    timeSpent,
    totalTimeSpent,
    revenuePerAccount,
  });
};
