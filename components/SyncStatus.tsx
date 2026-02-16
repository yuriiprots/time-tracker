"use client";

import { useEffect, useState } from "react";
import { Wifi, WifiOff, Cloud, CloudOff, Loader2 } from "lucide-react";
import { useTimerStore } from "@/store/useTimerStore";

export function SyncStatus() {
  const { isOnline, isSyncing, unsyncedEntries, unsyncedProjects } = useTimerStore();
  const [showStatus, setShowStatus] = useState(false);

  const totalUnsynced = unsyncedEntries.length + unsyncedProjects.length;

  // Show status when offline, syncing, or when there are unsynced items
  useEffect(() => {
    setShowStatus(!isOnline || isSyncing || totalUnsynced > 0);
  }, [isOnline, isSyncing, totalUnsynced]);

  // Auto-hide after 3 seconds when everything is synced and online
  useEffect(() => {
    if (isOnline && !isSyncing && totalUnsynced === 0 && showStatus) {
      const timer = setTimeout(() => {
        setShowStatus(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, isSyncing, totalUnsynced, showStatus]);

  if (!showStatus) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg border transition-all ${
          !isOnline
            ? "bg-red-50 border-red-200 text-red-700"
            : isSyncing
            ? "bg-blue-50 border-blue-200 text-blue-700"
            : totalUnsynced > 0
            ? "bg-yellow-50 border-yellow-200 text-yellow-700"
            : "bg-green-50 border-green-200 text-green-700"
        }`}
      >
        {/* Icon */}
        {!isOnline ? (
          <WifiOff className="h-4 w-4" />
        ) : isSyncing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : totalUnsynced > 0 ? (
          <CloudOff className="h-4 w-4" />
        ) : (
          <Cloud className="h-4 w-4" />
        )}

        {/* Status Text */}
        <span className="text-sm font-medium">
          {!isOnline ? (
            "Offline"
          ) : isSyncing ? (
            "Syncing..."
          ) : totalUnsynced > 0 ? (
            `${totalUnsynced} item${totalUnsynced > 1 ? "s" : ""} pending`
          ) : (
            "All synced"
          )}
        </span>

        {/* Unsynced count badge */}
        {totalUnsynced > 0 && !isSyncing && (
          <span className="ml-1 px-2 py-0.5 bg-white rounded-full text-xs font-semibold">
            {totalUnsynced}
          </span>
        )}
      </div>
    </div>
  );
}
