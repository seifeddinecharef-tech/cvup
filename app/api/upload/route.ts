import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const supabase = getSupabaseServerClient();
    const file = formData.get("file") as File | null;
    const requestId = formData.get("requestId") as string | null;
    const folder = formData.get("folder") as string | null;

    if (!file || !requestId || !folder) {
      return NextResponse.json({ error: "Missing file or request info." }, { status: 400 });
    }

    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
    const storagePath = `${folder}${requestId}/${fileName}`;

    const { data, error } = await supabase.storage
      .from("cvup-requests")
      .upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "application/octet-stream",
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      path: data?.path,
      fullPath: data?.fullPath,
      publicUrl: data?.fullPath ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/cvup-requests/${data.fullPath}` : null,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}
