import JSZip from "jszip";
import { getAdminRequestByCode } from "@/lib/admin-data";
import { getSupabaseServerClient } from "@/lib/supabase";

const bucket = "cvup-requests";

function safeSlug(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "request";
}

function text(value: unknown) {
  if (Array.isArray(value)) return value.join(", ");
  if (value && typeof value === "object") return JSON.stringify(value, null, 2);
  return value === null || value === undefined || value === "" ? "—" : String(value);
}

export async function GET(_request: Request, { params }: { params: Promise<{ requestCode: string }> }) {
  const { requestCode } = await params;
  const request = await getAdminRequestByCode(requestCode);
  if (!request) return new Response("Request not found.", { status: 404 });
  const zip = new JSZip();
  const raw = request.raw_payload && typeof request.raw_payload === "object" ? request.raw_payload : {};
  const fields = [
    ["Request code", request.request_code], ["Date", request.created_at], ["Full name", request.full_name], ["Phone", request.phone], ["Email", request.email],
    ["Language", request.form_language], ["CV type", request.cv_type], ["Target role", request.target_job_title || request.target_role], ["Field", request.professional_field],
    ["Tools", request.tools], ["Status", request.status], ["Payment status", request.payment_status], ["Payment method", request.payment_method], ["Payment reference", request.payment_reference],
    ["Job URL", request.job_url], ["Job description", request.job_description_text], ["Additional information", request.additional_information], ["Excluded information", request.excluded_information], ["User answers", raw],
  ];
  zip.file("request.md", `# CVUp Request ${request.request_code}\n\n${fields.map(([label, value]) => `## ${label}\n\n${text(value)}\n`).join("\n")}`);
  const files = [
    [request.current_cv_file_path, request.current_cv_file_name], [request.job_description_file_path, request.job_description_file_name],
    [request.certifications_file_path, request.certifications_file_name], [request.cv_template_file_path, request.cv_template_file_name],
  ] as Array<[string | null | undefined, string | null | undefined]>;
  const supabase = getSupabaseServerClient();
  for (const [path, name] of files) {
    if (!path || !name) continue;
    const { data } = await supabase.storage.from(bucket).download(path);
    if (data) zip.file(`uploads/${name.replace(/[\\/]/g, "-")}`, await data.arrayBuffer());
  }
  const archive = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  const responseBody = new ArrayBuffer(archive.byteLength);
  new Uint8Array(responseBody).set(archive);
  return new Response(responseBody, { headers: { "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="${safeSlug(String(request.full_name))}-${request.request_code}.zip"` } });
}