import type { SupabaseClient } from "@supabase/supabase-js";

/** Un projet est débloqué si l'abo compte est actif, ou si un paiement one-shot
 * valide (non expiré) existe pour CE projet précis. */
export async function isProjectUnlocked(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
): Promise<boolean> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status")
    .eq("user_id", userId)
    .maybeSingle();
  if (profile?.subscription_status === "active") return true;

  const { data: payment } = await supabase
    .from("payments")
    .select("id")
    .eq("project_id", projectId)
    .eq("type", "one_shot")
    .eq("status", "active")
    .gt("unlocked_until", new Date().toISOString())
    .limit(1)
    .maybeSingle();
  return !!payment;
}

type GatedTable = "searches" | "problematiques";

/** 1 usage gratuit par projet sur Module 1 (searches) et Module 2 (problematiques).
 * Au-delà, le projet doit être débloqué (abo ou one-shot). */
export async function checkGate(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
  table: GatedTable,
): Promise<
  | { allowed: true; unlocked: boolean }
  | { allowed: false; unlocked: false; reason: "quota_exceeded" }
> {
  const unlocked = await isProjectUnlocked(supabase, userId, projectId);
  if (unlocked) return { allowed: true, unlocked: true };

  const { count } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);

  if ((count ?? 0) >= 1) return { allowed: false, unlocked: false, reason: "quota_exceeded" };
  return { allowed: true, unlocked: false };
}
