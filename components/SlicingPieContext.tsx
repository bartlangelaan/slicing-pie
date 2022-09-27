import { createContext, ReactNode, useContext } from 'react';
import { GetSlicingPieResponse } from './Dashboard/GetSlicingPieResponse';

type Value = {
  data: GetSlicingPieResponse;
  periodFilter: number;
};
const context = createContext(null as any as Value);

export function SlicingPieDataProvider(props: {
  value: Value;
  children: ReactNode;
}) {
  return (
    <context.Provider value={props.value}>{props.children}</context.Provider>
  );
}

export function useSlicingPie() {
  return useContext(context);
}
