import { NextApiRequest, NextApiResponse } from 'next';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { setup, RedisStore } from 'axios-cache-adapter';
import redis from 'redis';
import { basicAuthCheck } from '../../utils/access';
import { hiddenDataMock } from '../../utils/hiddenDataMock';
import { Person } from '../../components/Dashboard/GetSlicingPieResponse';

axios.defaults.baseURL = 'https://moneybird.com/api/v2/313185156605150255';
axios.defaults.headers = {
  authorization: `Bearer ${process.env.MONEYBIRD_API_KEY}`,
};

// @todo openstaande facturen meenemen als losse regel (+ als winst?) - DONE
// @todo totalen bij omzet per klant tabel - DONE
// @todo urencriterium computed maken op basis van uren per week - DONE
// @todo urencriterium vinkje aanpassen naar "aftrek toepassen" vinkje - DONE
// @todo invoerveld voor kosten om client side uit te kunnen rekenen wat netto winst is - DONE
// @todo beveiliging api endpoints - DONE
// @todo "aftrek toepassen" vinkje ook gebruiken in Winst per vennoot bar chart - DONE
// @todo Algemene layout - DONE
// @todo cache localStorage met refresh - DONE
// @todo "hidden" mode - DONE
// @todo meer velden om te simuleren (uren, omzet/winst) - DONE
// @todo Onttrekkingen van belasting ook zelf betalen. Hoe onderscheid - DONE
// @todo Uren inzicht. Intern vs billable - Hoe? Wat willen we weten? - DONE v1
// @todo MBP niet als kosten? - DONE
// @todo afschrijving categorie toevoegen als personal cost - DONE
// @todo bijtelling verwerken - DONE
// @todo Sandbox administratie
// @todo filter alles op 2021
// @todo voorbereiden 2022
// @todo fixen null-waarde input velden
// @todo maximum aan zvw premie
// @todo belastingschijven
// @todo zelf vinkje aan/uit zetten uren criterium maar ook berekenen (keuze niet/verlaagd/helemaal?)
// @todo zelfstandigenaftrek mag elk jaar
// @todo arbeidsongeschiktheid is 800 uur voor startersaftrek, maar nog steeds 1225 uur voor zelfstandigenaftrek.
// @todo kia toevoegen
// @todo uren tabel extra regel voor totaal met slicing pie: ja
// @todo verbeter performance met in serie geschakelde financial mutations
// @todo timeline? Alles teruggeven aan frontend en "rewind" toevoegen

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

const categoriesToSkipAsCosts = ['336003494874973243'];

