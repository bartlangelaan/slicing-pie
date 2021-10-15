import styled from 'styled-components';
import { GetSlicingPieResponse } from './GetSlicingPieResponse';

const TableHead = styled.thead`
  top: 78px;
`;

export function ProjectInfoTable(props: GetSlicingPieResponse) {
  // Temp because of caching.
  if (!props.timeSpentPerProject) return null;

  const totalBillableHoursSpentBart = props.timeSpentPerProject.reduce(
    (total, project) => total + project.timeSpent.bart.billable,
    0,
  );
  const totalBillableHoursSpentIan = props.timeSpentPerProject.reduce(
    (total, project) => total + project.timeSpent.ian.billable,
    0,
  );
  const totalBillableHoursSpentNiels = props.timeSpentPerProject.reduce(
    (total, project) => total + project.timeSpent.niels.billable,
    0,
  );

  const totalNonBillableHoursSpentBart = props.timeSpentPerProject.reduce(
    (total, project) => total + project.timeSpent.bart.nonBillable,
    0,
  );
  const totalNonBillableHoursSpentIan = props.timeSpentPerProject.reduce(
    (total, project) => total + project.timeSpent.ian.nonBillable,
    0,
  );
  const totalNonBillableHoursSpentNiels = props.timeSpentPerProject.reduce(
    (total, project) => total + project.timeSpent.niels.nonBillable,
    0,
  );

  return (
    <div className="my-12">
      <div className="bg-white shadow-lg rounded">
        <table className="w-full table-auto">
          <TableHead className="sticky">
            <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
              <th className="py-3 px-6 bg-gray-200 text-right">&nbsp;</th>
              <th className="py-3 px-6 bg-gray-200 text-right">&nbsp;</th>
              <th colSpan={2} className="py-3 px-6 bg-gray-200 text-center">
                Bart
              </th>
              <th colSpan={2} className="py-3 px-6 bg-gray-200 text-center">
                Ian
              </th>
              <th colSpan={2} className="py-3 px-6 bg-gray-200 text-center">
                Niels
              </th>
            </tr>
            <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
              <th className="py-3 px-6 bg-gray-200 text-right">&nbsp;</th>
              <th className="py-3 px-6 bg-gray-200 text-right">Slicing pie</th>
              <th className="py-3 px-6 bg-gray-200 text-center">
                <span className="material-icons material-icons-outlined">
                  attach_money
                </span>
              </th>
              <th className="py-3 px-6 bg-gray-200 text-center">
                <span className="material-icons material-icons-outlined">
                  money_off
                </span>
              </th>
              <th className="py-3 px-6 bg-gray-200 text-center">
                <span className="material-icons material-icons-outlined">
                  attach_money
                </span>
              </th>
              <th className="py-3 px-6 bg-gray-200 text-center">
                <span className="material-icons material-icons-outlined">
                  money_off
                </span>
              </th>
              <th className="py-3 px-6 bg-gray-200 text-center">
                <span className="material-icons material-icons-outlined">
                  attach_money
                </span>
              </th>
              <th className="py-3 px-6 bg-gray-200 text-center">
                <span className="material-icons material-icons-outlined">
                  money_off
                </span>
              </th>
            </tr>
          </TableHead>
          <tbody className="text-gray-600 text-sm font-light">
            {props.timeSpentPerProject.map((project) => (
              <tr
                key={project.id}
                className="border-b border-gray-200 hover:bg-gray-100"
              >
                <td className="py-3 px-6 text-right border-r">
                  <div>
                    <span>{project.name}</span>
                  </div>
                </td>
                <td className="py-3 px-6 text-right border-r">
                  <div>
                    <span>{project.skipped ? 'Nee' : 'Ja'}</span>
                  </div>
                </td>
                <td className="py-3 px-6 text-right border-r">
                  <div>
                    <span>
                      {Math.round(project.timeSpent.bart.billable * 10) / 10}{' '}
                      uur
                    </span>
                  </div>
                </td>
                <td className="py-3 px-6 text-right border-r">
                  <div>
                    <span>
                      {Math.round(project.timeSpent.bart.nonBillable * 10) / 10}{' '}
                      uur
                    </span>
                  </div>
                </td>
                <td className="py-3 px-6 text-right border-r">
                  <div>
                    <span>
                      {Math.round(project.timeSpent.ian.billable * 10) / 10} uur
                    </span>
                  </div>
                </td>
                <td className="py-3 px-6 text-right border-r">
                  <div>
                    <span>
                      {Math.round(project.timeSpent.ian.nonBillable * 10) / 10}{' '}
                      uur
                    </span>
                  </div>
                </td>
                <td className="py-3 px-6 text-right border-r">
                  <div>
                    <span>
                      {Math.round(project.timeSpent.niels.billable * 10) / 10}{' '}
                      uur
                    </span>
                  </div>
                </td>
                <td className="py-3 px-6 text-right border-r">
                  <div>
                    <span>
                      {Math.round(project.timeSpent.niels.nonBillable * 10) /
                        10}{' '}
                      uur
                    </span>
                  </div>
                </td>
              </tr>
            ))}
            <tr className="h-10 border-b">
              <td className="border-r" />
              <td className="border-r" />
              <td className="border-r" />
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
              <td className="py-3 px-6 text-right border-r font-medium" />
              <td className="py-3 px-6 text-right border-r font-medium">
                {Math.round(totalBillableHoursSpentBart * 10) / 10} uur
              </td>
              <td className="py-3 px-6 text-right border-r font-medium">
                {Math.round(totalBillableHoursSpentIan * 10) / 10} uur
              </td>
              <td className="py-3 px-6 text-right border-r font-medium">
                {Math.round(totalBillableHoursSpentNiels * 10) / 10} uur
              </td>
              <td className="py-3 px-6 text-right border-r font-medium">
                {Math.round(totalNonBillableHoursSpentBart * 10) / 10} uur
              </td>
              <td className="py-3 px-6 text-right border-r font-medium">
                {Math.round(totalNonBillableHoursSpentIan * 10) / 10} uur
              </td>
              <td className="py-3 px-6 text-right font-medium">
                {Math.round(totalNonBillableHoursSpentNiels * 10) / 10} uur
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
