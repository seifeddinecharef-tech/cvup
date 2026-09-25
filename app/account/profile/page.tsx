"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-client";
import { getCountryOptions } from "@/lib/countries";

type ProfileForm = {
  full_name_latin: string;
  full_name_arabic: string;
  phone: string;
  current_country: string;
  nationality: string;
  professional_field: string;
  target_role: string;
};

const emptyProfile: ProfileForm = {
  full_name_latin: "",
  full_name_arabic: "",
  phone: "",
  current_country: "",
  nationality: "",
  professional_field: "",
  target_role: "",
};

export default function Profile() {
  const [uid, setUid] = useState("");
  const [p, setP] = useState<ProfileForm>(emptyProfile);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const countries = useMemo(() => getCountryOptions("fr"), []);

  useEffect(() => {
    (async () => {
      const s = getSupabaseBrowserClient();
      const { data: { user } } = await s.auth.getUser();
      if (!user) {
        location.href = "/account/login";
        return;
      }
      setUid(user.id);
      const { data } = await s.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (data) {
        setP({
          full_name_latin: data.full_name_latin || "",
          full_name_arabic: data.full_name_arabic || "",
          phone: data.phone || "",
          current_country: data.current_country || "",
          nationality: data.nationality || "",
          professional_field: data.professional_field || "",
          target_role: data.target_role || "",
        });
      }
    })();
  }, []);

  const set = (key: keyof ProfileForm, value: string) => setP((current) => ({ ...current, [key]: value }));

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!uid) return;
    setSaving(true);
    setMsg("");
    const { error } = await getSupabaseBrowserClient().from("profiles").upsert({
      id: uid,
      ...p,
      updated_at: new Date().toISOString(),
    });
    setMsg(error ? error.message : "Information saved successfully.");
    setSaving(false);
  }

  return (
    <main className="min-h-screen bg-[#f7f9f4] p-4 text-[#102019] md:p-8">
      <form onSubmit={save} className="mx-auto max-w-4xl rounded-[28px] bg-white p-6 shadow-sm md:p-9">
        <Link href="/account" className="text-sm font-medium">← Dashboard</Link>
        <h1 className="mt-5 text-3xl font-bold md:text-4xl">My information</h1>
        <p className="mt-2 text-slate-500">Save your reusable information once. You can still change job-specific details for every new CV.</p>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium">Full name in Latin characters</span>
            <input required autoComplete="name" value={p.full_name_latin} onChange={(e) => set("full_name_latin", e.target.value)} placeholder="Example: Seif Eddine Charef" className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-slate-500" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium">Full name in Arabic</span>
            <input required dir="rtl" value={p.full_name_arabic} onChange={(e) => set("full_name_arabic", e.target.value)} placeholder="مثال: سيف الدين شارف" className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-slate-500" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium">WhatsApp number</span>
            <input type="tel" autoComplete="tel" value={p.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+213..." className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-slate-500" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium">Professional field</span>
            <input value={p.professional_field} onChange={(e) => set("professional_field", e.target.value)} placeholder="Marketing / Communication" className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-slate-500" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium">Current country</span>
            <select value={p.current_country} onChange={(e) => set("current_country", e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white p-3 outline-none focus:border-slate-500">
              <option value="">Select country</option>
              {countries.map((country) => <option key={country.code} value={country.code}>{country.label}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium">Nationality</span>
            <select value={p.nationality} onChange={(e) => set("nationality", e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white p-3 outline-none focus:border-slate-500">
              <option value="">Select nationality</option>
              {countries.map((country) => <option key={country.code} value={country.code}>{country.label}</option>)}
            </select>
          </label>
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-medium">Default target role</span>
            <input value={p.target_role} onChange={(e) => set("target_role", e.target.value)} placeholder="Example: Marketing Manager" className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-slate-500" />
            <span className="mt-2 block text-xs text-slate-500">This is only a reusable default. You can change it for each CV request.</span>
          </label>
        </div>

        {msg && <p className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-sm">{msg}</p>}
        <div className="mt-7 flex flex-wrap gap-3">
          <button disabled={saving} className="rounded-full bg-[#102019] px-7 py-3 text-white disabled:opacity-60">{saving ? "Saving..." : "Save changes"}</button>
          <Link href="/account" className="rounded-full border px-7 py-3">Cancel</Link>
        </div>
      </form>
    </main>
  );
}
