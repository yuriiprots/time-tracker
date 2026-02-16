# Time Tracker

A modern time tracking web application built with Next.js, TypeScript, Tailwind CSS, and Supabase. Features offline support and real-time synchronization.

## Features

- ⏱️ **Active Timer**: Start/Stop timer with task description and project selection
- 📝 **Time Management**: View, edit, and delete time entries
- 📊 **Project Management**: Create and manage projects with custom colors
- 📈 **Reports**: View time summaries by day/week/month with CSV export
- 🔄 **Offline Support**: Continue tracking time offline with automatic sync when back online
- 💾 **Local Persistence**: Data persists in localStorage until synced with Supabase

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **State Management**: Zustand with persist middleware
- **Icons**: Lucide React
- **Date Utilities**: date-fns

## Project Structure

```
time-tracker/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout with navigation
│   ├── page.tsx           # Tracker page (home)
│   ├── projects/          # Projects management
│   └── reports/           # Reports and analytics
├── components/
│   ├── ui/                # Reusable UI components
│   └── layout/            # Layout components (Navbar)
├── lib/
│   ├── supabase.ts        # Supabase client
│   └── utils.ts           # Utility functions
├── store/
│   └── useTimerStore.ts   # Zustand store with offline sync
├── types/
│   └── index.ts           # TypeScript type definitions
└── supabase/
    └── migrations/        # Database migrations
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd time-tracker
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up Supabase**:
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to Project Settings → API
   - Copy your project URL and anon key

4. **Configure environment variables**:
   ```bash
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local` and add your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

5. **Run database migrations**:
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Copy and run the SQL from `supabase/migrations/0000_initial_schema.sql`

6. **Start the development server**:
   ```bash
   npm run dev
   ```

7. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### Tracking Time

1. Enter a task description in the input field
2. Optionally select a project
3. Click "Start" to begin tracking
4. Click "Stop" to save the entry

### Managing Projects

1. Navigate to the "Projects" page
2. Click "New Project" to create a project
3. Choose a name and color
4. Edit or delete projects as needed

### Viewing Reports

1. Navigate to the "Reports" page
2. Select a date range (Day/Week/Month)
3. View time breakdown by project
4. Export data to CSV

## Offline Support

The application automatically detects when you go offline and:
- Continues to track time locally
- Stores entries in localStorage
- Syncs with Supabase when connection is restored

## Architecture Decisions

### State Management
- **Zustand** for lightweight, performant state management
- **Persist middleware** for localStorage synchronization
- Custom sync logic for Supabase integration

### Database Design
- **Row Level Security (RLS)** for multi-user support
- **Indexed queries** for performance
- **Cascade delete** handling for project-entry relationships

### Offline Strategy
- Local-first approach with background sync
- Unsynced entries tracked separately
- Automatic retry on connection restore

## Building for Production

```bash
npm run build
npm start
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

## Future Enhancements

- [ ] User authentication (Supabase Auth)
- [ ] Audit log for manual time edits
- [ ] Advanced offline sync (conflict resolution)
- [ ] Mobile app (React Native)
- [ ] Team collaboration features
- [ ] Advanced analytics and charts

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
