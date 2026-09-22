"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const workStatuses = ["NEW", "IN_PROGRESS", "READY", "DELIVERED", "CANCELLED"] as const;
type WorkStatus = (typeof workStatuses)[number];

export function AdminWorkStatusControls({
  requestCode,
  initialStatus,
}: {
  requestCode: string;
  initialStatus?: string | null;
}) {
  const router = useRouter();
  const safeInitialStatus = workStatuses.includes((initialStatus ?? "NEW") as WorkStatus)
    ? (initialStatus as WorkStatus)
    : "NEW";
  const [status, setStatus] = useState<WorkStatus>(safeInitialStatus);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save(nextStatus: WorkStatus = status) {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/requests/${encodeURIComponent(requestCode)}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Status update failed.");

      const persistedStatus = (result.request?.status || nextStatus) as WorkStatus;
      setStatus(persistedStatus);
      setMessage("Saved");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Status update failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(nextStatus: WorkStatus) {
    setStatus(nextStatus);
    await save(nextStatus);
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
          <select
            value={status}
            disabled={saving}
            onChange={(event) => void handleStatusChange(event.target.value as WorkStatus)}
          >
            {workStatuses.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
      </div>
      <div className="admin-panel__actions">
        <button type="button" className="admin-button admin-button--primary" onClick={() => void save()} disabled={saving}>
          {saving ? "Saving..." : "Save again"}
        </button>
        {message ? <span className="admin-message">{message}</span> : null}
      </div>
    </section>
  );
}
