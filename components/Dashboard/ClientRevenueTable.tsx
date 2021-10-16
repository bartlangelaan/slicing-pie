import styled from 'styled-components';
import { GetSlicingPieResponse } from './GetSlicingPieResponse';

const TableHead = styled.thead`
  top: 78px;
`;

const currencyFormatter = Intl.NumberFormat('nl', {
  style: 'currency',
  currency: 'EUR',
});

export function ClientRevenueTable(props: GetSlicingPieResponse) {
  return (
    <div className="my-12">
      <div className="bg-white shadow-lg rounded">
        <table className="w-full table-auto">
          <TableHead className="sticky">
            <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-right">&nbsp;</th>
              <th className="py-3 px-6 text-right">Omzet</th>
              <th className="py-3 px-6 text-right">Goodwill persoon</th>
              <th className="py-3 px-6 text-right">Goodwill waarde</th>
            </tr>
          </TableHead>
          <tbody className="text-gray-600 text-sm font-light">
            {props.revenuePerAccount.map((account) => (
              <tr
                key={account.id}
                className="border-b border-gray-200 hover:bg-gray-100"
              >
                <td className="py-3 px-6 text-right border-r">
                  <div>
                    <span>{account.company}</span>
                  </div>
                </td>
                <td className="py-3 px-6 text-right border-r">
                  <div>
                    <span>{currencyFormatter.format(account.revenue)}</span>
                  </div>
                </td>
                <td className="py-3 px-6 text-right border-r">
                  <div>
                    <span>
                      {account.goodwillValuePerson?.split('')[0].toUpperCase()}
                      {account.goodwillValuePerson?.slice(1)}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-6 text-right">
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
              <td className="py-3 px-6 text-right border-r font-medium">
                <div>
                  <span>Totaal</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right border-r font-medium">
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
              <td className="py-3 px-6 text-right border-r" />
              <td className="py-3 px-6 text-right" />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
