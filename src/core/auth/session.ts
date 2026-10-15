import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { createServerSupabaseClient } from "@/core/db/supabase/server";

export const verifySession = cache(async () => {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/login");
  }

  return {
    userId: data.user.id,
    email: data.user.email ?? null,
  };
});
