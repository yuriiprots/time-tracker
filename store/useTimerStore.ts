import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/lib/supabase";
import type { Project, TimeEntry, ActiveTimer } from "@/types";

interface TimerState {
  // State
  activeTimer: ActiveTimer | null;
  entries: TimeEntry[];
  projects: Project[];
  unsyncedEntries: string[]; // IDs of entries not yet synced
  isOnline: boolean;

  // Timer actions
  startTimer: (description: string, projectId: string | null) => void;
  stopTimer: () => Promise<void>;
  
  // Entry actions
  updateEntry: (id: string, updates: Partial<TimeEntry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  
  // Project actions
  fetchProjects: () => Promise<void>;
  addProject: (name: string, color: string) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  
  // Sync actions
  syncWithServer: () => Promise<void>;
  setOnlineStatus: (status: boolean) => void;
  
  // Fetch actions
  fetchTodayEntries: () => Promise<void>;
  fetchAllEntries: () => Promise<void>;
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      // Initial state
      activeTimer: null,
      entries: [],
      projects: [],
      unsyncedEntries: [],
      isOnline: true,

      // Start timer
      startTimer: (description, projectId) => {
        const { entries } = get();
        
        // Check if today already has 24 hours tracked
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const todayEntries = entries.filter(
          (entry) => new Date(entry.start_time) >= today && new Date(entry.start_time) < tomorrow
        );
        const todayTotalDuration = todayEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
        
        // 24 hours = 86400 seconds
        if (todayTotalDuration >= 86400) {
          const hours = Math.floor(todayTotalDuration / 3600);
          const minutes = Math.floor((todayTotalDuration % 3600) / 60);
          alert(`Cannot start timer: You have already tracked 24 hours today (${hours}h ${minutes}m). Please complete entries for a different day.`);
          return;
        }
        
        set({
          activeTimer: {
            description,
            project_id: projectId,
            start_time: new Date().toISOString(),
          },
        });
      },

      // Stop timer
      stopTimer: async () => {
        const { activeTimer, isOnline, entries } = get();
        if (!activeTimer) return;

        const endTime = new Date().toISOString();
        const duration = Math.floor(
          (new Date(endTime).getTime() - new Date(activeTimer.start_time).getTime()) / 1000
        );

        // Check 24-hour daily limit
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const todayEntries = entries.filter(
          (entry) => new Date(entry.start_time) >= today && new Date(entry.start_time) < tomorrow
        );
        const todayTotalDuration = todayEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
        
        // 24 hours = 86400 seconds
        if (todayTotalDuration + duration > 86400) {
          alert(`Cannot add entry: This would exceed the 24-hour daily limit. Current total: ${Math.floor(todayTotalDuration / 3600)}h ${Math.floor((todayTotalDuration % 3600) / 60)}m`);
          set({ activeTimer: null });
          return;
        }

        // Check if there's an existing entry today with the same description and project
        const existingEntry = entries.find(
          (entry) =>
            entry.description === activeTimer.description &&
            entry.project_id === activeTimer.project_id &&
            new Date(entry.start_time) >= today
        );

        if (existingEntry) {
          // Update existing entry: add new duration and update end_time
          const updatedDuration = (existingEntry.duration || 0) + duration;
          const updates = {
            duration: updatedDuration,
            end_time: endTime,
          };

          // Update local state
          set((state) => ({
            entries: [
              { ...existingEntry, ...updates }, // Move to top
              ...state.entries.filter((e) => e.id !== existingEntry.id),
            ],
            activeTimer: null,
            unsyncedEntries: state.unsyncedEntries.includes(existingEntry.id)
              ? state.unsyncedEntries
              : [...state.unsyncedEntries, existingEntry.id],
          }));

          // Try to sync update if online
          if (isOnline) {
            try {
              await supabase
                .from("time_entries")
                .update(updates)
                .eq("id", existingEntry.id);

              set((state) => ({
                unsyncedEntries: state.unsyncedEntries.filter(
                  (id) => id !== existingEntry.id
                ),
              }));
            } catch (error) {
              console.error("Failed to update entry:", error);
            }
          }
        } else {
          // Create new entry (original behavior)
          const newEntry: Partial<TimeEntry> = {
            id: crypto.randomUUID(),
            description: activeTimer.description,
            project_id: activeTimer.project_id,
            start_time: activeTimer.start_time,
            end_time: endTime,
            duration,
            user_id: "00000000-0000-0000-0000-000000000000", // Valid UUID for development
            created_at: new Date().toISOString(),
          };

          // Add to local state
          set((state) => ({
            entries: [newEntry as TimeEntry, ...state.entries],
            activeTimer: null,
            unsyncedEntries: [...state.unsyncedEntries, newEntry.id!],
          }));

          // Try to sync if online
          if (isOnline) {
            try {
              const { error } = await supabase
                .from("time_entries")
                .insert([newEntry]);

              if (!error) {
                set((state) => ({
                  unsyncedEntries: state.unsyncedEntries.filter((id) => id !== newEntry.id),
                }));
              }
            } catch (error) {
              console.error("Failed to sync entry:", error);
            }
          }
        }
      },

      // Update entry
      updateEntry: async (id, updates) => {
        const { isOnline, entries } = get();
        
        const entryToUpdate = entries.find((e) => e.id === id);
        if (!entryToUpdate) return;

        // If duration is being updated, check 24-hour limit
        if (updates.duration !== undefined && updates.duration !== null) {
          const entryDate = new Date(entryToUpdate.start_time);
          const dayStart = new Date(entryDate);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(dayStart);
          dayEnd.setDate(dayEnd.getDate() + 1);

          const sameDayEntries = entries.filter(
            (entry) =>
              entry.id !== id &&
              new Date(entry.start_time) >= dayStart &&
              new Date(entry.start_time) < dayEnd
          );
          const sameDayTotal = sameDayEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0);

          if (sameDayTotal + updates.duration > 86400) {
            alert(`Cannot update entry: This would exceed the 24-hour daily limit for ${entryDate.toLocaleDateString()}`);
            return;
          }
        }

        // Update local state
        set((state) => ({
          entries: state.entries.map((entry) =>
            entry.id === id ? { ...entry, ...updates } : entry
          ),
          unsyncedEntries: state.unsyncedEntries.includes(id)
            ? state.unsyncedEntries
            : [...state.unsyncedEntries, id],
        }));

        // Try to sync if online
        if (isOnline) {
          try {
            await supabase.from("time_entries").update(updates).eq("id", id);
            
            set((state) => ({
              unsyncedEntries: state.unsyncedEntries.filter((entryId) => entryId !== id),
            }));
          } catch (error) {
            console.error("Failed to update entry:", error);
          }
        }
      },

