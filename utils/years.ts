import { format, eachYearOfInterval, endOfYear, startOfYear } from 'date-fns';

export const years = eachYearOfInterval({
  start: new Date(2021, 1, 1),
  end: new Date(),
})
  .reverse()
  .map((yearDate) => {
    const periodFilter = {
      $gte: startOfYear(yearDate) as Date | undefined,
      $lte: endOfYear(yearDate),
    };
    if (yearDate.getFullYear() === 2011) {
      delete periodFilter.$gte;
    }
    return {
      year: format(yearDate, 'yyyy'),
      periodFilter,
      pieUrl: `/pie/${format(yearDate, 'yyyy')}`,
    };
  });
