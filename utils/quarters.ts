import {
  eachQuarterOfInterval,
  endOfQuarter,
  format,
  eachDayOfInterval,
} from 'date-fns';

export const quarters = eachQuarterOfInterval({
  start: new Date(2020, 11, 7), // 2022-12-07
  end: new Date(),
})
  .reverse()
  .map((start) => {
    const end = endOfQuarter(start);
    return {
      year: format(start, 'yyyy'),
      quarter: format(start, 'Q'),
      label: format(start, 'yyyyQQQ'),
      start,
      end,
      days: eachDayOfInterval({ start, end }),
      hoursUrl: `/hours/${format(start, 'yyyy/Q')}`,
    };
  });
