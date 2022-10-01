import {
  Contact,
  FinancialMutation,
  GeneralJournalDocument,
  PurchaseInvoice,
  Receipt,
  SalesInvoice,
  TimeEntry,
} from 'utils/moneybird-types';
import { mongo } from 'utils/mongo';
import { hiddenDataMock } from './hiddenDataMock';
import {
  GetSlicingPieResponse,
  Person,
} from '../components/Dashboard/GetSlicingPieResponse';
import { years } from './years';

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
// @todo filter alles op 2021 - DONE
// @todo maximum aan zvw premie - DONE
// @todo zelf vinkje aan/uit zetten uren criterium maar ook berekenen (keuze niet/verlaagd/helemaal?) - DONE
// @todo zelfstandigenaftrek mag elk jaar - DONE
// @todo kia toevoegen - DONE
// @todo voorbereiden 2022 - DONE
// @todo skip projecten voor slicing pie obv naam ipv hardcoded - DONE
// @todo uren tabel extra regel voor totaal met slicing pie: ja - DONE
// @todo fixen null-waarde input velden - DONE
// @todo afschrijvingen: https://developer.moneybird.com/api/documents_general_journal_documents/ - DONE
// @todo 80% van bepaalde categorieën pakken
// @todo tariefsaanpassingen toptarief
// - Bij 75k omgezet, heb je 17.752 ondernemersaftrek. Je hebt dan 5.601 in schijf 2, die is dan het laagst, dus dan wordt het 9,5% van 5.601 = 532,10
// - Bij 100k omzet, heb je 21.252 ondernemersaftrek. Je hebt dan 30.601 in schijf 2. Dan is je aftrek het laagst, dus dan wordt het 9,5% van 21.252 = 2.018,94
// @todo projecten gedeeltelijk mee laten tellen ([20%] en [20])
// @todo slicing pie project ook gedeeltelijk mee laten tellen
// @todo verbeter performance met in serie geschakelde financial mutations
// @todo tooltips met "hoe berekend"
// @todo belastingschijven
// @todo arbeidskorting
// @todo Sandbox administratie
// @todo timeline? Alles teruggeven aan frontend en "rewind" en/of periode filters toevoegen

// Inkoop diensten
export const costOfSalesLedgerAccountIds = ['318138549261043069'];

export const ledgerAccountsIds = {
  bart: {
    withdrawal: '314080108962908154',
    deposit: '314080108885313527',
    costs: [
      '325419662362806156', // Uitgaven Bart Langelaan
    ],
    user: '314636212260308719',
  },
  ian: {
    withdrawal: '314079948882052598',
    deposit: '314079948801312243',
    costs: [
      '325319664846505435', // Uitgaven Ian Wensink
      '336003494959907902', // Afschrijving MBP Ian 2021
      '339448076044338586', // Afschrijving Samsung scherm Ian 2021
    ],
    user: '313176631829071688',
  },
  niels: {
    withdrawal: '314080117682865253',
    deposit: '314080117647213666',
    costs: [
      '325419671342811059', // Uitgaven Niels Otten
      '341893346471446200', // Afschrijving iPhone Niels 2021
    ],
    user: '314352839788856769',
  },
};

export const categoriesToSkipAsCosts = [
  '336003494874973243', // Aanschaf MBP Ian 2021
  '339448075967792536', // Aanschaf Samsung scherm Ian 2021
  '341893344854541993', // Aanschaf iPhone Niels 2021
  ledgerAccountsIds.bart.withdrawal,
  ledgerAccountsIds.ian.withdrawal,
  ledgerAccountsIds.niels.withdrawal,
];

export const categoriesToApply8020To = [
  '314086550406170048', // Eten en drinken met relaties
  '314086550309701054', // Relatiegeschenken
];

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

function isPersonalCost(id: string) {
  return Object.keys(ledgerAccountsIds).find((name) => {
    const personIds = ledgerAccountsIds[name as Person];

    return personIds.costs.includes(id);
  }) as Person | undefined;
}

