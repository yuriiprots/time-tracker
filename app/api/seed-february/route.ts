import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16",
  "#22c55e", "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9",
  "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#ec4899", "#f43f5e",
];

const USER_ID = "00000000-0000-0000-0000-000000000000";

export async function GET() {
  try {
    // 1. Generate 50 Projects
    const projectsToInsert = Array.from({ length: 50 }).map((_, i) => ({
      id: crypto.randomUUID(),
      name: `Project ${i + 1} - ${["Marketing", "Development", "Design", "Research", "Sales"][i % 5]}`,
      color: PRESET_COLORS[i % PRESET_COLORS.length],
      user_id: USER_ID,
      created_at: new Date().toISOString(),
    }));

    const { data: projects, error: pError } = await supabase
      .from("projects")
      .insert(projectsToInsert)
      .select();

    if (pError) throw pError;

    // 2. Generate 200 Time Entries spread across February 2026
    const projectIds = projects.map(p => p.id);
    const descriptions = [
      "Reviewing documentation", "Fixing bugs", "Meeting with team",
      "Drafting proposal", "UI development", "Code review",
      "Database optimization", "Client call", "Testing features",
      "Writing tests", "Deployment", "Planning sprint"
    ];

    const entriesToInsert = [];
    const daysInFebruary = 28; // February 2026 has 28 days

    for (let i = 0; i < 200; i++) {
      // Spread entries across different days in February 2026
      const dayOfMonth = (i % daysInFebruary) + 1;
      const startTime = new Date(2026, 1, dayOfMonth); // Month is 0-indexed, so 1 = February
      
      // Random hour between 8 AM and 6 PM
      startTime.setHours(8 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60));
      
      // Random duration between 15 minutes and 4 hours (but ensure daily total doesn't exceed 24h)
      const durationMinutes = 15 + Math.floor(Math.random() * 225); // 15 min to 4 hours
      const duration = durationMinutes * 60; // Convert to seconds
      
      const endTime = new Date(startTime.getTime() + duration * 1000);

      entriesToInsert.push({
        id: crypto.randomUUID(),
        project_id: projectIds[i % projectIds.length],
        description: `${descriptions[i % descriptions.length]} - Task ${i + 1}`,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        duration,
        user_id: USER_ID,
        created_at: new Date().toISOString(),
      });
    }

    const { error: eError } = await supabase
      .from("time_entries")
      .insert(entriesToInsert);

    if (eError) throw eError;

    return NextResponse.json({ 
      message: "Successfully seeded mock data across February 2026!",
      projectsCreated: projectsToInsert.length,
      entriesCreated: entriesToInsert.length,
      dateRange: "February 1-28, 2026"
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
