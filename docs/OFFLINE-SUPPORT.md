# Offline Support Implementation

## Overview
The Time Tracker app now supports full offline functionality with automatic synchronization when the connection is restored.

## How It Works

### 1. **Local-First Architecture**
- All data is stored in **localStorage** using Zustand's persist middleware
- Operations work immediately without waiting for server responses
- Data persists across browser sessions

### 2. **Offline Detection**
The app monitors online/offline status:
```typescript
window.addEventListener("online", handleOnline);
window.addEventListener("offline", handleOffline);
```

### 3. **Unsynced Entries Tracking**
- When offline, entries are added to `unsyncedEntries` array
- When online, entries sync immediately
- If sync fails, entries remain in `unsyncedEntries` for later retry

### 4. **Automatic Sync on Reconnection**
When the app detects internet connection is restored:
```typescript
setOnlineStatus: (status) => {
  set({ isOnline: status });
  
  // Trigger sync when coming back online
  if (status) {
    get().syncWithServer();
  }
}
```

## User Experience

### **While Online:**
1. User creates entry/project
2. Data saves to localStorage immediately
3. Data syncs to Supabase automatically
4. Entry removed from `unsyncedEntries` on success

### **While Offline:**
1. User creates entry/project
2. Data saves to localStorage immediately
3. Entry added to `unsyncedEntries` list
4. User sees data instantly (no waiting)

### **When Connection Restored:**
1. App detects online status
2. `syncWithServer()` automatically runs
3. All `unsyncedEntries` sync to Supabase
4. Entries removed from `unsyncedEntries` on success

## Data Persistence

### **What's Persisted:**
- `activeTimer` - Current running timer
- `entries` - All time entries
- `projects` - All projects
- `unsyncedEntries` - IDs of entries not yet synced

### **Storage Location:**
- Browser localStorage under key: `timer-storage`

## Testing Offline Mode

### **Manual Test:**
1. Start the app with internet connected
2. Create a project
3. Start a timer
4. **Disconnect internet** (turn off WiFi or use DevTools)
5. Stop the timer
6. Verify entry appears in the list
7. **Reconnect internet**
8. Check browser console for sync messages
9. Verify data appears in Supabase dashboard

### **DevTools Test:**
1. Open Chrome DevTools (F12)
2. Go to **Network** tab
3. Check "Offline" checkbox
4. Perform actions (create entries, projects)
5. Uncheck "Offline"
6. Watch sync happen automatically

## Technical Details

### **Sync Function:**
```typescript
syncWithServer: async () => {
  const { unsyncedEntries, entries } = get();
  
  if (unsyncedEntries.length === 0) return;

  // Get authenticated user ID
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const entriesToSync = entries.filter((entry) =>
    unsyncedEntries.includes(entry.id)
  );

  for (const entry of entriesToSync) {
    // Ensure user_id is set
    const entryWithUser = { ...entry, user_id: user.id };
    
    // Upsert (insert or update)
    const { error } = await supabase
      .from("time_entries")
      .upsert(entryWithUser, { onConflict: "id" });

    if (!error) {
      // Remove from unsynced list
      set((state) => ({
        unsyncedEntries: state.unsyncedEntries.filter(
          (id) => id !== entry.id
        ),
      }));
    }
  }
}
```

### **Key Features:**
- ✅ Uses `upsert` to handle both new and updated entries
- ✅ Ensures `user_id` is set for RLS compliance
- ✅ Removes entries from sync queue only on success
- ✅ Handles errors gracefully (entries stay in queue)

## Limitations

### **Current Implementation:**
- No conflict resolution (last write wins)
- Sync is sequential (one entry at a time)
- No visual indicator for sync status

### **Future Enhancements:**
- Add sync status indicator in UI
- Implement conflict resolution
- Batch sync for better performance
- Retry logic with exponential backoff

## Troubleshooting

### **Data Not Syncing:**
1. Check browser console for errors
2. Verify internet connection
3. Check `unsyncedEntries` in localStorage
4. Manually trigger sync: `useTimerStore.getState().syncWithServer()`

### **Data Lost After Refresh:**
1. Check if localStorage is enabled
2. Verify browser isn't in incognito mode
3. Check storage quota (shouldn't be an issue for this app)

### **Duplicate Entries:**
1. This shouldn't happen with `upsert`
2. If it does, check that entry IDs are unique
3. Verify `onConflict: "id"` is working

## Security Considerations

- ✅ RLS policies ensure users only sync their own data
- ✅ User ID is verified before sync
- ✅ localStorage is domain-specific (can't be accessed by other sites)
- ⚠️ Data in localStorage is not encrypted (don't store sensitive info)
