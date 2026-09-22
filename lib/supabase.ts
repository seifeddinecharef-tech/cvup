import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function normalizeEnvValue(value: string | undefined) {
  return value?.replace(/^\uFEFF/, "").trim();
}

export function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = normalizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const publishableKey = normalizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

  if (!supabaseUrl || !publishableKey) {
    throw new Error(
      "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
    );
  }

  console.log(
    JSON.stringify({
      supabaseUrl,
      keyType: "publishable",
      keyLength: publishableKey.length,
      keyPrefix: publishableKey.slice(0, 6),
    })
  );

  return createClient(supabaseUrl, publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export function getSupabaseServerClient(): SupabaseClient {
  const supabaseUrl = normalizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const serviceRoleKey = normalizeEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase server environment variables. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }

  console.log(
    JSON.stringify({
      supabaseUrl,
      keyType: "service_role",
      keyLength: serviceRoleKey.length,
      keyPrefix: serviceRoleKey.slice(0, 6),
    })
  );

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export const getRequestFolderPath = (requestId: string, type: string) =>
  `cvup-requests/${requestId}/${type}/`;
