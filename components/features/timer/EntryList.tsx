"use client";

import React, { useState } from "react";
import { Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatDurationHuman } from "@/lib/utils";
import { EditEntryForm } from "./EditEntryForm";
import type { TimeEntry, Project, GroupedEntries } from "@/types";

interface EntryListProps {
  groupedEntries: GroupedEntries[];
  projects: Project[];
  onUpdateEntry: (id: string, updates: Partial<TimeEntry>) => Promise<void>;
  onDeleteEntry: (id: string) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const EntryList: React.FC<EntryListProps> = ({
  groupedEntries,
  projects,
  onUpdateEntry,
  onDeleteEntry,
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);

  // Pagination logic needs to be handled by parent or here if passed full list
  // The prop says `groupedEntries` which presumably is the *paginated* list from parent.
  
  const handleSaveEdit = async (updates: Partial<TimeEntry>) => {
    if (editingId) {
      await onUpdateEntry(editingId, updates);
      setEditingId(null);
    }
  };

  if (groupedEntries.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-border p-8 text-center">
        <p className="text-gray-500">No entries yet. Start tracking your time!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groupedEntries.map((group, idx) => (
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
                  <EditEntryForm
                    entry={entry}
                    projects={projects}
                    onSave={handleSaveEdit}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 font-medium truncate text-sm md:text-base" title={entry.description}>
                        {entry.description}
                      </p>
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
                          onClick={() => setEditingId(entry.id)}
                          size="sm"
                          variant="ghost"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => onDeleteEntry(entry.id)}
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
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
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
                onClick={() => onPageChange(page)}
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
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            variant="ghost"
            size="sm"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};
