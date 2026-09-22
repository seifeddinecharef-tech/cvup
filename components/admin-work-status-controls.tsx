"use client";

import { useState } from "react";

const workStatuses = ["NEW", "IN_PROGRESS", "READY", "DELIVERED", "CANCELLED"] as const;

export function AdminWorkStatusControls({
  requestCode,
  initialStatus,
}: {
  requestCode: string;
  initialStatus?: string | null;
}) {
  const safeInitialStatus = workStatuses.includes((initialStatus ?? "NEW") as (typeof workStatuses)[number])
    ? (initialStatus as (typeof workStatuses)[number])
    : "NEW";
  const [status, setStatus] = useState<(typeof workStatuses)[number]>(safeInitialStatus);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/requests/${encodeURIComponent(requestCode)}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Status update failed.");
      setStatus(result.request?.status || status);
      setMessage("Work status saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Status update failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="admin-panel">
      <div className="admin-panel__heading">
        <div>
          <p className="admin-eyebrow">Manual workflow</p>
          <h2>Work status</h2>
        </div>
        <span className="payment-badge payment-badge--not_required">{status}</span>
      </div>
      <div className="admin-form-grid">
        <label>
          Status
          <select value={status} onChange={(event) => setStatus(event.target.value as (typeof workStatuses)[number])}>
            {workStatuses.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
      </div>
      <div className="admin-panel__actions">
        <button type="button" className="admin-button admin-button--primary" onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save work status"}
        </button>
        {message ? <span className="admin-message">{message}</span> : null}
      </div>
    </section>
  );
}
