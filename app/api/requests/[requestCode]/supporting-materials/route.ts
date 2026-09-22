import { NextResponse } from "next/server";
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
  const body = (await request.json()) as { materials?: SupportingMaterial[] };

  if (!Array.isArray(body.materials)) {
    return NextResponse.json({ error: "Invalid supporting materials payload." }, { status: 400 });
  }

  const cleaned = body.materials
    .filter((item) => item && typeof item.question_key === "string")
    .map((item) => ({
      question_key: item.question_key,
      link: typeof item.link === "string" && item.link.trim() ? item.link.trim() : null,
      file_path: typeof item.file_path === "string" && item.file_path ? item.file_path : null,
      file_name: typeof item.file_name === "string" && item.file_name ? item.file_name : null,
      file_type: typeof item.file_type === "string" && item.file_type ? item.file_type : null,
    }));

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("cv_requests")
    .update({ supporting_materials: cleaned })
    .eq("request_code", requestCode)
    .select("supporting_materials")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, supporting_materials: data.supporting_materials });
}