      // Delete entry
      deleteEntry: async (id) => {
        const { isOnline } = get();

        // Remove from local state
        set((state) => ({
          entries: state.entries.filter((entry) => entry.id !== id),
          unsyncedEntries: state.unsyncedEntries.filter((entryId) => entryId !== id),
        }));

        // Try to delete from server if online
        if (isOnline) {
          try {
            await supabase.from("time_entries").delete().eq("id", id);
          } catch (error) {
            console.error("Failed to delete entry:", error);
          }
        }
      },

      // Fetch projects
      fetchProjects: async () => {
        try {
          const { data, error } = await supabase
            .from("projects")
            .select("*")
            .order("name");

          if (error) throw error;
          set({ projects: data || [] });
        } catch (error) {
          console.error("Failed to fetch projects:", error);
        }
      },

      // Add project
      addProject: async (name, color) => {
        const newProject: Partial<Project> = {
          id: crypto.randomUUID(),
          name,
          color,
          user_id: "00000000-0000-0000-0000-000000000000", // Valid UUID for development
          created_at: new Date().toISOString(),
        };

        // Add to local state
        set((state) => ({
          projects: [...state.projects, newProject as Project],
        }));

        // Sync to server
        try {
          await supabase.from("projects").insert([newProject]);
        } catch (error) {
          console.error("Failed to add project:", error);
        }
      },

      // Update project
      updateProject: async (id, updates) => {
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === id ? { ...project, ...updates } : project
          ),
        }));

        try {
          await supabase.from("projects").update(updates).eq("id", id);
        } catch (error) {
          console.error("Failed to update project:", error);
        }
      },

      // Delete project
      deleteProject: async (id) => {
        set((state) => ({
          projects: state.projects.filter((project) => project.id !== id),
        }));

        try {
          await supabase.from("projects").delete().eq("id", id);
        } catch (error) {
          console.error("Failed to delete project:", error);
        }
      },

      // Sync with server
      syncWithServer: async () => {
        const { unsyncedEntries, entries } = get();
        
        if (unsyncedEntries.length === 0) return;

        const entriesToSync = entries.filter((entry) =>
          unsyncedEntries.includes(entry.id)
        );

        try {
          for (const entry of entriesToSync) {
            await supabase.from("time_entries").upsert([entry]);
          }

          set({ unsyncedEntries: [] });
        } catch (error) {
          console.error("Failed to sync with server:", error);
        }
      },

      // Set online status
      setOnlineStatus: (status) => {
        set({ isOnline: status });
        
        // Auto-sync when coming back online
        if (status) {
          get().syncWithServer();
        }
      },

      // Fetch today's entries
      fetchTodayEntries: async () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        try {
          const { data, error } = await supabase
            .from("time_entries")
            .select("*")
            .gte("start_time", today.toISOString())
            .order("start_time", { ascending: false });

          if (error) throw error;
          set({ entries: data || [] });
        } catch (error) {
          console.error("Failed to fetch entries:", error);
        }
      },

      fetchAllEntries: async () => {
        try {
          const { data, error } = await supabase
            .from("time_entries")
            .select("*")
            .order("start_time", { ascending: false });

          if (error) throw error;
          set({ entries: data || [] });
        } catch (error) {
          console.error("Failed to fetch all entries:", error);
        }
      },
    }),
    {
      name: "timer-storage",
      partialize: (state) => ({
        activeTimer: state.activeTimer,
        entries: state.entries,
        projects: state.projects,
        unsyncedEntries: state.unsyncedEntries,
      }),
    }
  )
);
