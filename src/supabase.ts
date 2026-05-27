import { createClient } from "@supabase/supabase-js";

// Same credentials as main app
export const projectId = "djjfkxmuevlzuaiocpbz";
export const publicAnonKey = "sb_publishable_OGH8ozcNkvKoiGUQVlCkZg_a0_g8Bpd";

export const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);
