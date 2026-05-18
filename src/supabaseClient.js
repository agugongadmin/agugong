import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://kwdyajyjdyzlokwkkooq.supabase.co";

const supabaseAnonKey = "sb_publishable_3NZt0XX5wUvy4eo9z6fRCQ_ha16hmRn";

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);