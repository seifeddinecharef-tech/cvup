import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminRequestByCode } from "@/lib/admin-data";
import { getAnalysis } from "@/lib/analysis-data";
import { AdminAnalysisActions } from "@/components/admin-analysis-actions";
import { AdminAnalysisView } from "@/components/admin-analysis-view";
import { AdminPaymentControls } from "@/components/admin-payment-controls";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function displayValue(value: unknown): string {
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return value === null || value === undefined || value === "" ? "—" : String(value);
}

export default async function AdminRequestDetailPage({
  params,
}: {
  params: Promise<{ requestCode: string }>;
}) {
  const { requestCode } = await params;

  let request;
  try {
    request = await getAdminRequestByCode(requestCode);
  } catch {
    notFound();
  }

  if (!request) {
    notFound();
  }

  let storedAnalysis = null;
  try {
    if (request.id) storedAnalysis = await getAnalysis(request.id);
  } catch {
    storedAnalysis = null;
  }

  const rawPayload = asRecord(request.raw_payload);
  const dossierSections = [
    {
      title: "Professional Evidence",
      fields: [
        ["Responsibilities", rawPayload.professional_evidence],
        ["Other responsibilities", rawPayload.professional_evidence_other],
      ],
    },
    {
      title: "Platforms",
      fields: [["Platforms used", rawPayload.platforms_worked_with], ["Other platforms", rawPayload.platforms_other]],
    },
    {
      title: "Tools",
      fields: [["Tools used", request.tools], ["Other tools", rawPayload.tools_other]],
    },
    {
      title: "Achievements",
      fields: [["Has measurable achievements", rawPayload.has_measurable_achievements], ["Details", rawPayload.measurable_achievements_text]],
    },
    {
      title: "Additional Experience",
      fields: [["Has additional experience", rawPayload.has_additional_experience], ["Details", rawPayload.additional_experience_text]],
    },
    {
      title: "Professional Collaboration",
      fields: [["Collaboration types", rawPayload.collaboration_types], ["Other collaboration", rawPayload.collaboration_other]],
    },
    {
      title: "Languages",
      fields: [["Spoken languages", request.spoken_languages], ["Professional writing", "Shown per language above"]],
    },
    {
      title: "Eligibility / Mobility",
      fields: [
        ["Current country", rawPayload.current_country],
        ["Nationality", rawPayload.nationality],
        ["Willing to relocate", rawPayload.willing_to_relocate],
        ["Target countries", rawPayload.target_countries],
        ["Work authorization", rawPayload.work_authorization],
        ["Other authorization", rawPayload.work_authorization_other],
      ],
    },
    {
      title: "Additional Professional Information",
      fields: [["Information", rawPayload.additional_professional_information]],
    },
  ];

  const statusOptions = [
    "NEW",
    "ANALYZING",
    "NEEDS_REVIEW",
    "READY_TO_GENERATE",
    "GENERATING",
    "READY_FOR_REVIEW",
    "APPROVED",
    "WAITING_PAYMENT",
    "PAID",
    "IN_PROGRESS",
    "REVIEW",
    "READY",
    "DELIVERED",
    "CANCELLED",
  ];

  const detailFields = [
    ["Request code", request.request_code],
    ["Created at", request.created_at ? new Date(request.created_at).toLocaleString() : "—"],
    ["Full name", request.full_name],
    ["Phone", request.phone],
    ["Email", request.email],
    ["CV type", request.cv_type],
    ["Target job title", request.target_job_title || request.target_role],
    ["Company", request.company_name],
    ["Professional field", request.professional_field],
    ["CV languages", Array.isArray(request.selected_cv_languages) ? request.selected_cv_languages.join(", ") : "—"],
    ["Recruitment consent", request.recruitment_consent === true ? "Yes" : request.recruitment_consent === false ? "No" : "—"],
    ["Final consent", request.final_consent === true ? "Yes" : request.final_consent === false ? "No" : "—"],
    ["Status", request.status],
    ["Form language", request.form_language],
    ["Job URL", request.job_url],
    ["Optional CV link", request.optional_cv_link],
    ["Job description", request.job_description_text || "No job description provided."],
    ["Additional information", request.additional_information || "No extra information provided."],
    ["Admin notes", request.admin_notes || "No internal notes yet."],
    ["Tools", Array.isArray(request.tools) ? request.tools.join(", ") : "—"],
    ["Spoken languages", typeof request.spoken_languages === "string" ? request.spoken_languages : JSON.stringify(request.spoken_languages ?? {})],
  ];

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-slate-500">CVUp admin</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Request details</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Back to list
            </Link>
            {request.request_code ? <AdminAnalysisActions requestCode={request.request_code} /> : null}
            {request.request_code ? <Link href={`/api/admin/requests/${encodeURIComponent(request.request_code)}/export`} className="admin-button admin-button--secondary">Download dossier ZIP</Link> : null}
          </div>
        </div>

        {storedAnalysis ? <AdminAnalysisView analysis={storedAnalysis.analysis} /> : <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">No analysis saved yet.</div>}

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-slate-500">Request code</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">{request.request_code}</h2>
            </div>
            <span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-700">
              {request.status || "NEW"}
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {detailFields.map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
                <p className="mt-2 break-words text-base text-slate-800">{String(value ?? "—")}</p>
              </div>
            ))}
          </div>
        </div>

        {request.request_code ? <AdminPaymentControls requestCode={request.request_code} payment={request} /> : null}

        <div className="space-y-4">
          {dossierSections.map((section) => (
            <section key={section.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900">{section.title}</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {section.fields.map(([label, value]) => (
                  <div key={String(label)} className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{String(label)}</p>
                    <p className="mt-2 whitespace-pre-wrap break-words text-base text-slate-800">
                      {section.title === "Languages" && label === "Spoken languages"
                        ? JSON.stringify(value ?? [], null, 2)
                        : displayValue(value)}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">Status management</h3>
          <label className="mt-4 block text-sm font-medium text-slate-700">
            Change status
            <select
              defaultValue={request.status || "NEW"}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-500"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </main>
  );
}
