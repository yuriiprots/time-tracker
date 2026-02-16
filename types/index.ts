export interface Project {
  id: string;
  name: string;
  color: string;
  user_id: string;
  created_at: string;
}

export interface TimeEntry {
  id: string;
  project_id: string | null;
  description: string;
  start_time: string;
  end_time: string | null;
  duration: number | null;
  user_id: string;
  created_at: string;
}

export interface ActiveTimer {
  description: string;
  project_id: string | null;
  start_time: string;
}

export interface TimeEntryWithProject extends TimeEntry {
  project?: Project;
}

export interface GroupedEntries {
  project: Project | null;
  entries: TimeEntry[];
  totalDuration: number;
}
