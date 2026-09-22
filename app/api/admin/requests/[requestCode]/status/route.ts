import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";

const workStatuses = new Set(["NEW", "IN_PROGRESS", "READY", "DELIVERED", "CANCELLED"]);

export async function PATCH(request: Request, { params }: { params: Promise<{ requestCode: string }> }) {
  const { requestCode } = await params;
  const body = (await request.json()) as Record<string, unknown>;
  const status = typeof body.status === "string" ? body.status : "";

  if (!workStatuses.has(status)) {
    return NextResponse.json({ error: "Invalid work status." }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  const updatedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from("cv_requests")
    .update({ status, internal_status_updated_at: updatedAt })
    .eq("request_code", requestCode)
    .select("status, internal_status_updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, request: data });
}
