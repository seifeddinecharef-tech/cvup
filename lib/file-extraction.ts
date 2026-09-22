import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase";
import { extractTextFromBuffer, getFileExtension, MAX_FILE_BYTES } from "@/lib/file-extraction-core";

const STORAGE_BUCKET = "cvup-requests";
export type ExtractionWarning =
  | "CV_FILE_NOT_FOUND"
  | "CV_TEXT_EXTRACTION_EMPTY"
  | "CV_FORMAT_UNSUPPORTED"
  | "JOB_DESCRIPTION_FILE_NOT_FOUND"
  | "JOB_DESCRIPTION_EXTRACTION_EMPTY"
  | "JOB_DESCRIPTION_FORMAT_UNSUPPORTED"
  | "SUPPORTING_FILE_NOT_FOUND"
  | "SUPPORTING_TEXT_EXTRACTION_EMPTY"
  | "SUPPORTING_FORMAT_UNSUPPORTED"
  | "FILE_TOO_LARGE"
  | "FILE_DOWNLOAD_FAILED"
  | "FILE_EXTRACTION_FAILED";

export type UploadedFile = {
  path?: string | null;
  name?: string | null;
  type?: string | null;
};

export type ExtractedFileText = {
  text: string | null;
  warning?: ExtractionWarning;
};

export async function extractTextFromFile(file: UploadedFile, warningPrefix: "CV" | "JOB_DESCRIPTION" | "SUPPORTING"): Promise<ExtractedFileText> {
  if (!file.path) return { text: null, warning: `${warningPrefix}_FILE_NOT_FOUND` as ExtractionWarning };
  const extension = getFileExtension(file.name, file.type);
  if (!extension) return { text: null, warning: `${warningPrefix}_FORMAT_UNSUPPORTED` as ExtractionWarning };

  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase.storage.from(STORAGE_BUCKET).download(file.path);
    if (error || !data) return { text: null, warning: "FILE_DOWNLOAD_FAILED" };
    if (data.size > MAX_FILE_BYTES) return { text: null, warning: "FILE_TOO_LARGE" };

    const text = await extractTextFromBuffer(Buffer.from(await data.arrayBuffer()), extension);
    return text ? { text } : { text: null, warning: `${warningPrefix}_TEXT_EXTRACTION_EMPTY` as ExtractionWarning };
  } catch {
    return { text: null, warning: "FILE_EXTRACTION_FAILED" };
  }
}

export async function extractCandidateCvText(file: UploadedFile) {
  return extractTextFromFile(file, "CV");
}

export async function extractJobDescriptionText(file: UploadedFile) {
  return extractTextFromFile(file, "JOB_DESCRIPTION");
}

export async function extractSupportingCandidateText(files: UploadedFile[]) {
  const results = await Promise.all(files.map((file) => extractTextFromFile(file, "SUPPORTING")));
  return {
    text: results.flatMap((result) => (result.text ? [result.text] : [])).join("\n\n") || null,
    warnings: results.flatMap((result) => (result.warning ? [result.warning] : [])),
  };
}