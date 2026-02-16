# Project Plan: Time Tracker Web App (UPDATED)

**Goal**: Build a Time Tracker web application using Next.js, Tailwind CSS, and Supabase with offline support.

## User Review Required

> [!IMPORTANT]
> **Offline Support Strategy**:
> Since Supabase is the primary database, we will use a local-first strategy:
> 1.  **State Management**: Zustand with `persist` middleware (localStorage) to store active timer and unsynced entries.
> 2.  **Sync Logic**: A background sync mechanism (or hook) that pushes local changes to Supabase when online.
> 3.  **Limitations**: Only basic offline support (tracking time, viewing cached projects/tasks). Full history sync might require more complex logic (e.g., RxDB), but we will stick to custom sync for simplicity as requested.

## Completed Work

### 1. Setup & Configuration
- [x] Create Next.js app with TypeScript and Tailwind.
- [x] Configure Tailwind with custom colors and fonts.
- [x] Set up Supabase Client and Environment Variables.
- [x] **Fix**: Dependencies (`autoprefixer`) and CSS build errors.

### 2. Database Layer (Supabase)
- [x] Define SQL Schema (`projects`, `time_entries`).
- [x] Enable RLS (and temporarily disable for dev verification).
- [x] **Fix**: Update store to use valid UUID for `user_id`.

### 3. State Management & Logic (Zustand)
- [x] Implement `useTimerStore` with persistence.
- [x] Implement CRUD actions for Timer, Entries, and Projects.
- [x] Implement Offline Sync logic.

### 4. UI Components
- [x] Create reusable Button, Input, Select.
- [x] Create Navbar.

### 5. Features
- [x] **Tracker Page**: Active Timer, Entry List, Edit/Delete.
- [x] **Projects Page**: Create/Edit Projects with Color Picker.
- [x] **Reports Page**: Summary Stats, Charts (Progress Bar), CSV Export.

## Task Breakdown

### Phase 1: Foundation (COMPLETED)
- [x] Initialize Next.js app with TypeScript and Tailwind.
- [x] Configure Supabase project and apply migrations.
- [x] Implement Authentication (Supabase Auth - Skipped, treating as anon/temp for now).
- [x] Create basic UI components (Button, Input, Layout).

### Phase 2: Core Logic (Timer) (COMPLETED)
- [x] Implement `useTimerStore` with persistence.
- [x] Build Active Timer component (Start/Stop).
- [x] Implement Auto-complete for task names.
- [x] Build Project selection (with color dots).

### Phase 3: Time Management (COMPLETED)
- [x] Build Daily List view (grouped by Project).
- [x] Implement Edit Entry (Description, Project, Manual Time).
- [x] Implement Delete Entry (with confirmation).
- [x] Implement Sync logic (Local -> Supabase).

### Phase 4: Project Management (COMPLETED)
- [x] Build Projects page (List view).
- [x] Implement Create/Edit Project (Name, Color).
- [x] Ensure Project deletion handles linked entries.

### Phase 5: Reports & Polish (COMPLETED)
- [x] Build Reports page (Summary view).
- [x] Implement CSV Export.
- [x] Optimize for Mobile (Responsive design).
- [x] Final UI Polish.

### Phase 6: Scalability & UX Enhancements (COMPLETED)
- [x] **Project Selection**: Replace native `<select>` with a searchable `Combobox` for better handling of many projects.
- [x] **Projects Page**: Implement Search Bar and Client-side Pagination (20 items/page).
- [x] **Time Entries**: Optimized list rendering (entries are grouped and rendered efficiently).
- [x] **Autocomplete**: Limited suggestions to top 20 matches for performance.

### Phase 7: Authentication & Authorization (COMPLETED)
- [x] **Auth Pages**: Create Login and Register pages with Supabase Auth (Email/Password).
- [x] **Middleware**: Protect application routes (`/`, `/projects`, `/reports`) to require authentication.
- [x] **Integration**: Update `useTimerStore` and API calls to use the authenticated user's ID instead of hardcoded ID.
- [x] **RLS Policies**: Configure Row Level Security in Supabase to restrict data access to the data owner only.
- [x] **Navbar**: Add user profile summary (email) and Sign Out button.

### Phase 8: UX & Stability Enhancements (COMPLETED)
- [x] **Visual Sync Indicator**: Added real-time status component (Offline/Syncing/Synced) in the UI.
- [x] **Data Integrity**: Implemented auto-cleanup for orphaned unsynced entries/projects to ensure accurate pending counts.
- [x] **UI Polish**: Replaced native browser alerts with custom, animated `ConfirmDialog` modals for delete actions.
- [x] **UX Logic**: Fixed layout shift issues by compensating for scrollbar width when modals open.
- [x] **Demo Logic**: Implemented 'Demo Login' feature for instant test account access.
- [x] **Code Quality**: Refactored `useTimerStore` to remove duplicate logic and improve type safety.

### Phase 9: Verification & Handover
- [x] Verify Supabase Connectivity.
- [x] Verify Offline Sync.
- [x] Final Code Review.
- [ ] Update Documentation.

## Verification Plan

### Manual Verification (Completed)
1.  **Timer Flow**: Start timer -> Refresh page -> Stop timer. (Pass)
2.  **Offline Test**: Disconnect network -> Start/Stop timer -> Reconnect -> Check Supabase. (Pass)
3.  **Reports**: Create entries -> Verify totals -> Export CSV. (Pass)
4.  **UX Flows**: Delete entry/project (Modal) -> Check Sync Status indicator. (Pass)
5.  **Demo Access**: Click 'Demo Account' -> Verify login -> Verify User Menu closed on load. (Pass)
