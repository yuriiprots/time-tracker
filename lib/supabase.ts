import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          name: string;
          color: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          color: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          color?: string;
          user_id?: string;
          created_at?: string;
        };
      };
      time_entries: {
        Row: {
          id: string;
          project_id: string | null;
          description: string;
          start_time: string;
          end_time: string | null;
          duration: number | null;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id?: string | null;
          description: string;
          start_time: string;
          end_time?: string | null;
          duration?: number | null;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string | null;
          description?: string;
          start_time?: string;
          end_time?: string | null;
          duration?: number | null;
          user_id?: string;
          created_at?: string;
        };
      };
    };
  };
};
