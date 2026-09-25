"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Payment = {
  payment_status?: string | null;
  payment_method?: string | null;
  payment_reference?: string | null;
  payment_notes?: string | null;
  paid_at?: string | null;
};

function toDateTimeLocal(value?: string | null) {
  return value ? new Date(value).toISOString().slice(0, 16) : "";
}

export function AdminPaymentControls({ requestCode, payment }: { requestCode: string; payment: Payment }) {
  const router = useRouter();
  const [form, setForm] = useState({
    payment_status: payment.payment_status || "PENDING",
    payment_method: payment.payment_method || "BARIDIMOB_MANUAL",
    payment_reference: payment.payment_reference || "",
    payment_notes: payment.payment_notes || "",
    paid_at: toDateTimeLocal(payment.paid_at),
  });
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (form.payment_status === "PAID") {
      const confirmed = window.confirm("Confirm that you verified this payment. AI processing will start after confirmation.");
      if (!confirmed) return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/requests/${encodeURIComponent(requestCode)}/payment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Payment update failed.");

      if (result.payment) {
        setForm({
          payment_status: result.payment.payment_status || "PENDING",
          payment_method: result.payment.payment_method || "BARIDIMOB_MANUAL",
          payment_reference: result.payment.payment_reference || "",
          payment_notes: result.payment.payment_notes || "",
          paid_at: toDateTimeLocal(result.payment.paid_at),
        });
      }

      if (result.processing?.error) {
        setMessage(`Payment saved. AI processing did not start yet: ${result.processing.error}`);
      } else if (form.payment_status === "PAID") {
        setMessage(result.processing?.already_processed ? "Payment confirmed. Processing was already started." : "Payment confirmed. AI processing started.");
      } else {
        setMessage("Payment details saved.");
      }
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Payment update failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="admin-panel">
      <div className="admin-panel__heading">
        <div><p className="admin-eyebrow">Payment</p><h2>Payment tracking</h2></div>
        <span className={`payment-badge payment-badge--${form.payment_status.toLowerCase()}`}>{form.payment_status}</span>
      </div>

      <div className="admin-form-grid">
        <label>
          Status
          <select value={form.payment_status} onChange={(event) => setForm({ ...form, payment_status: event.target.value })}>
            <option value="PENDING">PENDING</option>
            <option value="PAID">PAID</option>
            <option value="NOT_REQUIRED">NOT_REQUIRED</option>
            <option value="REFUNDED">REFUNDED</option>
          </select>
        </label>

        <label>
          Method
          <select value={form.payment_method} onChange={(event) => setForm({ ...form, payment_method: event.target.value })}>
            <option value="BARIDIMOB_MANUAL">BaridiMob / WhatsApp</option>
            <option value="SOFIZPAY">SofizPay</option>
          </select>
        </label>

        <label>Reference<input value={form.payment_reference} onChange={(event) => setForm({ ...form, payment_reference: event.target.value })} /></label>
        <label>Paid at<input type="datetime-local" value={form.paid_at} onChange={(event) => setForm({ ...form, paid_at: event.target.value })} /></label>
        <label>Notes<textarea rows={2} value={form.payment_notes} onChange={(event) => setForm({ ...form, payment_notes: event.target.value })} /></label>
      </div>

      <div className="admin-panel__actions">
        <button type="button" className="admin-button admin-button--primary" onClick={save} disabled={saving}>
          {saving ? "Saving..." : form.payment_status === "PAID" ? "Confirm payment & start AI" : "Save payment status"}
        </button>
        {message ? <span className="admin-message">{message}</span> : null}
      </div>
    </section>
  );
}
