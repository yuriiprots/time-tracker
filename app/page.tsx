"use client";

import { useEffect, useState, useMemo } from "react";
import { Play, Pause, Edit2, Trash2, Check, X } from "lucide-react";
import { useTimerStore } from "@/store/useTimerStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Autocomplete } from "@/components/ui/Autocomplete";
import { Combobox } from "@/components/ui/Combobox";
import { Select } from "@/components/ui/Select";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { formatDuration, formatDurationHuman, formatDurationForEdit, parseTimeToSeconds } from "@/lib/utils";
import type { TimeEntry, GroupedEntries } from "@/types";

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
  } = useTimerStore();

  const [description, setDescription] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<TimeEntry>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    entryId: string | null;
  }>({ isOpen: false, entryId: null });
  const ENTRIES_PER_PAGE = 20;

  // Update elapsed time for active timer
  useEffect(() => {
    if (!activeTimer) {
      setElapsedTime(0);
      return;
    }

    // Calculate initial elapsed time immediately
    const calculateElapsed = () => {
      return Math.floor(
        (Date.now() - new Date(activeTimer.start_time).getTime()) / 1000
      );
    };

    // Set initial value immediately to avoid showing zeros
    setElapsedTime(calculateElapsed());

    // Then update every second
    const interval = setInterval(() => {
      setElapsedTime(calculateElapsed());
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimer]);

  // Fetch data on mount
  useEffect(() => {
    fetchProjects();
    fetchTodayEntries();

    // Trigger sync if online and there are unsynced entries/projects
    if (navigator.onLine) {
      syncWithServer();
      syncProjects();
    }

    // Monitor online status
    const handleOnline = () => setOnlineStatus(true);
    const handleOffline = () => setOnlineStatus(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [fetchProjects, fetchTodayEntries, setOnlineStatus, syncWithServer, syncProjects]);

  const handleStartStop = () => {
    if (activeTimer) {
      stopTimer();
      setDescription("");
      setSelectedProjectId("");
    } else {
      if (!description.trim()) {
        return;
      }
      startTimer(description, selectedProjectId || null);
    }
  };

  const handleEdit = (entry: TimeEntry) => {
    setEditingId(entry.id);
    setEditForm({
      description: entry.description,
      project_id: entry.project_id,
      duration: entry.duration || 0,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;

    await updateEntry(editingId, editForm);
    setEditingId(null);
    setEditForm({});
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleDelete = (id: string) => {
    setDeleteConfirm({ isOpen: true, entryId: id });
  };

  const confirmDelete = async () => {
    if (deleteConfirm.entryId) {
      await deleteEntry(deleteConfirm.entryId);
    }
  };

  // Filter entries to show only TODAY's entries (prevent flash when coming from Reports page)
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
  const groupedEntries: GroupedEntries[] = todayEntries.reduce((acc, entry) => {
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

  // Paginate grouped entries
  const totalPages = Math.ceil(groupedEntries.length / ENTRIES_PER_PAGE);
  const paginatedGroups = groupedEntries.slice(
    (currentPage - 1) * ENTRIES_PER_PAGE,
    currentPage * ENTRIES_PER_PAGE
  );

  // Get unique task descriptions for autocomplete (limit to 20 most recent)
  const taskSuggestions = useMemo(() => {
    const descriptions = todayEntries.map((entry) => entry.description);
    const unique = Array.from(new Set(descriptions));
    return unique.slice(0, 20); // Limit to 20 suggestions
  }, [todayEntries]);

  return (
    <div className="container mx-auto px-4 py-4 md:py-8 max-w-4xl pb-20 md:pb-8">
      {/* Active Timer Section - Sticky when scrolling */}
      <div className={`bg-white rounded-xl shadow-sm border border-border p-4 md:p-6 mb-6 md:mb-8 transition-all ${
        activeTimer ? 'sticky top-20 z-10 shadow-lg' : ''
      }`}>
        <div className="flex flex-col gap-3 md:gap-4 mb-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4">
            <div className="flex-1">
              <Autocomplete
                placeholder="What are you working on?"
                value={activeTimer?.description || description}
                onValueChange={setDescription}
                suggestions={taskSuggestions}
                disabled={!!activeTimer}
                maxLength={200}
                className="text-base md:text-lg"
              />
              {!activeTimer && (
                <p className={`text-xs mt-1 ${
                  description.length >= 200 
                    ? "text-red-600 font-semibold" 
                    : description.length >= 180 
                    ? "text-orange-600" 
                    : "text-gray-500"
                }`}>
                  {description.length}/200 characters
                  {description.length >= 200 && " (maximum reached)"}
                </p>
              )}
            </div>
            <Combobox
              options={[
                { value: "", label: "No Project" },
                ...projects.map((p) => ({
                  value: p.id,
                  label: p.name,
                  color: p.color,
                })),
              ]}
              value={activeTimer?.project_id || selectedProjectId}
              onValueChange={setSelectedProjectId}
              disabled={!!activeTimer}
              placeholder="Select project"
              className="w-full sm:w-64"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-2xl md:text-3xl font-mono font-bold text-gray-900 w-full sm:w-auto text-center sm:text-left">
            {formatDuration(elapsedTime)}
          </div>
          <Button
            onClick={handleStartStop}
            variant={activeTimer ? "danger" : "primary"}
            size="lg"
            className="w-full sm:w-auto sm:min-w-32"
            disabled={!activeTimer && !description.trim()}
          >
            {activeTimer ? (
              <>
                <Pause className="h-5 w-5 mr-2" />
                Stop
              </>
            ) : (
              <>
                <Play className="h-5 w-5 mr-2" />
                Start
              </>
            )}
          </Button>
        </div>
        
        {/* Active timer indicator */}
        {activeTimer && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-gray-600">Timer running</span>
              {activeTimer.project_id && (() => {
                const project = projects.find(p => p.id === activeTimer.project_id);
                return project ? (
                  <div className="flex items-center gap-2 ml-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: project.color }}
                    />
                    <span className="text-gray-700 font-medium">{project.name}</span>
                  </div>
                ) : null;
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Today's Entries */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Today</h2>
          {groupedEntries.length > 0 && (() => {
            const totalDuration = todayEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
            const hours = Math.floor(totalDuration / 3600);
            const minutes = Math.floor((totalDuration % 3600) / 60);
            const percentage = (totalDuration / 86400) * 100; // Percentage of 24 hours
            
            // Determine color based on percentage
            let colorClass = "text-gray-700";
            if (percentage >= 100) {
              colorClass = "text-red-600";
            } else if (percentage >= 90) {
              colorClass = "text-orange-600";
            } else if (percentage >= 75) {
              colorClass = "text-yellow-600";
            }
            
            return (
              <div className="flex items-center gap-3">
                <p className="text-sm text-gray-500">
                  {groupedEntries.length} project{groupedEntries.length !== 1 ? 's' : ''} • {todayEntries.length} entr{todayEntries.length !== 1 ? 'ies' : 'y'} • <span className={`font-semibold ${colorClass}`}>{hours}h {minutes}m tracked</span>
                </p>
                {percentage >= 75 && (
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    percentage >= 100 
                      ? "bg-red-100 text-red-700" 
                      : percentage >= 90 
                      ? "bg-orange-100 text-orange-700" 
                      : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {percentage >= 100 ? "24h limit reached" : `${Math.round(percentage)}% of daily limit`}
                  </span>
                )}
              </div>
            );
          })()}
        </div>

        {groupedEntries.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-border p-8 text-center">
            <p className="text-gray-500">No entries yet. Start tracking your time!</p>
          </div>
        ) : (
          paginatedGroups.map((group, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
              {/* Project Header */}
              <div className="bg-gray-50 px-6 py-3 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {group.project && (
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: group.project.color }}
                    />
                  )}
                  <span className="font-semibold text-gray-900 truncate" title={group.project?.name || "No Project"}>
                    {group.project?.name || "No Project"}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-600">
                  {formatDurationHuman(group.totalDuration)}
                </span>
              </div>

              {/* Entries */}
              <div className="divide-y divide-border">
                {group.entries.map((entry) => (
                  <div key={entry.id} className="px-4 md:px-6 py-3 md:py-4">
                    {editingId === entry.id ? (
                      <div className="space-y-3">
                        <div>
                          <Input
                            value={editForm.description}
                            onChange={(e) =>
                              setEditForm({ ...editForm, description: e.target.value })
                            }
                            placeholder="Description"
                            maxLength={200}
                          />
                          <p className={`text-xs mt-1 ${
                            (editForm.description?.length || 0) >= 200 
                              ? "text-red-600 font-semibold" 
                              : (editForm.description?.length || 0) >= 180 
                              ? "text-orange-600" 
                              : "text-gray-500"
                          }`}>
                            {editForm.description?.length || 0}/200 characters
                            {(editForm.description?.length || 0) >= 200 && " (maximum reached)"}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Combobox
                            options={[
                              { value: "", label: "No Project" },
                              ...projects.map((p) => ({
                                value: p.id,
                                label: p.name,
                                color: p.color,
                              })),
                            ]}
                            value={editForm.project_id || ""}
                            onValueChange={(value) =>
                              setEditForm({ ...editForm, project_id: value || null })
                            }
                            placeholder="Select project"
                            className="flex-1"
                          />
                          <Input
                            value={formatDurationForEdit(editForm.duration || 0)}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                duration: parseTimeToSeconds(e.target.value),
                              })
                            }
                            placeholder="HH:MM"
                            className="w-28"
                          />
                          <Button onClick={handleSaveEdit} size="sm" variant="primary">
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button onClick={handleCancelEdit} size="sm" variant="ghost">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-900 font-medium truncate text-sm md:text-base" title={entry.description}>{entry.description}</p>
                          <p className="text-xs md:text-sm text-gray-500">
                            {new Date(entry.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{" "}
                            {entry.end_time
                              ? new Date(entry.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : "Running"}
                          </p>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-2 md:gap-3">
                          <span className="text-base md:text-lg font-semibold text-gray-900">
                            {formatDurationHuman(entry.duration || 0)}
                          </span>
                          <div className="flex items-center gap-1">
                            <Button
                              onClick={() => handleEdit(entry)}
                              size="sm"
                              variant="ghost"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => handleDelete(entry.id)}
                              size="sm"
                              variant="ghost"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              variant="ghost"
              size="sm"
            >
              Previous
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded-md text-sm transition-colors ${
                    currentPage === page
                      ? "bg-primary-600 text-white"
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <Button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              variant="ghost"
              size="sm"
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
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
