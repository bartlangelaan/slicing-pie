import { Person } from '../../pages/api/get-slicing-pie';

const currencyFormatter = Intl.NumberFormat('nl', {
  style: 'currency',
  currency: 'EUR',
});

export interface Props {
  timeSpent: {
    [key in Person]: {
      year: number;
      fromJuly: number;
      yearFiltered: number;
      fromJulyFiltered: number;
    };
  };
  personalFinancialMutations: {
    [key in Person]: { plus: number; min: number };
  };
  personalCosts: { [key in Person]: { plus: number; min: number } };
  totalTimeSpent: number;
  totalProfit: { plus: number; min: number };
  revenuePerAccount: {
    id: string;
    company: string;
    revenue: number;
    goodwillValuePerson: Person | null;
    goodwillValue: number;
  }[];
}

export function ClientRevenueTable(props: Props) {
  return (
    <div className="overflow-x-auto">
      <div className="bg-white shadow-md rounded my-6">
        <table className="min-w-max w-full table-auto">
          <thead>
            <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-right">&nbsp;</th>
              <th className="py-3 px-6 text-right">Omzet</th>
              <th className="py-3 px-6 text-right">Goodwill persoon</th>
              <th className="py-3 px-6 text-right">Goodwill waarde</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm font-light">
            {props.revenuePerAccount.map((account) => (
              <tr
                key={account.id}
                className="border-b border-gray-200 hover:bg-gray-100 mb-10"
              >
                <td className="py-3 px-6 text-right whitespace-nowrap border-r">
                  <div>
                    <span>{account.company}</span>
                  </div>
                </td>
                <td className="py-3 px-6 text-right whitespace-nowrap border-r">
                  <div>
                    <span>{currencyFormatter.format(account.revenue)}</span>
                  </div>
                </td>
                <td className="py-3 px-6 text-right whitespace-nowrap border-r">
                  <div>
                    <span>
                      {account.goodwillValuePerson?.split('')[0].toUpperCase()}
                      {account.goodwillValuePerson?.slice(1)}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-6 text-right whitespace-nowrap">
                  <div>
                    <span>{account.goodwillValue}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