export async function getSlicingPie(
  year: string,
): Promise<GetSlicingPieResponse> {
  if (year === 'hidden') {
    return hiddenDataMock;
  }

  const { periodFilter } = years.find((y) => y.year === year)!;

  // eslint-disable-next-line no-useless-catch
  try {
    const financialMutationsResponses = await mongo
      .db()
      .collection<FinancialMutation>('financial_mutations')
      .find({ date: periodFilter })
      .toArray();

    const generalJournalDocumentsRequest = mongo
      .db()
      .collection<GeneralJournalDocument>('general_journal_documents')
      .find({ date: periodFilter })
      .toArray();

    const purchaseInvoicesRequest = mongo
      .db()
      .collection<PurchaseInvoice>('documents/purchase_invoices')
      .find({ date: periodFilter })
      .toArray();

    const receiptsRequest = mongo
      .db()
      .collection<Receipt>('documents/receipts')
      .find({ date: periodFilter })
      .toArray();

    const timeEntriesRequest = mongo
      .db()
      .collection<TimeEntry>('time_entries')
      .find({
        started_at: periodFilter,
      })
      .toArray();

    const salesInvoicesRequest = mongo
      .db()
      .collection<SalesInvoice>('sales_invoices')
      .find({
        invoice_date: periodFilter,
        state: {
          $in: [
            'late',
            'open',
            'scheduled',
            'pending_payment',
            'reminded',
            'paid',
          ],
        },
      })
      .toArray();

    const [
      generalJournalDocumentsResponse,
      purchaseInvoicesResponse,
      receiptsResponse,
      timeEntriesResponse,
      salesInvoicesResponse,
    ] = await Promise.all([
      generalJournalDocumentsRequest,
      purchaseInvoicesRequest,
      receiptsRequest,
      timeEntriesRequest,
      salesInvoicesRequest,
    ]);

    const ids = Array.from(
      new Set(salesInvoicesResponse.map((item) => item.contact.id)),
    );
    const contactsResponse = await mongo
      .db()
      .collection<Contact>('contacts')
      .find({
        id: {
          $in: ids,
        },
      })
      .toArray();

    const totalProfitPlus = salesInvoicesResponse.reduce((total, item) => {
      if (item.state !== 'paid') return total;

      const price = parseFloat(item.total_price_excl_tax);

      return total + price;
    }, 0);

    const totalProfitMin = [
      ...purchaseInvoicesResponse,
      ...receiptsResponse,
    ].reduce((total, item) => {
      return item.details.reduce((subTotal, detail) => {
        const person = findPerson(detail.ledger_account_id);

        if (
          // This purchase is considered a personal cost.
          person ||
          // If an item's ledger account id should be skipped.
          // This is the case for categories on the accounting balance (e.g. investments).
          categoriesToSkipAsCosts.includes(detail.ledger_account_id) ||
          costOfSalesLedgerAccountIds.includes(detail.ledger_account_id)
        )
          return subTotal;

        let price = parseFloat(
          detail.total_price_excl_tax_with_discount_base || detail.price,
        );

        if (categoriesToApply8020To.includes(detail.ledger_account_id)) {
          price *= 0.8;
        }

        return subTotal + price;
      }, total);
    }, 0);

    const totalProfitOpenPlus = salesInvoicesResponse.reduce((total, item) => {
      if (item.state === 'paid') return total;

      const price = parseFloat(item.total_price_excl_tax);

      return total + price;
    }, 0);

    const totalProfitOpenMin = purchaseInvoicesResponse.reduce(
      (total, item) => {
        if (item.state === 'paid') return total;

        const belongsToPeronalCosts = item.details.some(
          (detail) => !!findPerson(detail.ledger_account_id),
        );

        // If this item is booked as a personal cost, skip it for the openMin calculation since it is already calculated as a personal cost.
        if (belongsToPeronalCosts) return total;

        let price = parseFloat(item.total_price_excl_tax);

        if (item.currency === 'USD') {
          price *= parseFloat(item.exchange_rate || '1');
        }

        return total + price;
      },
      0,
    );

    const costOfSales = purchaseInvoicesResponse.reduce((total, item) => {
      return item.details.reduce((subTotal, detail) => {
        const isCostOfSales = costOfSalesLedgerAccountIds.includes(
          detail.ledger_account_id,
        );

        if (!isCostOfSales) return subTotal;

        let price = parseFloat(
          detail.total_price_excl_tax_with_discount || detail.price,
        );

        if (item.currency === 'USD') {
          price *= parseFloat(item.exchange_rate || '1');
        }

        return subTotal + price;
      }, total);
    }, 0);

    const totalProfit = {
      plus: totalProfitPlus,
      min: totalProfitMin,
      openPlus: totalProfitOpenPlus,
      openMin: totalProfitOpenMin,
      personalPlus: 0,
      personalMin: 0,
      costOfSales,
    };

    const personalGeneralJournalDocuments =
      generalJournalDocumentsResponse.reduce((total, item) => {
        return item.general_journal_document_entries.reduce(
          (subTotal, entry) => {
            const person = findPerson(entry.ledger_account_id);

            if (
              !person ||
              // If an item's ledger account id should be skipped.
              // This is the case for categories on the accounting balance (e.g. investments).
              categoriesToSkipAsCosts.includes(entry.ledger_account_id) ||
              costOfSalesLedgerAccountIds.includes(entry.ledger_account_id)
            )
              return subTotal;

            const price = parseFloat(entry.debit);

            return {
              ...subTotal,
              [person]: {
                plus: subTotal[person].plus + price,
                min: 0,
              },
            };
          },
          total,
        );
      }, getInitialObject());

    const personalFinancialMutations = financialMutationsResponses.reduce(
      (total, item) => {
        return item.ledger_account_bookings.reduce((subTotal, booking) => {
          const person = findPerson(booking.ledger_account_id);

          if (!person) return subTotal;

          let price = parseFloat(booking.price);

          if (item.currency === 'USD') {
            price *= parseFloat(item.exchange_rate || '1');
          }

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

    const personalFinancialMutationsIncludingGeneralJournalDocuments =
      generalJournalDocumentsResponse.reduce((total, item) => {
        return item.general_journal_document_entries.reduce(
          (subTotal, entry) => {
            const person = findPerson(entry.ledger_account_id);

            if (!person) return subTotal;

            if (
              entry.ledger_account_id !==
                ledgerAccountsIds[person].withdrawal &&
              entry.ledger_account_id !== ledgerAccountsIds[person].deposit
            )
              return subTotal;

            const price = parseFloat(entry.debit);

            return {
              ...subTotal,
              [person]: {
                plus: subTotal[person].plus + (price < 0 ? price : 0),
                min: subTotal[person].min + (price > 0 ? price : 0),
              },
            };
          },
          total,
        );
      }, personalFinancialMutations);

    const personalFinancialMutationsIncludingGeneralJournalDocumentsDepositPaymentsWithdrawalPayments =
      purchaseInvoicesResponse.reduce(
        (total, item) =>
          item.payments.reduce((subTotal, payment) => {
            const person = findPerson(payment.ledger_account_id);

            if (!person) return subTotal;

            if (
              payment.ledger_account_id !==
                ledgerAccountsIds[person].withdrawal &&
              payment.ledger_account_id !== ledgerAccountsIds[person].deposit
            )
              return subTotal;

            const price = parseFloat(payment.price_base || payment.price);

            return {
              ...subTotal,
              [person]: {
                plus: subTotal[person].plus + (price > 0 ? price : 0),
                min: subTotal[person].min - (price < 0 ? price : 0),
              },
            };
          }, total),
        personalFinancialMutationsIncludingGeneralJournalDocuments,
      );

    const personalFinancialMutationsIncludingGeneralJournalDocumentsDepositPaymentsWithdrawalPaymentsDepositLedgersWithdrawalLedgers =
      purchaseInvoicesResponse.reduce(
        (total, item) =>
          item.details.reduce((subTotal, detail) => {
            const person = findPerson(detail.ledger_account_id);

            if (!person) return subTotal;

            if (
              detail.ledger_account_id !==
                ledgerAccountsIds[person].withdrawal &&
              detail.ledger_account_id !== ledgerAccountsIds[person].deposit
            )
              return subTotal;

            const price = parseFloat(
              detail.total_price_excl_tax_with_discount || detail.price,
            );

            return {
              ...subTotal,
              [person]: {
                plus: subTotal[person].plus + (price < 0 ? price : 0),
                min: subTotal[person].min + (price > 0 ? price : 0),
              },
            };
          }, total),
        personalFinancialMutationsIncludingGeneralJournalDocumentsDepositPaymentsWithdrawalPayments,
      );

    const personalPurchaseInvoices = purchaseInvoicesResponse.reduce(
      (total, item) => {
        return item.payments.reduce((subTotal, booking) => {
          const person = findPerson(booking.ledger_account_id);

          if (!person) return subTotal;

          let price = parseFloat(booking.price_base || booking.price);

          if (item.currency === 'USD') {
            price *= parseFloat(item.exchange_rate || '1');
          }

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

        let price = parseFloat(booking.price);

        if (item.currency === 'USD') {
          price *= parseFloat(item.exchange_rate || '1');
        }

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
        const person = isPersonalCost(detail.ledger_account_id);

        if (!person) return subTotal;

        let price = parseFloat(
          detail.total_price_excl_tax_with_discount || detail.price,
        );

        if (item.currency === 'USD') {
          price *= parseFloat(item.exchange_rate || '1');
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
        timeSpent: {
          [key in Person]: { billable: number; nonBillable: number };
        };
      };
    };

    const timeSpent = timeEntriesResponse.reduce(
      (total, item) => {
        const person = findPerson(item.user.id);

        if (!person) return total;

        const shouldSkip = item.project?.name.endsWith('[S]');

        const startDate = new Date(item.started_at);
        const endDate = new Date(item.ended_at);

        const duration =
          (endDate.getTime() - startDate.getTime()) / 1000 -
          item.paused_duration;

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

    const revenuePerAccount = contactsResponse
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

    return {
      status: 200,
      year,
      totalProfit,
      personalGeneralJournalDocuments,
      personalCosts,
      personalFinancialMutations:
        personalFinancialMutationsIncludingGeneralJournalDocumentsDepositPaymentsWithdrawalPaymentsDepositLedgersWithdrawalLedgers,
      personalPurchaseInvoices,
      personalReceipts,
      timeSpent,
      totalTimeSpent,
      totalTimeSpentFiltered,
      revenuePerAccount,
      timeSpentPerProject: Object.values(timeSpentPerProject),
    };
  } catch (error: any) {
    throw error;
  }
}
