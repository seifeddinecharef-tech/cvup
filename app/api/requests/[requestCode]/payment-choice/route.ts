import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseServerClient } from "@/lib/supabase";

const methods = new Set(["SOFIZPAY", "BARIDIMOB_MANUAL"]);

export async function PATCH(request: Request, { params }: { params: Promise<{ requestCode: string }> }) {
  const { requestCode } = await params;
  const body = (await request.json()) as { payment_method?: string };
  const paymentMethod = typeof body.payment_method === "string" ? body.payment_method : "";
  if (!methods.has(paymentMethod)) {
    return NextResponse.json({ error: "Invalid payment method." }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!supabaseUrl || !publishableKey) {
    return NextResponse.json({ error: "Authentication is not configured." }, { status: 503 });
  }

  const cookieStore = await cookies();
  const authClient = createServerClient(supabaseUrl, publishableKey, {
    cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} },
  });
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const admin = getSupabaseServerClient();
  const { data: existing } = await admin
    .from("cv_requests")
    .select("id,user_id,payment_status")
    .eq("request_code", requestCode)
    .maybeSingle();

  if (!existing || existing.user_id !== user.id) {
    return NextResponse.json({ error: "Request not found." }, { status: 404 });
  }
  if (existing.payment_status === "PAID") {
    return NextResponse.json({ success: true, payment_status: "PAID" });
  }

  const { error } = await admin
    .from("cv_requests")
    .update({ payment_method: paymentMethod, payment_status: "PENDING" })
    .eq("id", existing.id);

  if (error) return NextResponse.json({ error: "Could not save payment method." }, { status: 500 });
  return NextResponse.json({ success: true, payment_status: "PENDING", payment_method: paymentMethod });
}
