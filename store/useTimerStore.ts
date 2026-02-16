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
  unsyncedProjects: string[]; // IDs of projects not yet synced
  isOnline: boolean;
  isSyncing: boolean; // Track active sync operations
  userId: string | null; // Cached user ID for offline use

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
  syncProjects: () => Promise<void>;
  setOnlineStatus: (status: boolean) => void;
  setUserId: (userId: string | null) => void;
  
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
      unsyncedProjects: [],
      isOnline: true,
      isSyncing: false,
      userId: null,

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

        // Get user ID from cache (works offline)
        const { userId } = get();
        if (!userId) {
          console.error("No user ID found. Please log in.");
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
            user_id: userId, // Use cached user ID
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
              console.error("Failed to insert entry:", error);
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
          
          // Merge with unsynced local projects
          const { projects, unsyncedProjects } = get();
          const unsyncedLocalProjects = projects.filter((project) =>
            unsyncedProjects.includes(project.id)
          );
          
          // Combine: unsynced local projects + fetched projects (avoiding duplicates)
          const fetchedIds = new Set((data || []).map((p) => p.id));
          const uniqueLocalProjects = unsyncedLocalProjects.filter(
            (project) => !fetchedIds.has(project.id)
          );
          
          const mergedProjects = [...uniqueLocalProjects, ...(data || [])];
          
          set({ projects: mergedProjects });
        } catch (error) {
          console.error("Failed to fetch projects:", error);
          // If fetch fails (offline), keep existing projects
        }
      },

      // Add project
      addProject: async (name, color) => {
        const { userId, isOnline } = get();
        // Get user ID from cache (works offline)
        if (!userId) {
          console.error("No user ID found. Please log in.");
          return;
        }

        const newProject: Partial<Project> = {
          id: crypto.randomUUID(),
          name,
          color,
          user_id: userId, // Use cached user ID
          created_at: new Date().toISOString(),
        };

        // Add to local state
        set((state) => ({
          projects: [...state.projects, newProject as Project],
          unsyncedProjects: [...state.unsyncedProjects, newProject.id!],
        }));

        // Try to sync if online
        if (isOnline) {
          try {
            const { error } = await supabase.from("projects").insert([newProject]);
            
            if (!error) {
              set((state) => ({
                unsyncedProjects: state.unsyncedProjects.filter((id) => id !== newProject.id),
              }));
            }
          } catch (error) {
            console.error("Failed to add project:", error);
          }
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
          
          // Merge with unsynced local entries
          const { entries, unsyncedEntries } = get();
          const unsyncedLocalEntries = entries.filter((entry) =>
            unsyncedEntries.includes(entry.id)
          );
          
          // Combine: unsynced local entries + fetched entries (avoiding duplicates)
          const fetchedIds = new Set((data || []).map((e) => e.id));
          const uniqueLocalEntries = unsyncedLocalEntries.filter(
            (entry) => !fetchedIds.has(entry.id)
          );
          
          const mergedEntries = [...uniqueLocalEntries, ...(data || [])];
          
          set({ entries: mergedEntries });
        } catch (error) {
          console.error("Failed to fetch entries:", error);
          // If fetch fails (offline), keep existing entries
        }
      },

      fetchAllEntries: async () => {
        try {
          const { data, error } = await supabase
            .from("time_entries")
            .select("*")
            .order("start_time", { ascending: false });

          if (error) throw error;
          
          // Merge with unsynced local entries
          const { entries, unsyncedEntries } = get();
          const unsyncedLocalEntries = entries.filter((entry) =>
            unsyncedEntries.includes(entry.id)
          );
          
          // Combine: unsynced local entries + fetched entries (avoiding duplicates)
          const fetchedIds = new Set((data || []).map((e) => e.id));
          const uniqueLocalEntries = unsyncedLocalEntries.filter(
            (entry) => !fetchedIds.has(entry.id)
          );
          
          const mergedEntries = [...uniqueLocalEntries, ...(data || [])];
          
          set({ entries: mergedEntries });
        } catch (error) {
          console.error("Failed to fetch all entries:", error);
          // If fetch fails (offline), keep existing entries
        }
      },

      // Sync unsynced entries with server
      syncWithServer: async () => {
        const { unsyncedEntries, entries, userId } = get();
        
        if (unsyncedEntries.length === 0) {
          console.log("✅ No unsynced entries to sync");
          return;
        }

        console.log(`🔄 Syncing ${unsyncedEntries.length} unsynced entries...`);
        set({ isSyncing: true });

        // Use cached user ID (works even if auth session isn't fully loaded)
        if (!userId) {
          console.error("❌ No user ID found for sync. Please log in.");
          set({ isSyncing: false });
          return;
        }

        const entriesToSync = entries.filter((entry) =>
          unsyncedEntries.includes(entry.id)
        );

        console.log(`📤 Found ${entriesToSync.length} entries to sync`);

        for (const entry of entriesToSync) {
          try {
            // Ensure user_id is set
            const entryWithUser = { ...entry, user_id: userId };
            
            // Try to upsert (insert or update)
            const { error } = await supabase
              .from("time_entries")
              .upsert(entryWithUser, { onConflict: "id" });

            if (!error) {
              console.log(`✅ Synced entry: ${entry.id}`);
              // Remove from unsynced list
              set((state) => ({
                unsyncedEntries: state.unsyncedEntries.filter(
                  (id) => id !== entry.id
                ),
              }));
            } else {
              console.error(`❌ Failed to sync entry ${entry.id}:`, error);
            }
          } catch (error) {
            console.error(`❌ Failed to sync entry ${entry.id}:`, error);
          }
        }

        // Cleanup: Remove any orphaned IDs (IDs in unsyncedEntries that don't exist in entries)
        const { entries: currentEntries, unsyncedEntries: currentUnsynced } = get();
        const validEntryIds = new Set(currentEntries.map((e) => e.id));
        const cleanedUnsyncedEntries = currentUnsynced.filter((id) => validEntryIds.has(id));
        
        if (cleanedUnsyncedEntries.length !== currentUnsynced.length) {
          console.log(`🧹 Cleaned up ${currentUnsynced.length - cleanedUnsyncedEntries.length} orphaned entry IDs`);
          set({ unsyncedEntries: cleanedUnsyncedEntries });
        }

        console.log("🎉 Sync complete!");
        set({ isSyncing: false });
      },

      // Sync unsynced projects with server
      syncProjects: async () => {
        const { unsyncedProjects, projects, userId } = get();
        
        if (unsyncedProjects.length === 0) {
          console.log("✅ No unsynced projects to sync");
          return;
        }

        console.log(`🔄 Syncing ${unsyncedProjects.length} unsynced projects...`);
        set({ isSyncing: true });

        // Use cached user ID
        if (!userId) {
          console.error("❌ No user ID found for project sync. Please log in.");
          set({ isSyncing: false });
          return;
        }

        const projectsToSync = projects.filter((project) =>
          unsyncedProjects.includes(project.id)
        );

        console.log(`📤 Found ${projectsToSync.length} projects to sync`);

        for (const project of projectsToSync) {
          try {
            // Ensure user_id is set
            const projectWithUser = { ...project, user_id: userId };
            
            // Try to upsert (insert or update)
            const { error } = await supabase
              .from("projects")
              .upsert(projectWithUser, { onConflict: "id" });

            if (!error) {
              console.log(`✅ Synced project: ${project.id}`);
              // Remove from unsynced list
              set((state) => ({
                unsyncedProjects: state.unsyncedProjects.filter(
                  (id) => id !== project.id
                ),
              }));
            } else {
              console.error(`❌ Failed to sync project ${project.id}:`, error);
            }
          } catch (error) {
            console.error(`❌ Failed to sync project ${project.id}:`, error);
          }
        }

        // Cleanup: Remove any orphaned IDs (IDs in unsyncedProjects that don't exist in projects)
        const { projects: currentProjects, unsyncedProjects: currentUnsyncedProjects } = get();
        const validProjectIds = new Set(currentProjects.map((p) => p.id));
        const cleanedUnsyncedProjects = currentUnsyncedProjects.filter((id) => validProjectIds.has(id));
        
        if (cleanedUnsyncedProjects.length !== currentUnsyncedProjects.length) {
          console.log(`🧹 Cleaned up ${currentUnsyncedProjects.length - cleanedUnsyncedProjects.length} orphaned project IDs`);
          set({ unsyncedProjects: cleanedUnsyncedProjects });
        }

        console.log("🎉 Project sync complete!");
        set({ isSyncing: false });
      },

      // Set online status
      setOnlineStatus: (status) => {
        set({ isOnline: status });
        
        // Trigger sync when coming back online
        if (status) {
          get().syncWithServer();
          get().syncProjects();
        }
      },

      // Set user ID (for offline use)
      setUserId: (userId) => {
        set({ userId });
      },
    }),
    {
      name: "timer-storage",
      partialize: (state) => ({
        activeTimer: state.activeTimer,
        entries: state.entries,
        projects: state.projects,
        unsyncedEntries: state.unsyncedEntries,
        unsyncedProjects: state.unsyncedProjects,
        userId: state.userId,
      }),
    }
  )
);
