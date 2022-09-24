/* eslint-disable import/no-cycle, @typescript-eslint/ban-types, consistent-return */
import { NextApiRequest, NextApiResponse } from 'next';
import { requestAll } from './get-slicing-pie';

interface TimeEntry {
  id: string;
  administration_id: string;
  contact_id: string;
  project_id: string;
  user_id: string;
  started_at: string;
  ended_at: string;
  description: string;
  paused_duration: number;
  billable: boolean;
  created_at: string;
  updated_at: string;
  contact: {};
  detail: null;
  user: {
    id: string;
    name: string;
    created_at: string;
    updated_at: string;
  };
  project: {
    id: string;
    name: string;
    state: 'archived';
  };
  events: {}[];
  notes: {}[];
}

export function getAllHours(period: string) {
  return requestAll<TimeEntry[]>(`/time_entries.json?filter=period:${period}`);
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  res.json({});
};
