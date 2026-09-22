"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { CvRequestRow } from "@/lib/admin-data";

function formatDate(value?: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fr-DZ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
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

function whatsappNumber(value?: string | null) {
  const raw = String(value || "").trim();
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = `213${digits.slice(1)}`;
  return digits;
}

function paymentClass(status?: string | null) {
  switch (status) {
    case "PAID": return "admin-status admin-status--paid";
    case "REFUNDED": return "admin-status admin-status--cancelled";
    case "NOT_REQUIRED": return "admin-status admin-status--muted";
    default: return "admin-status admin-status--pending";
  }
}

export function AdminDashboard({ requests }: { requests: CvRequestRow[] }) {
  const [query, setQuery] = useState("");
  const [workStatus, setWorkStatus] = useState("ALL");
  const [paymentStatus, setPaymentStatus] = useState("ALL");

  const counts = useMemo(() => ({
    total: requests.length,
    new: requests.filter((item) => (item.status || "NEW") === "NEW").length,
    progress: requests.filter((item) => item.status === "IN_PROGRESS").length,
    ready: requests.filter((item) => item.status === "READY").length,
    pendingPayment: requests.filter((item) => (item.payment_status || "PENDING") === "PENDING").length,
    paid: requests.filter((item) => item.payment_status === "PAID").length,
  }), [requests]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return requests.filter((item) => {
      const haystack = [
        item.full_name,
        item.request_code,
        item.phone,
        item.email,
        item.target_role,
        item.target_job_title,
        item.professional_field,
      ].filter(Boolean).join(" ").toLowerCase();

      const matchesQuery = !normalized || haystack.includes(normalized);
      const matchesWork = workStatus === "ALL" || (item.status || "NEW") === workStatus;
      const matchesPayment = paymentStatus === "ALL" || (item.payment_status || "PENDING") === paymentStatus;
      return matchesQuery && matchesWork && matchesPayment;
    });
  }, [requests, query, workStatus, paymentStatus]);

  return (
    <div className="admin-dashboard">
      <section className="admin-kpi-grid" aria-label="Request summary">
        <div className="admin-kpi-card"><span>Total requests</span><strong>{counts.total}</strong></div>
        <div className="admin-kpi-card"><span>New</span><strong>{counts.new}</strong></div>
        <div className="admin-kpi-card"><span>In progress</span><strong>{counts.progress}</strong></div>
        <div className="admin-kpi-card"><span>Ready</span><strong>{counts.ready}</strong></div>
        <div className="admin-kpi-card"><span>Pending payment</span><strong>{counts.pendingPayment}</strong></div>
        <div className="admin-kpi-card"><span>Paid</span><strong>{counts.paid}</strong></div>
      </section>

      <section className="admin-workspace-card">
        <div className="admin-toolbar">
          <div className="admin-search-wrap">
            <span aria-hidden="true">⌕</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search client, request code, phone, email..."
              aria-label="Search requests"
            />
          </div>
          <select value={workStatus} onChange={(event) => setWorkStatus(event.target.value)} aria-label="Filter by work status">
            <option value="ALL">All work statuses</option>
            <option value="NEW">NEW</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="READY">READY</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
          <select value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value)} aria-label="Filter by payment status">
            <option value="ALL">All payment statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="PAID">PAID</option>
            <option value="NOT_REQUIRED">NOT_REQUIRED</option>
            <option value="REFUNDED">REFUNDED</option>
          </select>
        </div>

        <div className="admin-result-meta">
          <strong>{filtered.length}</strong> request{filtered.length === 1 ? "" : "s"} shown
        </div>

        {filtered.length === 0 ? (
          <div className="admin-empty-state">
            <strong>No matching requests</strong>
            <span>Change the search or filters to see other clients.</span>
          </div>
        ) : (
          <>
            <div className="admin-request-table-wrap">
              <table className="admin-request-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Request</th>
                    <th>Target</th>
                    <th>Payment</th>
                    <th>Work status</th>
                    <th>Created</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((request) => (
                    <tr key={request.request_code ?? request.id}>
                      <td>
                        <div className="admin-client-cell">
                          <strong>{request.full_name || "Unnamed client"}</strong>
                          {request.phone && whatsappNumber(request.phone) ? (
                            <a
                              href={`https://wa.me/${whatsappNumber(request.phone)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="admin-whatsapp-link"
                              title="Open WhatsApp conversation"
                            >
                              {request.phone} ↗
                            </a>
                          ) : (
                            <span>{request.email || "No contact"}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <code>{request.request_code || "—"}</code>
                      </td>
                      <td>
                        <div className="admin-client-cell">
                          <strong>{request.target_role || request.target_job_title || "General CV"}</strong>
                          <span>{request.professional_field || "—"}</span>
                        </div>
                      </td>
                      <td><span className={paymentClass(request.payment_status)}>{request.payment_status || "PENDING"}</span></td>
                      <td><span className={statusClass(request.status)}>{request.status || "NEW"}</span></td>
                      <td>{formatDate(request.created_at)}</td>
                      <td>
                        <Link className="admin-open-button" href={`/admin/${request.request_code}`}>
                          Open dossier
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="admin-request-cards">
              {filtered.map((request) => (
                <article key={request.request_code ?? request.id} className="admin-request-card">
                  <div className="admin-request-card__top">
                    <div>
                      <strong>{request.full_name || "Unnamed client"}</strong>
                      <code>{request.request_code || "—"}</code>
                    </div>
                    <span className={statusClass(request.status)}>{request.status || "NEW"}</span>
                  </div>
                  <div className="admin-request-card__meta">
                    {request.phone && whatsappNumber(request.phone) ? (
                      <a
                        href={`https://wa.me/${whatsappNumber(request.phone)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="admin-whatsapp-link"
                        title="Open WhatsApp conversation"
                      >
                        WhatsApp: {request.phone} ↗
                      </a>
                    ) : null}
                    <span>{request.target_role || request.target_job_title || "General CV"}</span>
                    <span>{request.professional_field || "—"}</span>
                    <span>{formatDate(request.created_at)}</span>
                  </div>
                  <div className="admin-request-card__bottom">
                    <span className={paymentClass(request.payment_status)}>{request.payment_status || "PENDING"}</span>
                    <Link className="admin-open-button" href={`/admin/${request.request_code}`}>Open dossier</Link>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
