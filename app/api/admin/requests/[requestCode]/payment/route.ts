import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";

const paymentStatuses = new Set(["PENDING", "PAID", "NOT_REQUIRED", "REFUNDED"]);

export async function PATCH(request: Request, { params }: { params: Promise<{ requestCode: string }> }) {
  const { requestCode } = await params;
  const body = (await request.json()) as Record<string, unknown>;
  const paymentStatus = typeof body.payment_status === "string" ? body.payment_status : "";
  if (!paymentStatuses.has(paymentStatus)) return NextResponse.json({ error: "Invalid payment status." }, { status: 400 });

  const supabase = getSupabaseServerClient();
  const { data: existing, error: existingError } = await supabase.from("cv_requests").select("paid_at").eq("request_code", requestCode).maybeSingle();
  if (existingError || !existing) return NextResponse.json({ error: existingError?.message || "Request not found." }, { status: 404 });
  const requestedPaidAt = typeof body.paid_at === "string" && body.paid_at ? new Date(body.paid_at).toISOString() : null;
  const hasExplicitPaidAt = Object.prototype.hasOwnProperty.call(body, "paid_at");
  const update = {
    payment_status: paymentStatus,
    payment_method: typeof body.payment_method === "string" ? body.payment_method : null,
    payment_reference: typeof body.payment_reference === "string" ? body.payment_reference : null,
    payment_notes: typeof body.payment_notes === "string" ? body.payment_notes : null,
    paid_at: paymentStatus === "PAID" && !requestedPaidAt ? existing.paid_at || new Date().toISOString() : hasExplicitPaidAt ? requestedPaidAt : existing.paid_at,
  };
  const { data, error } = await supabase.from("cv_requests").update(update).eq("request_code", requestCode).select("payment_status, payment_method, payment_reference, payment_notes, paid_at").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, payment: data });
}