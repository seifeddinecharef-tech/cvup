import { NextResponse } from "next/server";
import { verifyRequestSubmissionToken } from "@/lib/request-submission-token";
import { getSupabaseServerClient } from "@/lib/supabase";

type SupportingMaterial = {
  question_key: string;
  link?: string | null;
  file_path?: string | null;
  file_name?: string | null;
  file_type?: string | null;
};

export async function PATCH(request: Request, { params }: { params: Promise<{ requestCode: string }> }) {
  const { requestCode } = await params;
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  const verified = await verifyRequestSubmissionToken(token);

  if (!verified || verified.requestCode !== requestCode) {
    return NextResponse.json({ error: "Invalid or expired request token." }, { status: 401 });
  }

  const body = (await request.json()) as { materials?: SupportingMaterial[] };

  if (!Array.isArray(body.materials)) {
    return NextResponse.json({ error: "Invalid supporting materials payload." }, { status: 400 });
  }

  const cleaned = body.materials
    .filter((item) => item && typeof item.question_key === "string")
    .slice(0, 20)
    .map((item) => ({
      question_key: item.question_key.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80),
      link: typeof item.link === "string" && item.link.trim() ? item.link.trim().slice(0, 2000) : null,
      file_path: typeof item.file_path === "string" && item.file_path ? item.file_path.slice(0, 1000) : null,
      file_name: typeof item.file_name === "string" && item.file_name ? item.file_name.slice(0, 255) : null,
      file_type: typeof item.file_type === "string" && item.file_type ? item.file_type.slice(0, 150) : null,
    }))
    .filter((item) => item.question_key);

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("cv_requests")
    .update({ supporting_materials: cleaned })
    .eq("id", verified.requestId)
    .eq("request_code", requestCode)
    .select("supporting_materials")
    .single();

  if (error) {
    return NextResponse.json({ error: "Supporting materials could not be saved." }, { status: 500 });
  }

  return NextResponse.json({ success: true, supporting_materials: data.supporting_materials });
}
