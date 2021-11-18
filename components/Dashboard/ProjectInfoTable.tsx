import styled from 'styled-components';
import { GetSlicingPieResponse } from './GetSlicingPieResponse';
import { ProjectInfoRow } from './ProjectInfoRow';

const TableHead = styled.thead`
  top: 78px;
`;

export function ProjectInfoTable(props: GetSlicingPieResponse) {
  // Temp because of caching.
  if (!props.timeSpentPerProject) return null;

  const totalBillableHoursSpentSlicingPieBart =
    props.timeSpentPerProject.reduce(
      (total, project) =>
        total + (project.skipped ? 0 : project.timeSpent.bart.billable),
      0,
    );
  const totalBillableHoursSpentSlicingPieIan = props.timeSpentPerProject.reduce(
    (total, project) =>
      total + (project.skipped ? 0 : project.timeSpent.ian.billable),
    0,
  );
  const totalBillableHoursSpentSlicingPieNiels =
    props.timeSpentPerProject.reduce(
      (total, project) =>
        total + (project.skipped ? 0 : project.timeSpent.niels.billable),
      0,
    );

  const totalNonBillableHoursSpentSlicingPieBart =
    props.timeSpentPerProject.reduce(
      (total, project) =>
        total + (project.skipped ? 0 : project.timeSpent.bart.nonBillable),
      0,
    );
  const totalNonBillableHoursSpentSlicingPieIan =
    props.timeSpentPerProject.reduce(
      (total, project) =>
        total + (project.skipped ? 0 : project.timeSpent.ian.nonBillable),
      0,
    );
  const totalNonBillableHoursSpentSlicingPieNiels =
    props.timeSpentPerProject.reduce(
      (total, project) =>
        total + (project.skipped ? 0 : project.timeSpent.niels.nonBillable),
      0,
    );

  const totalBillableHoursSpentBart = props.timeSpentPerProject.reduce(
    (total, project) =>
      total + (project.skipped ? project.timeSpent.bart.billable : 0),
    0,
  );
  const totalBillableHoursSpentIan = props.timeSpentPerProject.reduce(
    (total, project) =>
      total + (project.skipped ? project.timeSpent.ian.billable : 0),
    0,
  );
  const totalBillableHoursSpentNiels = props.timeSpentPerProject.reduce(
    (total, project) =>
      total + (project.skipped ? project.timeSpent.niels.billable : 0),
    0,
  );

  const totalNonBillableHoursSpentBart = props.timeSpentPerProject.reduce(
    (total, project) =>
      total + (project.skipped ? project.timeSpent.bart.nonBillable : 0),
    0,
  );
  const totalNonBillableHoursSpentIan = props.timeSpentPerProject.reduce(
    (total, project) =>
      total + (project.skipped ? project.timeSpent.ian.nonBillable : 0),
    0,
  );
  const totalNonBillableHoursSpentNiels = props.timeSpentPerProject.reduce(
    (total, project) =>
      total + (project.skipped ? project.timeSpent.niels.nonBillable : 0),
    0,
  );

  return (
    <div className="my-12">
      <div className="bg-white shadow-lg rounded">
        <table className="w-full table-auto">
          <TableHead className="sticky">
            <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
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
            {props.timeSpentPerProject
              .filter((project) => !project.skipped)
              .map((project) => (
                <ProjectInfoRow project={project} />
              ))}
            <tr className="h-10 border-b">
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
                  <span>Totaal voor slicing pie</span>
                </div>
              </td>
              <td className="py-3 px-6 text-right border-r font-medium">
                {Math.round(totalBillableHoursSpentSlicingPieBart * 10) / 10}{' '}
                uur
              </td>
              <td className="py-3 px-6 text-right border-r font-medium">
                {Math.round(totalNonBillableHoursSpentSlicingPieBart * 10) / 10}{' '}
                uur
              </td>
              <td className="py-3 px-6 text-right border-r font-medium">
                {Math.round(totalBillableHoursSpentSlicingPieIan * 10) / 10} uur
              </td>
              <td className="py-3 px-6 text-right border-r font-medium">
                {Math.round(totalNonBillableHoursSpentSlicingPieIan * 10) / 10}{' '}
                uur
              </td>
              <td className="py-3 px-6 text-right border-r font-medium">
                {Math.round(totalBillableHoursSpentSlicingPieNiels * 10) / 10}{' '}
                uur
              </td>
              <td className="py-3 px-6 text-right font-medium">
                {Math.round(totalNonBillableHoursSpentSlicingPieNiels * 10) /
                  10}{' '}
                uur
              </td>
            </tr>
            <tr className="border-b border-gray-200 bg-gray-50 hover:bg-gray-100 mb-10">
              <td className="py-3 px-6 text-right border-r font-medium" />
              <td
                colSpan={2}
                className="py-3 px-6 text-center border-r font-medium"
              >
                {Math.round(
                  (totalBillableHoursSpentSlicingPieBart +
                    totalNonBillableHoursSpentSlicingPieBart) *
                    10,
                ) / 10}{' '}
                uur
              </td>
              <td
                colSpan={2}
                className="py-3 px-6 text-center border-r font-medium"
              >
                {Math.round(
                  (totalBillableHoursSpentSlicingPieIan +
                    totalNonBillableHoursSpentSlicingPieIan) *
                    10,
                ) / 10}{' '}
                uur
              </td>
              <td
                colSpan={2}
                className="py-3 px-6 text-center border-r font-medium"
              >
                {Math.round(
                  (totalBillableHoursSpentSlicingPieNiels +
                    totalNonBillableHoursSpentSlicingPieNiels) *
                    10,
                ) / 10}{' '}
                uur
              </td>
            </tr>
            <tr className="h-10 border-b">
              <td className="border-r" />
              <td className="border-r" />
              <td className="border-r" />
              <td className="border-r" />
              <td className="border-r" />
              <td className="border-r" />
            </tr>
            {props.timeSpentPerProject
              .filter((project) => project.skipped)
              .map((project) => (
                <ProjectInfoRow project={project} />
              ))}
            <tr className="h-10 border-b">
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
              <td className="py-3 px-6 text-right border-r font-medium">
                {Math.round(totalBillableHoursSpentBart * 10) / 10} uur
              </td>
              <td className="py-3 px-6 text-right border-r font-medium">
                {Math.round(totalNonBillableHoursSpentBart * 10) / 10} uur
              </td>
              <td className="py-3 px-6 text-right border-r font-medium">
                {Math.round(totalBillableHoursSpentIan * 10) / 10} uur
              </td>
              <td className="py-3 px-6 text-right border-r font-medium">
                {Math.round(totalNonBillableHoursSpentIan * 10) / 10} uur
              </td>
              <td className="py-3 px-6 text-right border-r font-medium">
                {Math.round(totalBillableHoursSpentNiels * 10) / 10} uur
              </td>
              <td className="py-3 px-6 text-right font-medium">
                {Math.round(totalNonBillableHoursSpentNiels * 10) / 10} uur
              </td>
            </tr>
            <tr className="border-b border-gray-200 bg-gray-50 hover:bg-gray-100 mb-10">
              <td className="py-3 px-6 text-right border-r font-medium" />
              <td
                colSpan={2}
                className="py-3 px-6 text-center border-r font-medium"
              >
                {Math.round(
                  (totalBillableHoursSpentBart +
                    totalNonBillableHoursSpentBart) *
                    10,
                ) / 10}{' '}
                uur
              </td>
              <td
                colSpan={2}
                className="py-3 px-6 text-center border-r font-medium"
              >
                {Math.round(
                  (totalBillableHoursSpentIan + totalNonBillableHoursSpentIan) *
                    10,
                ) / 10}{' '}
                uur
              </td>
              <td
                colSpan={2}
                className="py-3 px-6 text-center border-r font-medium"
              >
                {Math.round(
                  (totalBillableHoursSpentNiels +
                    totalNonBillableHoursSpentNiels) *
                    10,
                ) / 10}{' '}
                uur
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
