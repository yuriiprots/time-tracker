"use client";

import { useEffect, useState } from "react";
import { Download, Calendar } from "lucide-react";
import { useTimerStore } from "@/store/useTimerStore";
import { Button } from "@/components/ui/Button";
import { formatDurationHuman, exportToCSV } from "@/lib/utils";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

type DateRange = "day" | "week" | "month";

export default function ReportsPage() {
  const { entries, projects, fetchAllEntries } = useTimerStore();
  const [dateRange, setDateRange] = useState<DateRange>("day");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Fetch all entries when component mounts
  useEffect(() => {
    fetchAllEntries();
  }, [fetchAllEntries]);

  const getDateRangeBounds = () => {
    switch (dateRange) {
      case "day":
        return {
          start: startOfDay(selectedDate),
          end: endOfDay(selectedDate),
        };
      case "week":
        return {
          start: startOfWeek(selectedDate, { weekStartsOn: 0 }),
          end: endOfWeek(selectedDate, { weekStartsOn: 0 }),
        };
      case "month":
        return {
          start: startOfMonth(selectedDate),
          end: endOfMonth(selectedDate),
        };
    }
  };

  const { start, end } = getDateRangeBounds();

  // Filter entries by date range
  const filteredEntries = entries.filter((entry) => {
    const entryDate = new Date(entry.start_time);
    return entryDate >= start && entryDate <= end;
  });

  // Calculate totals by project
  const projectTotals = filteredEntries.reduce((acc, entry) => {
    const projectId = entry.project_id || "no-project";
    const project = projects.find((p) => p.id === entry.project_id);

    if (!acc[projectId]) {
      acc[projectId] = {
        name: project?.name || "No Project",
        color: project?.color || "#9ca3af",
        duration: 0,
        count: 0,
      };
    }

    acc[projectId].duration += entry.duration || 0;
    acc[projectId].count += 1;

    return acc;
  }, {} as Record<string, { name: string; color: string; duration: number; count: number }>);

  // Sort and paginate project totals
  const sortedProjects = Object.entries(projectTotals).sort(
    ([, a], [, b]) => b.duration - a.duration
  );
  const totalPages = Math.ceil(sortedProjects.length / ITEMS_PER_PAGE);
  const paginatedProjects = sortedProjects.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const totalDuration = Object.values(projectTotals).reduce(
    (sum, project) => sum + project.duration,
    0
  );

  const handleExportCSV = () => {
    const csvData = filteredEntries.map((entry) => {
      const project = projects.find((p) => p.id === entry.project_id);
      return {
        Date: new Date(entry.start_time).toLocaleDateString(),
        Description: entry.description,
        Project: project?.name || "No Project",
        "Start Time": new Date(entry.start_time).toLocaleTimeString(),
        "End Time": entry.end_time
          ? new Date(entry.end_time).toLocaleTimeString()
          : "N/A",
        Duration: formatDurationHuman(entry.duration || 0),
      };
    });

    const filename = `time-tracker-report-${dateRange}-${selectedDate.toISOString().split("T")[0]}.csv`;
    exportToCSV(csvData, filename);
  };

  return (
    <div className="container mx-auto px-4 py-4 md:py-8 max-w-4xl pb-20 md:pb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Reports</h1>
        <Button onClick={handleExportCSV} variant="primary" disabled={filteredEntries.length === 0} className="w-full sm:w-auto">
          <Download className="h-5 w-5 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-border p-4 md:p-6 mb-6 md:mb-8">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-500" />
              <span className="font-semibold text-gray-900">Date Range</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 md:gap-4">
              <div className="flex p-1 bg-gray-100 rounded-lg">
                {(["day", "week", "month"] as DateRange[]).map((range) => (
                  <Button
                    key={range}
                    onClick={() => setDateRange(range)}
                    variant={dateRange === range ? "primary" : "ghost"}
                    size="sm"
                    className="flex-1 sm:flex-none capitalize"
                  >
                    {range}
                  </Button>
                ))}
              </div>

              <div className="h-6 w-px bg-gray-200 hidden sm:block" />

              <input
                type="date"
                value={selectedDate.toISOString().split("T")[0]}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                className="flex h-9 w-full sm:w-auto rounded-lg border border-border bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100">
            <p className="text-sm text-gray-600 text-center sm:text-right">
              <span className="font-medium text-gray-900">Period:</span> {start.toLocaleDateString()} - {end.toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-border p-4 md:p-6 mb-6 md:mb-8">
        <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Total Time</p>
            <p className="text-2xl md:text-3xl font-bold text-gray-900">
              {formatDurationHuman(totalDuration)}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Total Entries</p>
            <p className="text-2xl md:text-3xl font-bold text-gray-900">{filteredEntries.length}</p>
          </div>
        </div>
      </div>

      {/* Project Breakdown */}
      <div className="bg-white rounded-xl shadow-sm border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">By Project</h2>
          {sortedProjects.length > 0 && (
            <p className="text-sm text-gray-500">
              {sortedProjects.length} project{sortedProjects.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {Object.keys(projectTotals).length === 0 ? (
          <p className="text-gray-500 text-center py-8">No data for selected period</p>
        ) : (
          <>
            <div className="space-y-4">
              {paginatedProjects.map(([id, data]) => {
                const percentage = totalDuration > 0 ? (data.duration / totalDuration) * 100 : 0;

                return (
                  <div key={id} className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-1">
                      <div className="flex items-center gap-2 md:gap-3 min-w-0">
                        <div
                          className="w-3 h-3 md:w-4 md:h-4 rounded flex-shrink-0"
                          style={{ backgroundColor: data.color }}
                        />
                        <span className="font-medium text-gray-900 truncate">{data.name}</span>
                        <span className="text-xs md:text-sm text-gray-500 flex-shrink-0">({data.count} entries)</span>
                      </div>
                      <span className="font-semibold text-gray-900 ml-5 sm:ml-0">
                        {formatDurationHuman(data.duration)}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: data.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6 pt-6 border-t border-border">
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
          </>
        )}
      </div>
    </div>
  );
}
