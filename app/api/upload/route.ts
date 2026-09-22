import { NextResponse } from "next/server";
import { verifyRequestSubmissionToken } from "@/lib/request-submission-token";
import { getSupabaseServerClient } from "@/lib/supabase";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const allowedMimeTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const primaryFileFields = {
  current_cv: {
    path: "current_cv_file_path",
    name: "current_cv_file_name",
    type: "current_cv_file_type",
  },
  job_description: {
    path: "job_description_file_path",
    name: "job_description_file_name",
    type: "job_description_file_type",
  },
  certifications: {
    path: "certifications_file_path",
    name: "certifications_file_name",
    type: "certifications_file_type",
  },
  template: {
    path: "cv_template_file_path",
    name: "cv_template_file_name",
    type: "cv_template_file_type",
  },
} as const;

type PrimaryKind = keyof typeof primaryFileFields;

function safeFileName(value: string) {
  return value
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 140) || "file";
}

function safeKindSegment(kind: string) {
  return kind.replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 80);
}

function resolveMimeType(file: File) {
  if (file.type && allowedMimeTypes.has(file.type)) return file.type;

  const extension = file.name.toLowerCase().split(".").pop();
  const byExtension: Record<string, string> = {
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    txt: "text/plain",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
  };

  return extension ? byExtension[extension] || null : null;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const requestId = String(formData.get("requestId") || "");
    const kind = String(formData.get("kind") || "");
    const token = String(formData.get("token") || "");

    if (!(file instanceof File) || !requestId || !kind || !token) {
      return NextResponse.json({ error: "Missing file or request information." }, { status: 400 });
    }

    const verified = await verifyRequestSubmissionToken(token);
    if (!verified || verified.requestId !== requestId) {
      return NextResponse.json({ error: "Invalid or expired upload token." }, { status: 401 });
    }

    if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File must be between 1 byte and 10 MB." }, { status: 400 });
    }

    const contentType = resolveMimeType(file);
    if (!contentType) {
      return NextResponse.json({ error: "Unsupported file type." }, { status: 400 });
    }

    const isPrimary = kind in primaryFileFields;
    const isSupporting = kind.startsWith("supporting:");
    if (!isPrimary && !isSupporting) {
      return NextResponse.json({ error: "Invalid upload kind." }, { status: 400 });
    }

    const rawSegment = isSupporting ? kind.slice("supporting:".length) : kind;
    if (!rawSegment || !/^[a-zA-Z0-9_-]+$/.test(rawSegment)) {
      return NextResponse.json({ error: "Invalid upload category." }, { status: 400 });
    }

    const fileName = `${Date.now()}-${safeFileName(file.name)}`;
    const storagePath = `requests/${requestId}/${safeKindSegment(rawSegment)}/${fileName}`;
    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase.storage
      .from("cvup-requests")
      .upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType,
      });

    if (error || !data?.path) {
      return NextResponse.json({ error: error?.message || "Upload failed." }, { status: 500 });
    }

    if (isPrimary) {
      const fields = primaryFileFields[kind as PrimaryKind];
      const { error: updateError } = await supabase
        .from("cv_requests")
        .update({
          [fields.path]: data.path,
          [fields.name]: file.name,
          [fields.type]: contentType,
        })
        .eq("id", requestId)
        .eq("request_code", verified.requestCode);

      if (updateError) {
        await supabase.storage.from("cvup-requests").remove([data.path]);
        return NextResponse.json({ error: "File metadata could not be saved." }, { status: 500 });
      }
    }

    return NextResponse.json({
      path: data.path,
      file_name: file.name,
      file_type: contentType,
    });
  } catch (error) {
    console.error("Upload error:", error instanceof Error ? error.message : "Unknown upload error");
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}
