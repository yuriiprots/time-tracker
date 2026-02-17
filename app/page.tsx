"use client";

import { useEffect, useState, useMemo } from "react";
import { useTimerStore } from "@/store/useTimerStore";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ActiveTimer } from "@/components/features/timer/ActiveTimer";
import { EntryList } from "@/components/features/timer/EntryList";
import { EntryListSkeleton } from "@/components/features/timer/EntryListSkeleton";
import { useActiveTimer } from "@/hooks/useActiveTimer";
import { useDailyEntries } from "@/hooks/useDailyEntries";
import { ENTRIES_PER_PAGE, MAX_DAILY_SECONDS } from "@/lib/constants";

export default function TrackerPage() {
  const {
    activeTimer,
    entries,
    projects,
    startTimer,
    stopTimer,
    updateEntry,
    deleteEntry,
    fetchProjects,
    fetchTodayEntries,
    setOnlineStatus,
    syncWithServer,
    syncProjects,
    isLoading,
  } = useTimerStore();

  const [description, setDescription] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    entryId: string | null;
  }>({ isOpen: false, entryId: null });

  // Custom Hooks
  const { elapsedTime } = useActiveTimer(activeTimer);
  const { todayEntries, groupedEntries, totalDailyDuration } = useDailyEntries(entries, projects);

  // Pagination
  const totalPages = Math.ceil(groupedEntries.length / ENTRIES_PER_PAGE);
  const paginatedGroups = groupedEntries.slice(
    (currentPage - 1) * ENTRIES_PER_PAGE,
    currentPage * ENTRIES_PER_PAGE
  );

  // Suggestions
  const taskSuggestions = useMemo(() => {
    const descriptions = todayEntries.map((entry) => entry.description);
    const unique = Array.from(new Set(descriptions));
    return unique.slice(0, 20);
  }, [todayEntries]);

  // Effects
  useEffect(() => {
    fetchProjects();
    fetchTodayEntries();

    if (navigator.onLine) {
      syncWithServer();
      syncProjects();
    }

    const handleOnline = () => setOnlineStatus(true);
    const handleOffline = () => setOnlineStatus(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [fetchProjects, fetchTodayEntries, setOnlineStatus, syncWithServer, syncProjects]);

  // Handlers
  const handleStartStop = () => {
    if (activeTimer) {
      stopTimer();
      setDescription("");
      setSelectedProjectId("");
    } else {
      if (!description.trim()) return;
      startTimer(description, selectedProjectId || null);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteConfirm({ isOpen: true, entryId: id });
  };

  const confirmDelete = async () => {
    if (deleteConfirm.entryId) {
      await deleteEntry(deleteConfirm.entryId);
      setDeleteConfirm({ isOpen: false, entryId: null });
    }
  };

  // Daily Stats Logic
  const hours = Math.floor(totalDailyDuration / 3600);
  const minutes = Math.floor((totalDailyDuration % 3600) / 60);
  const percentage = (totalDailyDuration / MAX_DAILY_SECONDS) * 100;
  
  let statsColorClass = "text-gray-700";
  let badgeColorClass = "bg-yellow-100 text-yellow-700";
  
  if (percentage >= 100) {
    statsColorClass = "text-red-600";
    badgeColorClass = "bg-red-100 text-red-700";
  } else if (percentage >= 90) {
    statsColorClass = "text-orange-600";
    badgeColorClass = "bg-orange-100 text-orange-700";
  }

  return (
    <div className="container mx-auto px-4 py-4 md:py-8 max-w-4xl pb-20 md:pb-8">
      <ActiveTimer
        activeTimer={activeTimer}
        description={description}
        onDescriptionChange={setDescription}
        selectedProjectId={selectedProjectId}
        onProjectChange={setSelectedProjectId}
        projects={projects}
        elapsedTime={elapsedTime}
        onStartStop={handleStartStop}
        taskSuggestions={taskSuggestions}
      />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Today</h1>
          {groupedEntries.length > 0 && (
            <div className="flex items-center gap-3">
              <p className="text-sm text-gray-500">
                {groupedEntries.length} project{groupedEntries.length !== 1 ? 's' : ''} • {todayEntries.length} entr{todayEntries.length !== 1 ? 'ies' : 'y'} • <span className={`font-semibold ${statsColorClass}`}>{hours}h {minutes}m tracked</span>
              </p>
              {percentage >= 75 && (
                <span className={`text-xs px-2 py-1 rounded-full ${badgeColorClass}`}>
                  {percentage >= 100 ? "24h limit reached" : `${Math.round(percentage)}% of daily limit`}
                </span>
              )}
            </div>
          )}
        </div>

        {isLoading ? (
          <EntryListSkeleton />
        ) : (
          <EntryList
            groupedEntries={paginatedGroups}
            projects={projects}
            onUpdateEntry={updateEntry}
            onDeleteEntry={handleDeleteClick}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, entryId: null })}
        onConfirm={confirmDelete}
        title="Delete Time Entry"
        message="Are you sure you want to delete this time entry? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
