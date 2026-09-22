import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminRequestByCode } from "@/lib/admin-data";
import { AdminWorkStatusControls } from "@/components/admin-work-status-controls";
import { AdminPaymentControls } from "@/components/admin-payment-controls";
import { AdminLogoutButton } from "@/components/admin-logout-button";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function asArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
    : [];
}

function displayValue(value: unknown): string {
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value && typeof value === "object") return JSON.stringify(value, null, 2);
  return value === null || value === undefined || value === "" ? "—" : String(value);
}

function statusClass(status?: string | null) {
  switch (status) {
    case "IN_PROGRESS": return "admin-status admin-status--progress";
    case "READY": return "admin-status admin-status--ready";
    case "DELIVERED": return "admin-status admin-status--delivered";
    case "CANCELLED": return "admin-status admin-status--cancelled";
    default: return "admin-status admin-status--new";
  }
}

function paymentClass(status?: string | null) {
  switch (status) {
    case "PAID": return "admin-status admin-status--paid";
    case "REFUNDED": return "admin-status admin-status--cancelled";
    case "NOT_REQUIRED": return "admin-status admin-status--muted";
    default: return "admin-status admin-status--pending";
  }
}

function digits(value?: string | null) {
  let normalized = String(value || "").replace(/\D/g, "");
  if (normalized.startsWith("00")) normalized = normalized.slice(2);
  if (normalized.startsWith("0")) normalized = `213${normalized.slice(1)}`;
  return normalized;
}

