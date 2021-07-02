import { NextApiRequest, NextApiResponse } from 'next';
import axios, { AxiosResponse } from 'axios';

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

axios.defaults.baseURL = 'https://moneybird.com/api/v2/313185156605150255';
axios.defaults.headers = {
  authorization: `Bearer ${process.env.MONEYBIRD_API_KEY}`,
};

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
) {
  const token = url.includes('?') ? '&' : '?';

  const res = await axios.get<T>(`${url}${token}page=${page}`);

  result.push(res);

  if (res.headers.link?.includes('next')) {
    await request<T>(url, page + 1, result);
  }

  return result;
}

export async function requestAll<T>(url: string) {
  const result = [] as AxiosResponse<T>[];

  const res = await request<T>(url, 1, result);

  return res.map((req) => req.data).flat();
}

export default async (_req: NextApiRequest, res: NextApiResponse) => {
  const financialMutationsRequest = requestAll<
    {
      amount: string;
      ledger_account_bookings: { ledger_account_id: string; price: string }[];
    }[]
  >('/financial_mutations.json');

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
      project: { id: string };
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
    financialMutationsResponse,
    purchaseInvoicesResponse,
    receiptsResponse,
    timeEntriesResponse,
    salesInvoicesResponse,
  ] = await Promise.all([
    financialMutationsRequest,
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

  const totalProfit = financialMutationsResponse.reduce(
    (total, item) => {
      const price = parseFloat(item.amount);

      return {
        plus: price > 0 ? total.plus + price : total.plus,
        min: price < 0 ? total.min - price : total.min,
      };
    },
    { plus: 0, min: 0 },
  );

  const personalFinancialMutations = financialMutationsResponse.reduce(
    (total, item) => {
      return item.ledger_account_bookings.reduce((subTotal, booking) => {
        const person = findPerson(booking.ledger_account_id);

        if (!person) return subTotal;

        const price = parseFloat(booking.price);

        totalProfit.min += -price;

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
        // purchase invoices  53,3+75,48+41+19,25+51,55+4,09+55,1+20,1+38,15+127,84+51,3+20+59,29+20 = 636,45
        // receipts = 41,6+11,05+169,83+17,2 = 239,68
        // withdrawals = 481,8+11,05+41,6+169,83+200 = 904,28 - 39,23 = 865,05

        // moneybird stortingen 41+19,25+51,55+20,10+55,10+4,09+38,15+127,87+75,48+53,30+11,05+41,6+169,83+39,23+51,30+17,2+16,56+59,29+16,42 = 908,37
        // 636,4799999999999+239,68+39,23 = 919,48
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

      const shouldSkip = ledgerAccountsIds[person].skipProjects.includes(
        item.project.id,
      );

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

  const profitPerAccount = contactsResponse.data.reduce((total, item) => {
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

    const profit = salesInvoices.reduce(
      (t, invoice) => t + parseFloat(invoice.total_price_excl_tax),
      0,
    );

    return {
      ...total,
      [item.id]: {
        profit,
        goodwillValuePerson,
        goodwillValue,
        company: item.company_name,
      },
    };
  }, {} as { [key: string]: { company: string; profit: number; goodwillValuePerson: Person | null; goodwillValue: number } });

  res.json({
    totalProfit,
    personalCosts,
    personalFinancialMutations,
    personalPurchaseInvoices,
    personalReceipts,
    timeSpent,
    totalTimeSpent,
    profitPerAccount,
  });
};
