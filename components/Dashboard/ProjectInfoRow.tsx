import { GetSlicingPieResponse } from './GetSlicingPieResponse';

interface Props {
  project: GetSlicingPieResponse['timeSpentPerProject'][0];
}

export function ProjectInfoRow(props: Props) {
  return (
    <tr
      key={props.project.id}
      className="border-b border-gray-200 hover:bg-gray-100"
    >
      <td className="py-3 px-6 text-right border-r">
        <div>
          <span>{props.project.name}</span>
        </div>
        {props.project.skipped && (
          <div className="text-xs italic">
            Weegt niet mee voor de slicing pie
          </div>
        )}
      </td>
      <td className="py-3 px-6 text-right border-r">
        <div>
          <span>
            {Math.round(props.project.timeSpent.bart.billable * 10) / 10} uur
          </span>
        </div>
      </td>
      <td className="py-3 px-6 text-right border-r">
        <div>
          <span>
            {Math.round(props.project.timeSpent.bart.nonBillable * 10) / 10} uur
          </span>
        </div>
      </td>
      <td className="py-3 px-6 text-right border-r">
        <div>
          <span>
            {Math.round(props.project.timeSpent.ian.billable * 10) / 10} uur
          </span>
        </div>
      </td>
      <td className="py-3 px-6 text-right border-r">
        <div>
          <span>
            {Math.round(props.project.timeSpent.ian.nonBillable * 10) / 10} uur
          </span>
        </div>
      </td>
      <td className="py-3 px-6 text-right border-r">
        <div>
          <span>
            {Math.round(props.project.timeSpent.niels.billable * 10) / 10} uur
          </span>
        </div>
      </td>
      <td className="py-3 px-6 text-right border-r">
        <div>
          <span>
            {Math.round(props.project.timeSpent.niels.nonBillable * 10) / 10}{' '}
            uur
          </span>
        </div>
      </td>
    </tr>
  );
}
