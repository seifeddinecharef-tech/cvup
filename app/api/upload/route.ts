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

type UploadDescriptor = {
  requestId?: string;
  kind?: string;
  token?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
};

type UploadCompletion = UploadDescriptor & {
  path?: string;
};

function safeFileName(value: string) {
  return value
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 140) || "file";
}

function safeKindSegment(kind: string) {
  return kind.replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 80);
}

function resolveMimeType(fileName: string, suppliedType?: string) {
  if (suppliedType && allowedMimeTypes.has(suppliedType)) return suppliedType;

  const extension = fileName.toLowerCase().split(".").pop();
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

function validateKind(kind: string) {
  const isPrimary = kind in primaryFileFields;
  const isSupporting = kind.startsWith("supporting:");
  if (!isPrimary && !isSupporting) return null;

  const rawSegment = isSupporting ? kind.slice("supporting:".length) : kind;
  if (!rawSegment || !/^[a-zA-Z0-9_-]+$/.test(rawSegment)) return null;

  return { isPrimary, rawSegment };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as UploadDescriptor;
    const requestId = String(body.requestId || "");
    const kind = String(body.kind || "");
    const submissionToken = String(body.token || "");
    const fileName = String(body.fileName || "");
    const fileSize = Number(body.fileSize || 0);

    if (!requestId || !kind || !submissionToken || !fileName) {
      return NextResponse.json({ error: "Missing upload information." }, { status: 400 });
    }

    const verified = await verifyRequestSubmissionToken(submissionToken);
    if (!verified || verified.requestId !== requestId) {
      return NextResponse.json({ error: "Invalid or expired upload token." }, { status: 401 });
    }

    if (!Number.isFinite(fileSize) || fileSize <= 0 || fileSize > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File must be between 1 byte and 10 MB." }, { status: 400 });
    }

    const contentType = resolveMimeType(fileName, body.fileType);
    if (!contentType) {
      return NextResponse.json({ error: "Unsupported file type." }, { status: 400 });
    }

    const kindInfo = validateKind(kind);
    if (!kindInfo) {
      return NextResponse.json({ error: "Invalid upload kind." }, { status: 400 });
    }

    const storagePath = `requests/${requestId}/${safeKindSegment(kindInfo.rawSegment)}/${Date.now()}-${safeFileName(fileName)}`;
    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase.storage
      .from("cvup-requests")
      .createSignedUploadUrl(storagePath, { upsert: false });

    if (error || !data?.token) {
      return NextResponse.json({ error: "Could not prepare secure upload." }, { status: 500 });
    }

    return NextResponse.json({
      path: storagePath,
      upload_token: data.token,
      content_type: contentType,
      file_name: fileName,
      is_primary: kindInfo.isPrimary,
    });
  } catch (error) {
    console.error("Upload preparation error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Could not prepare upload." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as UploadCompletion;
    const requestId = String(body.requestId || "");
    const kind = String(body.kind || "");
    const submissionToken = String(body.token || "");
    const path = String(body.path || "");
    const fileName = String(body.fileName || "");

    if (!requestId || !kind || !submissionToken || !path || !fileName) {
      return NextResponse.json({ error: "Missing upload completion information." }, { status: 400 });
    }

    const verified = await verifyRequestSubmissionToken(submissionToken);
    if (!verified || verified.requestId !== requestId) {
      return NextResponse.json({ error: "Invalid or expired upload token." }, { status: 401 });
    }

    const kindInfo = validateKind(kind);
    if (!kindInfo) {
      return NextResponse.json({ error: "Invalid upload kind." }, { status: 400 });
    }

    const expectedPrefix = `requests/${requestId}/${safeKindSegment(kindInfo.rawSegment)}/`;
    if (!path.startsWith(expectedPrefix)) {
      return NextResponse.json({ error: "Invalid storage path." }, { status: 400 });
    }

    const contentType = resolveMimeType(fileName, body.fileType);
    if (!contentType) {
      return NextResponse.json({ error: "Unsupported file type." }, { status: 400 });
    }

    if (!kindInfo.isPrimary) {
      return NextResponse.json({ success: true, path, file_name: fileName, file_type: contentType });
    }

    const supabase = getSupabaseServerClient();
    const fields = primaryFileFields[kind as PrimaryKind];
    const { data: objectRows } = await supabase
      .schema("storage")
      .from("objects")
      .select("name")
      .eq("bucket_id", "cvup-requests")
      .eq("name", path)
      .limit(1);

    if (!objectRows?.length) {
      return NextResponse.json({ error: "Uploaded file could not be verified." }, { status: 409 });
    }

    const { error: updateError } = await supabase
      .from("cv_requests")
      .update({
        [fields.path]: path,
        [fields.name]: fileName.slice(0, 255),
        [fields.type]: contentType,
      })
      .eq("id", requestId)
      .eq("request_code", verified.requestCode);

    if (updateError) {
      return NextResponse.json({ error: "File metadata could not be saved." }, { status: 500 });
    }

    return NextResponse.json({ success: true, path, file_name: fileName, file_type: contentType });
  } catch (error) {
    console.error("Upload completion error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Could not finalize upload." }, { status: 500 });
  }
}
