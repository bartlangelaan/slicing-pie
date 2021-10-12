import { GetSlicingPieResponse } from './GetSlicingPieResponse';

const currencyFormatter = Intl.NumberFormat('nl', {
  style: 'currency',
  currency: 'EUR',
});

export function ClientRevenueTable(props: GetSlicingPieResponse) {
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
            <tr className="h-10 border-b">
              <td className="border-r" />
              <td className="border-r" />
              <td className="border-r" />
              <td className="border-r" />
            </tr>
            <tr className="border-b border-gray-200 bg-gray-50 hover:bg-gray-100 mb-10">
              <td className="py-3 px-6 text-right whitespace-nowrap border-r font-medium">
                <div>
                  <span>Totaal</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right whitespace-nowrap border-r font-medium">
                <div>
                  <span>
                    {currencyFormatter.format(
                      props.revenuePerAccount.reduce(
                        (total, account) => total + account.revenue,
                        0,
                      ),
                    )}
                  </span>
                </div>
              </td>
              <td className="py-3 px-6 text-right whitespace-nowrap border-r" />
              <td className="py-3 px-6 text-right whitespace-nowrap" />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
