# Time Tracker

A modern time tracking web application built with Next.js, TypeScript, Tailwind CSS, and Supabase. Features offline support and real-time synchronization.

## Features

- 📱 **Mobile-First Design**: Fully responsive UI with app-like bottom navigation on mobile devices
- 🔐 **Authentication**: Secure email/password authentication with Supabase Auth
- ⏱️ **Active Timer**: Start/Stop timer with task description and project selection
- 📝 **Time Management**: View, edit, and delete time entries
- 📊 **Project Management**: Create and manage projects with custom colors
- 📈 **Reports**: View time summaries by day/week/month with CSV export
- 🔄 **Offline Support**: Robust offline capability with background synchronization when online
- 💾 **Local Persistence**: Data persists in localStorage until synced with Supabase
- 🔒 **Data Privacy**: Row Level Security ensures users only see their own data
- ⚡ **Optimized Performance**: Client-side pagination, search, and efficient list rendering

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
   - Then run `supabase/migrations/0001_enable_rls.sql` to enable Row Level Security

6. **Enable Email Authentication** (Supabase Dashboard):
   - Navigate to Authentication → Providers
   - Ensure "Email" provider is enabled
   - Configure email templates if desired

7. **Start the development server**:
   ```bash
   npm run dev
   ```

8. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)
   
9. **Create your account**:
   - You'll be redirected to the login page
   - Click "Sign up" to create a new account
   - Use your email and password to register

## Usage

### Tracking Time
1. Enter a task description (Start button enables once text is entered)
2. Optionally select a project
3. Click "Start" to begin tracking
4. Click "Stop" to save the entry (auto-saves to local storage immediately)

### Managing Projects
1. Navigate to the "Projects" page (Folder icon on mobile)
2. Click "New Project" to create a project
3. Choose a name and color
4. Edit or delete projects as needed

### Viewing Reports
1. Navigate to the "Reports" page (Chart icon on mobile)
2. Select a date range (Day/Week/Month)
3. View time breakdown by project
4. Export data to CSV

> **Note**: On mobile devices, use the bottom navigation bar to switch between views. Tap the "Profile" icon to access account settings and Sign Out.

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

- [x] User authentication (Supabase Auth)
- [ ] Password reset functionality
- [ ] Audit log for manual time edits
- [ ] Advanced offline sync (conflict resolution)
- [ ] Mobile app (React Native)
- [ ] Team collaboration features
- [ ] Advanced analytics and charts

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
