import { supabase } from "@/lib/supabase";
import { TimeEntry, Project } from "@/types";

export const timerService = {
  // Entries
  async fetchEntries(startDate: Date, endDate: Date) {
    const { data, error } = await supabase
      .from("time_entries")
      .select("*")
      .gte("start_time", startDate.toISOString())
      .lt("start_time", endDate.toISOString())
      .order("start_time", { ascending: false });

    if (error) throw error;
    return data as TimeEntry[];
  },

  async fetchAllEntries() {
    const { data, error } = await supabase
      .from("time_entries")
      .select("*")
      .order("start_time", { ascending: false });

    if (error) throw error;
    return data as TimeEntry[];
  },

  async createEntry(entry: Partial<TimeEntry>) {
    const { data, error } = await supabase
      .from("time_entries")
      .insert([entry])
      .select()
      .single();

    if (error) throw error;
    return data as TimeEntry;
  },

  async updateEntry(id: string, updates: Partial<TimeEntry>) {
    const { data, error } = await supabase
      .from("time_entries")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as TimeEntry;
  },

  async deleteEntry(id: string) {
    const { error } = await supabase
      .from("time_entries")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  async upsertEntry(entry: TimeEntry) {
    const { data, error } = await supabase
      .from("time_entries")
      .upsert(entry, { onConflict: "id" })
      .select()
      .single();

    if (error) throw error;
    return data as TimeEntry;
  },

  // Projects
  async fetchProjects() {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("name");

    if (error) throw error;
    return data as Project[];
  },

  async createProject(project: Partial<Project>) {
    const { data, error } = await supabase
      .from("projects")
      .insert([project])
      .select()
      .single();

    if (error) throw error;
    return data as Project;
  },

  async updateProject(id: string, updates: Partial<Project>) {
    const { data, error } = await supabase
      .from("projects")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Project;
  },

  async deleteProject(id: string) {
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  async upsertProject(project: Project) {
    const { data, error } = await supabase
      .from("projects")
      .upsert(project, { onConflict: "id" })
      .select()
      .single();

    if (error) throw error;
    return data as Project;
  },
};
