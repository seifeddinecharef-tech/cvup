"use client";

import { useMemo, useState } from "react";
import { professionalFields, commonToolsByField, cvLanguageOptions, designPreferences, languageLevels } from "@/lib/forms";
import { getText, languages, type LanguageCode } from "@/lib/i18n";

const initialForm = {
  form_language: "fr",
  full_name: "",
  phone: "",
  email: "",
  cv_type: "General CV",
  target_job_title: "",
  company_name: "",
  job_url: "",
  job_description_text: "",
  professional_field: "Marketing / Communication",
  target_role: "",
  cv_language_count: 1,
  selected_cv_languages: ["French"],
  has_current_cv: "Yes",
  current_cv_file: null as File | null,
  optional_cv_link: "",
  tools: [] as string[],
  spoken_languages: [{ language: "Arabic", level: "Native" }],
  has_certifications: "No",
  certifications_text: "",
  certifications_file: null as File | null,
  certifications_link: "",
  cv_design_preference: "ATS-friendly simple professional design",
  cv_template_file: null as File | null,
  cv_template_link: "",
  additional_information: "",
  excluded_information: "",
  recruitment_consent: "No",
  final_consent: false,
};

export default function HomePage() {
  const [language, setLanguage] = useState<LanguageCode>("fr");
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fieldTools = useMemo(
    () => commonToolsByField[form.professional_field] ?? commonToolsByField["Other"],
    [form.professional_field]
  );

  const handleFieldChange = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleLanguageSelect = (code: LanguageCode) => {
    setLanguage(code);
    setForm((current) => ({ ...current, form_language: code }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    try {
      const body = {
        ...form,
        recruitment_consent: form.recruitment_consent === "Yes",
        final_consent: form.final_consent,
      };

      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Submission failed.");
      }

      setStatus(`Request submitted: ${result.request_code}`);
      window.location.href = "/success";
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to submit your request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isTargeted = form.cv_type === "CV targeted to a specific job";

  return (
    <main className="min-h-screen bg-[#f6f7f8] text-slate-900" dir={language === "ar" ? "rtl" : "ltr"}>
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8">
          <div className="text-xl font-bold tracking-tight text-slate-900">CVUp</div>
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 p-1">
            {languages.map((item) => (
              <button
                key={item.code}
                type="button"
                onClick={() => handleLanguageSelect(item.code as LanguageCode)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                  language === item.code ? "bg-slate-900 text-white" : "text-slate-600"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-16">
        <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="mb-4 inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
              Truth First · Relevance · Optimization
            </div>
            <h1 className="max-w-xl text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
              {getText(language, "heroTitle")}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
              {getText(language, "heroText")}
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a
                href="#form"
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                {getText(language, "ctaPrimary")}
              </a>
              <p className="flex items-center text-sm text-slate-600">
                {getText(language, "ctaSecondary")}
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{getText(language, "sectionHow")}</p>
            <div className="mt-4 space-y-4">
              {[
                { num: 1, text: getText(language, "step1") },
                { num: 2, text: getText(language, "step2") },
                { num: 3, text: getText(language, "step3") },
              ].map((step) => (
                <div key={step.num} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                    {step.num}
                  </div>
                  <div className="text-sm text-slate-700">{step.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <h2 className="mb-6 text-2xl font-bold text-slate-900">{getText(language, "sectionOptions")}</h2>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-lg font-bold text-slate-900">{getText(language, "generalTitle")}</p>
            <p className="mt-3 text-slate-600">{getText(language, "generalText")}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-lg font-bold text-slate-900">{getText(language, "targetedTitle")}</p>
            <p className="mt-3 text-slate-600">{getText(language, "targetedText")}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <h2 className="mb-6 text-2xl font-bold text-slate-900">{getText(language, "includedTitle")}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {["ATS-friendly structure", "professional rewriting", "1, 2 or 3 language versions", "Cover Letter", "job-specific tailoring if needed", "professional formatting", "no invented information"].map((item) => (
            <div key={item} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700">
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">{getText(language, "ethicsTitle")}</h2>
          <p className="mt-3 text-slate-600">{getText(language, "ethicsText")}</p>
        </div>
      </section>

      <section id="form" className="mx-auto max-w-5xl px-4 py-10 md:px-8">
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm md:p-8">
          <h2 className="text-2xl font-bold text-slate-900">{getText(language, "formTitle")}</h2>
          <p className="mt-2 text-slate-600">{getText(language, "formDescription")}</p>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">{getText(language, "formLanguage")}</span>
                <select
                  value={form.form_language}
                  onChange={(e) => handleLanguageSelect(e.target.value as LanguageCode)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-500"
                >
                  {languages.map((item) => (
                    <option key={item.code} value={item.code}>{item.label}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">{getText(language, "fullName")}</span>
                <input
                  required
                  value={form.full_name}
                  onChange={(e) => handleFieldChange("full_name", e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-slate-500"
                />
              </label>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">{getText(language, "phone")}</span>
                <input
                  required
                  value={form.phone}
                  onChange={(e) => handleFieldChange("phone", e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-slate-500"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">{getText(language, "email")}</span>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => handleFieldChange("email", e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-slate-500"
                />
              </label>
            </div>

            <div>
              <span className="mb-3 block text-sm font-medium text-slate-700">{getText(language, "cvType")}</span>
              <div className="grid gap-3 md:grid-cols-2">
                {[
                  { label: getText(language, "generalChoice"), value: "General CV" },
                  { label: getText(language, "targetedChoice"), value: "CV targeted to a specific job" },
                ].map((option) => (
                  <label key={option.value} className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 p-4">
                    <input
                      type="radio"
                      checked={form.cv_type === option.value}
                      onChange={() => handleFieldChange("cv_type", option.value)}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {isTargeted && (
              <div className="grid gap-5 rounded-2xl bg-slate-50 p-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">{getText(language, "targetJobTitle")}</span>
                  <input
                    value={form.target_job_title}
                    onChange={(e) => handleFieldChange("target_job_title", e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-500"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">{getText(language, "companyName")}</span>
                  <input
                    value={form.company_name}
                    onChange={(e) => handleFieldChange("company_name", e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-500"
                  />
                </label>
                <label className="block md:col-span-2">
                  <span className="mb-2 block text-sm font-medium text-slate-700">{getText(language, "jobUrl")}</span>
                  <input
                    value={form.job_url}
                    onChange={(e) => handleFieldChange("job_url", e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-500"
                  />
                </label>
                <label className="block md:col-span-2">
                  <span className="mb-2 block text-sm font-medium text-slate-700">{getText(language, "jobDescription")}</span>
                  <textarea
                    rows={5}
                    value={form.job_description_text}
                    onChange={(e) => handleFieldChange("job_description_text", e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-500"
                  />
                </label>
                <label className="block md:col-span-2">
                  <span className="mb-2 block text-sm font-medium text-slate-700">{getText(language, "uploadJobDescription")}</span>
                  <input
                    type="file"
                    onChange={(e) => handleFieldChange("current_cv_file", e.target.files?.[0] ?? null)}
                    className="w-full rounded-xl border border-dashed border-slate-300 bg-white p-3 text-sm"
                  />
                </label>
                <div className="md:col-span-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  {getText(language, "note")}
                </div>
              </div>
            )}

            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">{getText(language, "professionalField")}</span>
                <select
                  value={form.professional_field}
                  onChange={(e) => handleFieldChange("professional_field", e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-500"
                >
                  {professionalFields.map((field) => (
                    <option key={field} value={field}>{field}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">{getText(language, "targetRole")}</span>
                <input
                  value={form.target_role}
                  onChange={(e) => handleFieldChange("target_role", e.target.value)}
                  placeholder="Digital Marketing Manager, Accountant, HR Officer..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-500"
                />
              </label>
            </div>

            <div>
              <span className="mb-3 block text-sm font-medium text-slate-700">{getText(language, "cvLanguages")}</span>
              <div className="grid gap-3 sm:grid-cols-3">
                {[1, 2, 3].map((count) => (
                  <label key={count} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 p-3">
                    <input
                      type="radio"
                      checked={form.cv_language_count === count}
                      onChange={() => {
                        handleFieldChange("cv_language_count", count);
                        const selected = count === 1 ? ["French"] : count === 2 ? ["French", "English"] : ["Arabic", "French", "English"];
                        handleFieldChange("selected_cv_languages", selected);
                      }}
                    />
                    <span className="text-sm font-medium">
                      {count === 1 ? getText(language, "oneLanguage") : count === 2 ? getText(language, "twoLanguages") : getText(language, "threeLanguages")}
                    </span>
                  </label>
                ))}
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {cvLanguageOptions.map((languageOption) => (
                  <label key={languageOption} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 p-3">
                    <input
                      type="checkbox"
                      checked={form.selected_cv_languages.includes(languageOption)}
                      onChange={() => {
                        const next = form.selected_cv_languages.includes(languageOption)
                          ? form.selected_cv_languages.filter((item) => item !== languageOption)
                          : [...form.selected_cv_languages, languageOption];
                        handleFieldChange("selected_cv_languages", next.slice(0, form.cv_language_count));
                      }}
                    />
                    <span>{languageOption}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <span className="mb-3 block text-sm font-medium text-slate-700">{getText(language, "hasCurrentCv")}</span>
              <div className="flex gap-4">
                {[
                  { label: getText(language, "yes"), value: "Yes" },
                  { label: getText(language, "no"), value: "No" },
                ].map((option) => (
                  <label key={option.value} className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={form.has_current_cv === option.value}
                      onChange={() => handleFieldChange("has_current_cv", option.value)}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
              {form.has_current_cv === "Yes" && (
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="block md:col-span-2">
                    <span className="mb-2 block text-sm font-medium text-slate-700">{getText(language, "uploadCurrentCv")}</span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => handleFieldChange("current_cv_file", e.target.files?.[0] ?? null)}
                      className="w-full rounded-xl border border-dashed border-slate-300 bg-white p-3 text-sm"
                    />
                  </label>
                  <label className="block md:col-span-2">
                    <span className="mb-2 block text-sm font-medium text-slate-700">{getText(language, "optionalLink")}</span>
                    <input
                      value={form.optional_cv_link}
                      onChange={(e) => handleFieldChange("optional_cv_link", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-500"
                    />
                  </label>
                </div>
              )}
            </div>

            <div>
              <span className="mb-3 block text-sm font-medium text-slate-700">{getText(language, "tools")}</span>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {fieldTools.map((tool) => (
                  <label key={tool} className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 text-sm">
                    <input
                      type="checkbox"
                      checked={form.tools.includes(tool)}
                      onChange={() => {
                        const next = form.tools.includes(tool)
                          ? form.tools.filter((item) => item !== tool)
                          : [...form.tools, tool];
                        handleFieldChange("tools", next);
                      }}
                    />
                    <span>{tool}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <span className="mb-3 block text-sm font-medium text-slate-700">{getText(language, "languagesSpoken")}</span>
              <div className="space-y-3">
                {form.spoken_languages.map((entry, index) => (
                  <div key={`${entry.language}-${index}`} className="grid gap-3 md:grid-cols-2">
                    <select
                      value={entry.language}
                      onChange={(e) => {
                        const next = [...form.spoken_languages];
                        next[index] = { ...next[index], language: e.target.value };
                        handleFieldChange("spoken_languages", next);
                      }}
                      className="rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-500"
                    >
                      {[
                        "Arabic",
                        "French",
                        "English",
                        "Spanish",
                        "German",
                        "Italian",
                        "Other",
                      ].map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                    <select
                      value={entry.level}
                      onChange={(e) => {
                        const next = [...form.spoken_languages];
                        next[index] = { ...next[index], level: e.target.value };
                        handleFieldChange("spoken_languages", next);
                      }}
                      className="rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-500"
                    >
                      {languageLevels.map((level) => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => handleFieldChange("spoken_languages", [...form.spoken_languages, { language: "Arabic", level: "A1" }])}
                  className="rounded-full border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
                >
                  Add language
                </button>
              </div>
            </div>

            <div>
              <span className="mb-3 block text-sm font-medium text-slate-700">{getText(language, "certifications")}</span>
              <div className="flex gap-4">
                {[
                  { label: getText(language, "yes"), value: "Yes" },
                  { label: getText(language, "no"), value: "No" },
                ].map((option) => (
                  <label key={option.value} className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={form.has_certifications === option.value}
                      onChange={() => handleFieldChange("has_certifications", option.value)}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
              {form.has_certifications === "Yes" && (
                <div className="mt-4 space-y-4">
                  <textarea
                    rows={3}
                    value={form.certifications_text}
                    onChange={(e) => handleFieldChange("certifications_text", e.target.value)}
                    placeholder="Certification or training name"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-500"
                  />
                  <input
                    type="file"
                    onChange={(e) => handleFieldChange("certifications_file", e.target.files?.[0] ?? null)}
                    className="w-full rounded-xl border border-dashed border-slate-300 bg-white p-3 text-sm"
                  />
                  <input
                    value={form.certifications_link}
                    onChange={(e) => handleFieldChange("certifications_link", e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-500"
                    placeholder="Optional link"
                  />
                </div>
              )}
            </div>

            <div>
              <span className="mb-3 block text-sm font-medium text-slate-700">{getText(language, "designPreference")}</span>
              <div className="space-y-3">
                {designPreferences.map((option) => (
                  <label key={option} className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3">
                    <input
                      type="radio"
                      checked={form.cv_design_preference === option}
                      onChange={() => handleFieldChange("cv_design_preference", option)}
                    />
                    <span className="text-sm">{option}</span>
                  </label>
                ))}
              </div>
              {form.cv_design_preference === "I have a specific template" && (
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <input
                    type="file"
                    onChange={(e) => handleFieldChange("cv_template_file", e.target.files?.[0] ?? null)}
                    className="w-full rounded-xl border border-dashed border-slate-300 bg-white p-3 text-sm"
                  />
                  <input
                    value={form.cv_template_link}
                    onChange={(e) => handleFieldChange("cv_template_link", e.target.value)}
                    placeholder="Template link"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-500"
                  />
                </div>
              )}
            </div>

            <div className="space-y-3">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">{getText(language, "missingInfo")}</span>
                <textarea
                  rows={3}
                  value={form.additional_information}
                  onChange={(e) => handleFieldChange("additional_information", e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-500"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">{getText(language, "excludedInfo")}</span>
                <textarea
                  rows={3}
                  value={form.excluded_information}
                  onChange={(e) => handleFieldChange("excluded_information", e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-500"
                />
              </label>
            </div>

            <div>
              <span className="mb-3 block text-sm font-medium text-slate-700">{getText(language, "recruitmentConsent")}</span>
              <div className="space-y-3">
                {[
                  { label: getText(language, "recruitmentYes"), value: "Yes" },
                  { label: getText(language, "recruitmentNo"), value: "No" },
                ].map((option) => (
                  <label key={option.value} className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3">
                    <input
                      type="radio"
                      checked={form.recruitment_consent === option.value}
                      onChange={() => handleFieldChange("recruitment_consent", option.value)}
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
              </div>
              <p className="mt-3 text-sm text-slate-600">{getText(language, "recruitmentNote")}</p>
            </div>

            <label className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4 text-sm text-slate-700">
              <input
                required
                type="checkbox"
                checked={form.final_consent}
                onChange={(e) => handleFieldChange("final_consent", e.target.checked)}
              />
              <span>{getText(language, "finalConsent")}</span>
            </label>

            {status && <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{status}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Submitting..." : getText(language, "submit")}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
