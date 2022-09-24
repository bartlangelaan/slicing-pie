export interface TimeEntry {
  id: string;
  administration_id: string;
  contact_id: string;
  project_id: string;
  user_id: string;
  started_at: Date;
  ended_at: Date;
  description: string;
  paused_duration: number;
  billable: boolean;
  created_at: Date;
  updated_at: Date;
  contact: {};
  detail: null;
  user: {
    id: string;
    name: string;
    created_at: Date;
    updated_at: Date;
  };
  project: {
    id: string;
    name: string;
    state: 'archived';
  };
  events: {}[];
  notes: {}[];
}