function countryDisplay(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return "—";
  const normalized = value.trim();
  if (!/^[A-Za-z]{2}$/.test(normalized)) return normalized;
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(normalized.toUpperCase()) || normalized;
  } catch {
    return normalized;
  }
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

  if (!request) notFound();

  const rawPayload = asRecord(request.raw_payload);
  const supportingMaterials = asArray(request.supporting_materials);
  const phoneDigits = digits(request.phone);

  const overviewFields: Array<[string, unknown]> = [
    ["Request code", request.request_code],
    ["Submitted", request.created_at ? new Date(request.created_at).toLocaleString("fr-DZ") : "—"],
    ["Form language", request.form_language],
    ["CV type", request.cv_type],
    ["Target role", request.target_role || request.target_job_title],
    ["Company", request.company_name],
    ["Professional field", request.professional_field],
    ["CV languages", request.selected_cv_languages],
  ];

  const contactFields: Array<[string, unknown]> = [
    ["Full name", request.full_name],
    ["Phone / WhatsApp", request.phone],
    ["Email", request.email],
    ["Current country", countryDisplay(rawPayload.current_country)],
    ["Nationality", countryDisplay(rawPayload.nationality)],
    ["Willing to relocate", rawPayload.willing_to_relocate],
    ["Target countries", rawPayload.target_countries],
    ["Work authorization", rawPayload.work_authorization],
  ];

  const dossierSections = [
    {
      title: "Target job",
      fields: [
        ["Target job title", request.target_job_title],
        ["Company", request.company_name],
        ["Job URL", request.job_url],
        ["Job description", request.job_description_text || "No job description provided."],
      ],
    },
    {
      title: "Professional evidence",
      fields: [
        ["Responsibilities", rawPayload.professional_evidence],
        ["Other responsibilities", rawPayload.professional_evidence_other],
        ["Has measurable achievements", rawPayload.has_measurable_achievements],
        ["Achievements", rawPayload.measurable_achievements_text],
        ["Has additional experience", rawPayload.has_additional_experience],
        ["Additional experience", rawPayload.additional_experience_text],
      ],
    },
    {
      title: "Tools, platforms & collaboration",
      fields: [
        ["Tools", request.tools],
        ["Other tools", rawPayload.tools_other],
        ["Platforms", rawPayload.platforms_worked_with],
        ["Other platforms", rawPayload.platforms_other],
        ["Collaboration types", rawPayload.collaboration_types],
        ["Other collaboration", rawPayload.collaboration_other],
      ],
    },
    {
      title: "Languages & certifications",
      fields: [
        ["Spoken languages", request.spoken_languages],
        ["Has certifications", request.has_certifications],
        ["Certification details", request.certifications_text],
        ["Certification link", request.certifications_link],
        ["Certification file", request.certifications_file_name],
      ],
    },
    {
      title: "Files & preferences",
      fields: [
        ["Has current CV", request.has_current_cv],
        ["Current CV file", request.current_cv_file_name],
        ["Current CV link", request.optional_cv_link],
        ["Design preference", request.cv_design_preference],
        ["Other design preference", rawPayload.cv_design_preference_other],
        ["Template file", request.cv_template_file_name],
        ["Template link", request.cv_template_link],
      ],
    },
    {
      title: "Additional information",
      fields: [
        ["Additional information", request.additional_information],
        ["Information to exclude", request.excluded_information],
        ["Final professional information", rawPayload.additional_professional_information],
        ["Recruitment consent", request.recruitment_consent],
        ["Final consent", request.final_consent],
      ],
    },
  ] as const;

  return (
    <main className="admin-shell min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-10">
        <header className="admin-detail-header">
          <div>
            <Link href="/admin" className="admin-back-link">← Back to requests</Link>
            <p className="admin-eyebrow mt-4">Client dossier</p>
            <h1>{request.full_name || "Unnamed client"}</h1>
            <div className="admin-detail-meta">
              <code>{request.request_code}</code>
              <span className={statusClass(request.status)}>{request.status || "NEW"}</span>
              <span className={paymentClass(request.payment_status)}>{request.payment_status || "PENDING"}</span>
            </div>
          </div>
          <div className="admin-detail-actions">
            {phoneDigits ? (
              <a href={`https://wa.me/${phoneDigits}`} target="_blank" rel="noreferrer" className="admin-button admin-button--secondary">
                WhatsApp client
              </a>
            ) : null}
            {request.email ? (
              <a href={`mailto:${request.email}`} className="admin-button admin-button--secondary">
                Email client
              </a>
            ) : null}
            {request.request_code ? (
              <a href={`/api/admin/requests/${encodeURIComponent(request.request_code)}/export`} className="admin-button admin-button--primary">
                Download dossier ZIP
              </a>
            ) : null}
            <AdminLogoutButton />
          </div>
        </header>

        <section className="admin-detail-summary-grid">
          <div className="admin-summary-card">
            <p className="admin-eyebrow">Request overview</p>
            <div className="admin-summary-list">
              {overviewFields.map(([label, value]) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>{displayValue(value)}</strong>
                </div>
              ))}
            </div>
          </div>
          <div className="admin-summary-card">
            <p className="admin-eyebrow">Client contact & mobility</p>
            <div className="admin-summary-list">
              {contactFields.map(([label, value]) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>{displayValue(value)}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="admin-control-grid">
          {request.request_code ? <AdminWorkStatusControls requestCode={request.request_code} initialStatus={request.status} /> : null}
          {request.request_code ? <AdminPaymentControls requestCode={request.request_code} payment={request} /> : null}
        </section>

        {supportingMaterials.length ? (
          <section className="admin-summary-card">
            <div className="admin-section-heading">
              <div>
                <p className="admin-eyebrow">Evidence</p>
                <h2>Supporting materials</h2>
              </div>
              <span>{supportingMaterials.length} item{supportingMaterials.length === 1 ? "" : "s"}</span>
            </div>
            <div className="admin-support-grid">
              {supportingMaterials.map((item, index) => {
                const link = typeof item.link === "string" ? item.link : "";
                const fileName = typeof item.file_name === "string" ? item.file_name : "";
                const question = typeof item.question_key === "string" ? item.question_key : `item-${index + 1}`;
                return (
                  <article key={`${question}-${index}`} className="admin-support-card">
                    <strong>{question.replace(/_/g, " ")}</strong>
                    {link ? <a href={link} target="_blank" rel="noreferrer">Open supporting link ↗</a> : null}
                    <span>{fileName ? `File: ${fileName}` : "No uploaded file"}</span>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}

        <section className="admin-dossier-grid">
          {dossierSections.map((section) => (
            <article key={section.title} className="admin-summary-card">
              <h2>{section.title}</h2>
              <div className="admin-summary-list">
                {section.fields.map(([label, value]) => (
                  <div key={String(label)}>
                    <span>{String(label)}</span>
                    <strong className="whitespace-pre-wrap">{displayValue(value)}</strong>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
