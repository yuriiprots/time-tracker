import { useMemo } from "react";
import { TimeEntry, Project, GroupedEntries } from "@/types";

export function useDailyEntries(entries: TimeEntry[], projects: Project[]) {
  // Filter entries to show only TODAY's entries
  const todayEntries = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return entries.filter(
      (entry) => new Date(entry.start_time) >= today && new Date(entry.start_time) < tomorrow
    );
  }, [entries]);

  // Group entries by project
  const groupedEntries: GroupedEntries[] = useMemo(() => {
    return todayEntries.reduce((acc, entry) => {
      const project = projects.find((p) => p.id === entry.project_id) || null;
      const existingGroup = acc.find((g) => g.project?.id === project?.id);

      if (existingGroup) {
        existingGroup.entries.push(entry);
        existingGroup.totalDuration += entry.duration || 0;
      } else {
        acc.push({
          project,
          entries: [entry],
          totalDuration: entry.duration || 0,
        });
      }

      return acc;
    }, [] as GroupedEntries[]);
  }, [todayEntries, projects]);

  const totalDailyDuration = useMemo(() => {
    return todayEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
  }, [todayEntries]);

  return {
    todayEntries,
    groupedEntries,
    totalDailyDuration,
  };
}