const ledgerAccountsIds = {
  bart: {
    withdrawal: '314080108962908154',
    deposit: '314080108885313527',
    costs: ['325419662362806156'],
    user: '314636212260308719',
    skipProjects: [''],
  },
  ian: {
    withdrawal: '314079948882052598',
    deposit: '314079948801312243',
    costs: ['325319664846505435', '336003494959907902'],
    user: '313176631829071688',
    skipProjects: ['325298306787837389', '335438415799519191'],
  },
  niels: {
    withdrawal: '314080117682865253',
    deposit: '314080117647213666',
    costs: ['325419671342811059'],
    user: '314352839788856769',
    skipProjects: [''],
  },
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
      id === personIds.user ||
      personIds.costs.includes(id)
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

export default async (req: NextApiRequest, res: NextApiResponse) => {
  await basicAuthCheck(req, res);

  const hiddenModeEnabled = !!req.query.hidden;

  if (hiddenModeEnabled) {
    res.json(hiddenDataMock);
    return;
  }

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
      state: 'open' | 'new' | 'paid';
      total_price_excl_tax: string;
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
      total_price_excl_tax: string;
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
      project?: { id: string; name: string };
    }[]
  >('/time_entries.json?filter=period:202011..202112');

  const salesInvoicesRequest = requestAll<
    {
      state:
        | 'pending_payment'
        | 'paid'
        | 'open'
        | 'late'
        | 'scheduled'
        | 'reminded';
      total_price_excl_tax: string;
      contact: {
        id: string;
        company_name: string;
        custom_fields: { id: string; name: string; value: string }[];
      };
    }[]
  >(
    '/sales_invoices.json?filter=state:late|open|scheduled|pending_payment|reminded|paid',
  );

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

  const totalProfitPlus = salesInvoicesResponse.reduce((total, item) => {
    if (item.state !== 'paid') return total;

    const price = parseFloat(item.total_price_excl_tax);

    return total + price;
  }, 0);

  const totalProfitMin = [
    ...purchaseInvoicesResponse,
    ...receiptsResponse,
  ].reduce((total, item) => {
    // If an item's ledger account id should be skipped.
    // This is the case for categories on the accounting balance (e.g. investments).
    if (
      item.details.some((detail) =>
        categoriesToSkipAsCosts.includes(detail.ledger_account_id),
      )
    ) {
      return total;
    }

    const price = parseFloat(item.total_price_excl_tax);

    return total + price;
  }, 0);

  const totalProfitOpenPlus = salesInvoicesResponse.reduce((total, item) => {
    if (item.state === 'paid') return total;

    const price = parseFloat(item.total_price_excl_tax);

    return total + price;
  }, 0);

  const totalProfitOpenMin = purchaseInvoicesResponse.reduce((total, item) => {
    if (item.state === 'paid') return total;

    const belongsToPeronalCosts = item.details.some(
      (detail) => !!findPerson(detail.ledger_account_id),
    );

    // If this item is booked as a personal cost, skip it for the openMin calculation since it is already calculated as a personal cost.
    if (belongsToPeronalCosts) return total;

    const price = parseFloat(item.total_price_excl_tax);

    return total + price;
  }, 0);

  const totalProfit = {
    plus: totalProfitPlus,
    min: totalProfitMin,
    openPlus: totalProfitOpenPlus,
    openMin: totalProfitOpenMin,
    personalPlus: 0,
    personalMin: 0,
  };

  const personalFinancialMutations = financialMutationsResponses.reduce(
    (total, item) => {
      return item.ledger_account_bookings.reduce((subTotal, booking) => {
        const person = findPerson(booking.ledger_account_id);

        if (!person) return subTotal;

        const price = parseFloat(booking.price);

        if (price > 0) totalProfit.personalPlus += price;
        else totalProfit.personalMin -= price;

        return {
          ...subTotal,
          [person]: {
            plus: subTotal[person].plus + (price > 0 ? price : 0),
            min: subTotal[person].min - (price < 0 ? price : 0),
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
            min: subTotal[person].min - (price < 0 ? price : 0),
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
          min: subTotal[person].min - (price < 0 ? price : 0),
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
  let totalTimeSpentFiltered = 0;

  const timeSpentPerProject = {} as {
    [key: string]: {
      id: string;
      name: string;
      skipped: boolean;
      timeSpent: { [key in Person]: { billable: number; nonBillable: number } };
    };
  };

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
      if (!shouldSkip) {
        totalTimeSpentFiltered += timeEntrySpent;
      }

      if (item.project) {
        if (!timeSpentPerProject[item.project.id]) {
          timeSpentPerProject[item.project.id] = {
            id: item.project.id,
            name: item.project.name,
            skipped: !!shouldSkip,
            timeSpent: {
              bart: {
                billable: 0,
                nonBillable: 0,
              },
              ian: {
                billable: 0,
                nonBillable: 0,
              },
              niels: {
                billable: 0,
                nonBillable: 0,
              },
            },
          };
        }

        timeSpentPerProject[item.project.id] = {
          ...timeSpentPerProject[item.project.id],
          timeSpent: {
            ...timeSpentPerProject[item.project.id]?.timeSpent,
            [person]: {
              billable:
                (timeSpentPerProject[item.project.id]?.timeSpent[person]
                  ?.billable || 0) + (item.billable ? timeEntrySpent : 0),
              nonBillable:
                (timeSpentPerProject[item.project.id]?.timeSpent[person]
                  ?.nonBillable || 0) + (item.billable ? 0 : timeEntrySpent),
            },
          },
        };
      }

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
    totalTimeSpentFiltered,
    revenuePerAccount,
    timeSpentPerProject: Object.values(timeSpentPerProject),
  });
};
