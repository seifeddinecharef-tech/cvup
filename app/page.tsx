"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  professionalFields,
  commonToolsByField,
  collaborationTypesByField,
  cvLanguageOptions,
  designPreferences,
  languageLevels,
  platformsByField,
  professionalEvidenceByField,
  getFormOptionLabel,
} from "@/lib/forms";
import { getText, languages, type LanguageCode } from "@/lib/i18n";
import { getSupabaseBrowserClient } from "@/lib/supabase-client";

const supportingQuestionKeys = [
  "achievements",
  "additional_experience",
  "missing_information",
  "excluded_information",
  "additional_professional_information",
] as const;

type SupportingQuestionKey = (typeof supportingQuestionKeys)[number];

type SupportingMaterialPayload = {
  question_key: SupportingQuestionKey;
  link: string | null;
  file_path?: string | null;
  file_name?: string | null;
  file_type?: string | null;
};

const initialSupportingLinks: Record<SupportingQuestionKey, string> = Object.fromEntries(
  supportingQuestionKeys.map((key) => [key, ""])
) as Record<SupportingQuestionKey, string>;

const initialSupportingFiles: Record<SupportingQuestionKey, File | null> = Object.fromEntries(
  supportingQuestionKeys.map((key) => [key, null])
) as Record<SupportingQuestionKey, File | null>;

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
  job_description_file: null as File | null,
  professional_field: "Marketing / Communication",
  target_role: "",
  cv_language_count: 1,
  selected_cv_languages: ["French"],
  has_current_cv: "Yes",
  current_cv_file: null as File | null,
  optional_cv_link: "",
  tools: [] as string[],
  spoken_languages: [{ language: "Arabic", level: "Native", professional_writing: false, language_other: "", level_other: "" }],
  professional_evidence: [] as string[],
  professional_evidence_other: "",
  platforms_worked_with: [] as string[],
  platforms_other: "",
  tools_other: "",
  has_measurable_achievements: "No",
  measurable_achievements_text: "",
  has_additional_experience: "No",
  additional_experience_text: "",
  collaboration_types: [] as string[],
  collaboration_other: "",
  current_country: "",
  nationality: "",
  willing_to_relocate: "No",
  target_countries: "",
  work_authorization: "Not sure",
  work_authorization_other: "",
  additional_professional_information: "",
  cv_design_preference_other: "",
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

function CvUpLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`brand-logo-circle ${compact ? "brand-logo-circle--compact" : ""}`}>
      <Image
        src="/brand/cvup-logo.png"
        alt="CVUp"
        width={compact ? 42 : 92}
        height={compact ? 42 : 92}
        className="brand-logo"
        priority={compact}
      />
    </span>
  );
}

function WhatsAppIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="whatsapp-icon"><path d="M19.05 4.93A9.88 9.88 0 0 0 12.02 2C6.56 2 2.12 6.43 2.12 11.9c0 1.75.46 3.46 1.34 4.96L2 22l5.28-1.39a9.9 9.9 0 0 0 4.74 1.2h.01c5.46 0 9.89-4.44 9.89-9.9 0-2.65-1.03-5.14-2.87-6.98Zm-7.03 15.2h-.01a8.22 8.22 0 0 1-4.19-1.15l-.3-.18-3.14.83.84-3.06-.2-.31a8.2 8.2 0 0 1-1.26-4.36c0-4.53 3.69-8.22 8.23-8.22a8.18 8.18 0 0 1 5.82 2.41 8.18 8.18 0 0 1 2.4 5.83c0 4.53-3.69 8.21-8.19 8.21Zm4.5-6.15c-.25-.13-1.47-.73-1.7-.81-.23-.08-.39-.13-.55.13-.16.25-.63.81-.77.98-.14.16-.28.19-.53.06-.25-.13-1.05-.39-2-1.24-.74-.66-1.24-1.47-1.38-1.72-.14-.25-.01-.39.11-.52.11-.11.25-.28.37-.42.13-.14.17-.25.25-.41.08-.16.04-.3-.02-.42-.06-.13-.55-1.34-.76-1.84-.2-.48-.4-.41-.55-.42h-.47c-.16 0-.42.06-.64.3-.22.25-.84.82-.84 2.02s.86 2.34.98 2.5c.12.16 1.68 2.57 4.07 3.6.57.25 1.01.4 1.36.51.57.18 1.09.15 1.5.09.46-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.22-.16-.47-.29Z" /></svg>;
}

export default function HomePage() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const sofizpayUrl = process.env.NEXT_PUBLIC_SOFIZPAY_PAYMENT_URL?.trim();
  const [language, setLanguage] = useState<LanguageCode>("fr");
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFloatingCta, setShowFloatingCta] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [supportingLinks, setSupportingLinks] = useState(initialSupportingLinks);
  const [supportingFiles, setSupportingFiles] = useState(initialSupportingFiles);
  const formRef = useRef<HTMLFormElement>(null);

  const wizardSteps = [
    { ar: "بياناتك الشخصية", fr: "Vos informations", en: "Personal details" },
    { ar: "هدف السيرة الذاتية", fr: "Votre objectif", en: "CV target" },
    { ar: "الخبرة المهنية", fr: "Expérience professionnelle", en: "Professional experience" },
    { ar: "المهارات والأدوات", fr: "Compétences et outils", en: "Skills & tools" },
    { ar: "اللغات والشهادات", fr: "Langues et certifications", en: "Languages & certifications" },
    { ar: "الملفات والتفضيلات", fr: "Documents et préférences", en: "Files & preferences" },
    { ar: "مراجعة الطلب", fr: "Vérification", en: "Review" },
  ] as const;
  const stepTitle = (step: (typeof wizardSteps)[number]) => step[language];
  const optionLabel = (value: string) => getFormOptionLabel(value, language);
  const ui = (ar: string, fr: string, en: string) => language === "ar" ? ar : language === "fr" ? fr : en;

  useEffect(() => {
    document.getElementById("wizard-step-title")?.focus();
  }, [currentStep]);

  function validateCurrentStep() {
    if (!formRef.current || currentStep === 7) return true;
    const fields = Array.from(formRef.current.querySelectorAll<HTMLElement>(`[data-wizard-step="${currentStep}"] input, [data-wizard-step="${currentStep}"] select, [data-wizard-step="${currentStep}"] textarea`));
    const invalid = fields.find((field) => field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement ? !field.checkValidity() : false);
    if (invalid && "reportValidity" in invalid) {
      (invalid as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).reportValidity();
      return false;
    }
    return true;
  }

  function moveStep(direction: 1 | -1) {
    if (direction === 1 && !validateCurrentStep()) return;
    setCurrentStep((step) => Math.min(7, Math.max(1, step + direction)));
    document.getElementById("form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const reviewValue = (value: unknown) => {
    if (Array.isArray(value)) return value.length ? value.map((item) => typeof item === "string" ? optionLabel(item) : String(item)).join(", ") : "—";
    if (typeof value === "boolean") return value ? getText(language, "yes") : getText(language, "no");
    if (typeof value === "string") return value ? optionLabel(value) : "—";
    return value === null || value === undefined ? "—" : String(value);
  };
  const fileName = (file: File | null) => file?.name || "—";
  const reviewGroups = [
    { step: 1, title: stepTitle(wizardSteps[0]), values: [[ui("الاسم", "Nom", "Name"), form.full_name], [ui("الهاتف", "Téléphone", "Phone"), form.phone], [ui("البريد", "E-mail", "Email"), form.email]] },
    { step: 2, title: stepTitle(wizardSteps[1]), values: [[ui("نوع السيرة", "Type de CV", "CV type"), form.cv_type], [ui("الدور", "Rôle", "Role"), form.target_role], [ui("المجال", "Domaine", "Field"), form.professional_field], [ui("الوظيفة", "Poste visé", "Job title"), form.target_job_title], [ui("الشركة", "Entreprise", "Company"), form.company_name], [ui("ملف وصف الوظيفة", "Fichier de l’offre", "Job description file"), fileName(form.job_description_file)]] },
    { step: 3, title: stepTitle(wizardSteps[2]), values: [[ui("المسؤوليات", "Responsabilités", "Responsibilities"), form.professional_evidence], [ui("الإنجازات", "Réalisations", "Achievements"), form.measurable_achievements_text], [ui("خبرة إضافية", "Expérience complémentaire", "Additional experience"), form.additional_experience_text]] },
    { step: 4, title: stepTitle(wizardSteps[3]), values: [[ui("الأدوات", "Outils", "Tools"), form.tools], [ui("المنصات", "Plateformes", "Platforms"), form.platforms_worked_with]] },
    { step: 5, title: stepTitle(wizardSteps[4]), values: [[ui("اللغات", "Langues", "Languages"), form.spoken_languages.map((entry) => `${optionLabel(entry.language === "Other" ? entry.language_other || entry.language : entry.language)} (${optionLabel(entry.level === "Other" ? entry.level_other || entry.level : entry.level)})`)], [ui("الشهادات", "Certifications", "Certifications"), form.certifications_text], [ui("ملف الشهادة", "Fichier de certification", "Certification file"), fileName(form.certifications_file)]] },
    { step: 6, title: stepTitle(wizardSteps[5]), values: [[ui("ملف CV", "Fichier CV", "CV file"), fileName(form.current_cv_file)], [ui("لغات CV", "Langues du CV", "CV languages"), form.selected_cv_languages], [ui("التصميم", "Design", "Design"), form.cv_design_preference], [ui("ملف القالب", "Fichier modèle", "Template file"), fileName(form.cv_template_file)], [ui("البلد", "Pays", "Country"), form.current_country]] },
  ];

  useEffect(() => {
    const formElement = document.getElementById("form");
    if (!formElement) return;
    const observer = new IntersectionObserver(([entry]) => setShowFloatingCta(!entry.isIntersecting), { threshold: 0.08 });
    observer.observe(formElement);
    return () => observer.disconnect();
  }, []);

  const fieldTools = useMemo(
    () => commonToolsByField[form.professional_field] ?? commonToolsByField["Other"],
    [form.professional_field]
  );
  const fieldEvidence = useMemo(
    () => professionalEvidenceByField[form.professional_field] ?? professionalEvidenceByField.Other,
    [form.professional_field]
  );
  const fieldPlatforms = platformsByField[form.professional_field];
  const fieldCollaborations = collaborationTypesByField[form.professional_field];

  const handleFieldChange = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const supportingMaterialFields = (questionKey: SupportingQuestionKey) => (
    <div className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-3">
      <p className="mb-3 text-sm text-slate-600">
        {ui(
          "يمكنك إضافة رابط أو تحميل ملف داعم، وكلاهما اختياري. الحد الأقصى للملف 10 MB.",
          "Vous pouvez ajouter un lien ou téléverser un fichier justificatif. Les deux sont facultatifs. Taille maximale : 10 Mo.",
          "You can add a link or upload a supporting file. Both are optional. Maximum file size: 10 MB."
        )}
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        <input
          type="url"
          value={supportingLinks[questionKey]}
          onChange={(event) => setSupportingLinks((current) => ({ ...current, [questionKey]: event.target.value }))}
          placeholder={ui("رابط اختياري", "Lien facultatif", "Optional link")}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-500"
        />
        <label className="block">
          <span className="sr-only">{ui("تحميل ملف داعم", "Téléverser un fichier justificatif", "Upload supporting file")}</span>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.webp"
            onChange={(event) => setSupportingFiles((current) => ({ ...current, [questionKey]: event.target.files?.[0] ?? null }))}
            className="w-full rounded-xl border border-dashed border-slate-300 bg-white p-3 text-sm"
          />
        </label>
      </div>
    </div>
  );

  const handleLanguageSelect = (code: LanguageCode) => {
    setLanguage(code);
    setForm((current) => ({ ...current, form_language: code }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    try {
      const allFiles = [
        form.current_cv_file,
        form.job_description_file,
        form.certifications_file,
        form.cv_template_file,
        ...Object.values(supportingFiles),
      ].filter((file): file is File => file instanceof File);

      if (allFiles.some((file) => file.size > 10 * 1024 * 1024)) {
        throw new Error(ui(
          "حجم كل ملف يجب ألا يتجاوز 10 MB.",
          "Chaque fichier doit faire au maximum 10 Mo.",
          "Each file must be 10 MB or smaller."
        ));
      }

      const {
        current_cv_file,
        job_description_file,
        certifications_file,
        cv_template_file,
        ...serializableForm
      } = form;

      const initialMaterials: SupportingMaterialPayload[] = supportingQuestionKeys
        .map((questionKey) => ({
          question_key: questionKey,
          link: supportingLinks[questionKey].trim() || null,
        }))
        .filter((item) => item.link);

      const body = {
        ...serializableForm,
        recruitment_consent: form.recruitment_consent === "Yes",
        final_consent: form.final_consent,
        supporting_materials: initialMaterials,
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

      const requestCode = typeof result?.request_code === "string" ? result.request_code : "";
      const requestId = typeof result?.id === "string" ? result.id : "";
      const submissionToken = typeof result?.submission_token === "string" ? result.submission_token : "";

      if (!requestCode || !requestId || !submissionToken) {
        throw new Error(ui(
          "تم إنشاء الطلب لكن تعذر تجهيز رفع الملفات.",
          "La demande a été créée, mais le téléversement des fichiers n’a pas pu être préparé.",
          "The request was created, but file upload could not be prepared."
        ));
      }

      const uploadFile = async (file: File, kind: string) => {
        const prepareResponse = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requestId,
            kind,
            token: submissionToken,
            fileName: file.name,
            fileType: file.type || null,
            fileSize: file.size,
          }),
        });
        const prepared = await prepareResponse.json();

        if (!prepareResponse.ok || !prepared?.path || !prepared?.upload_token) {
          throw new Error(prepared?.error || ui(
            "تعذر تجهيز رفع أحد الملفات.",
            "Impossible de préparer le téléversement d’un fichier.",
            "A file upload could not be prepared."
          ));
        }

        const { error: storageError } = await supabase.storage
          .from("cvup-requests")
          .uploadToSignedUrl(prepared.path, prepared.upload_token, file, {
            cacheControl: "3600",
            contentType: prepared.content_type || file.type || undefined,
          });

        if (storageError) {
          throw new Error(ui(
            "تعذر رفع أحد الملفات إلى التخزين.",
            "Le téléversement d’un fichier vers le stockage a échoué.",
            "A file could not be uploaded to storage."
          ));
        }

        const finalizeResponse = await fetch("/api/upload", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requestId,
            kind,
            token: submissionToken,
            path: prepared.path,
            fileName: file.name,
            fileType: prepared.content_type || file.type || null,
            fileSize: file.size,
          }),
        });
        const finalized = await finalizeResponse.json();

        if (!finalizeResponse.ok) {
          throw new Error(finalized?.error || ui(
            "تم رفع الملف لكن تعذر حفظ معلوماته.",
            "Le fichier a été téléversé mais ses informations n’ont pas pu être enregistrées.",
            "The file was uploaded, but its metadata could not be saved."
          ));
        }

        return {
          path: String(prepared.path),
          file_name: file.name,
          file_type: prepared.content_type || file.type || null,
        };
      };

      const primaryFiles: Array<{ file: File | null; kind: string }> = [
        { file: current_cv_file, kind: "current_cv" },
        { file: job_description_file, kind: "job_description" },
        { file: certifications_file, kind: "certifications" },
        { file: cv_template_file, kind: "template" },
      ];

      for (const item of primaryFiles) {
        if (item.file) await uploadFile(item.file, item.kind);
      }

      const materials = [...initialMaterials];

      for (const questionKey of supportingQuestionKeys) {
        const file = supportingFiles[questionKey];
        if (!file) continue;

        const uploadResult = await uploadFile(file, `supporting:${questionKey}`);
        const existingIndex = materials.findIndex((item) => item.question_key === questionKey);
        const material: SupportingMaterialPayload = {
          question_key: questionKey,
          link: supportingLinks[questionKey].trim() || null,
          file_path: String(uploadResult.path),
          file_name: uploadResult.file_name || file.name,
          file_type: uploadResult.file_type || file.type || null,
        };

        if (existingIndex >= 0) materials[existingIndex] = material;
        else materials.push(material);
      }

      if (materials.length) {
        const materialsResponse = await fetch(`/api/requests/${encodeURIComponent(requestCode)}/supporting-materials`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${submissionToken}`,
          },
          body: JSON.stringify({ materials }),
        });

        if (!materialsResponse.ok) {
          throw new Error(ui(
            "تم إنشاء الطلب لكن تعذر حفظ المرفقات الداعمة.",
            "La demande a été créée, mais les pièces justificatives n’ont pas pu être enregistrées.",
            "The request was created, but the supporting materials could not be saved."
          ));
        }
      }

      setStatus(ui(`تم إرسال الطلب: ${requestCode}`, `Demande envoyée : ${requestCode}`, `Request submitted: ${requestCode}`));
      router.push(`/success?request_code=${encodeURIComponent(requestCode)}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to submit your request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isTargeted = form.cv_type === "CV targeted to a specific job";

  return (
    <main className="site-shell min-h-screen text-slate-900" dir={language === "ar" ? "rtl" : "ltr"}>
      <header className="site-header sticky top-0 z-20">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-8">
          <a href="#top" className="brand-lockup" aria-label="CVUp home">
            <CvUpLogo compact />
            <span className="brand-word">CVUp</span>
          </a>
          <div className="header-actions">
            <a className="header-contact hidden sm:inline-flex" href="https://wa.me/213794851081" target="_blank" rel="noreferrer">WhatsApp</a>
            <div className="language-switcher">
            {languages.map((item) => (
              <button
                key={item.code}
                type="button"
                onClick={() => handleLanguageSelect(item.code as LanguageCode)}
                className={`language-button ${
                  language === item.code ? "language-button--active" : ""
                }`}
              >
                {item.label}
              </button>
            ))}
            </div>
          </div>
        </div>
      </header>

      <section id="top" className="hero-band mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-16">
        <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="hero-brandline mb-5">
              <CvUpLogo />
              <span>Truth first / relevance / optimization</span>
            </div>
            <h1 className="hero-title max-w-2xl text-4xl font-bold text-slate-900 md:text-6xl">
              {getText(language, "heroTitle")}
            </h1>
            <p className="hero-copy mt-5 max-w-xl text-lg leading-8 text-slate-600">
              {getText(language, "heroText")}
            </p>
            <div className="price-lockup mt-7">
              <span className="price-amount">800 DA</span>
              <span className="price-arabic">800 دج</span>
              <span className="price-caption">{language === "ar" ? "سيرة ذاتية احترافية محسنة لطلبات التوظيف" : "CV professionnel optimisé pour vos candidatures"}</span>
            </div>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href="#form"
                className="button-primary inline-flex items-center justify-center"
              >
                {getText(language, "ctaPrimary")}
              </a>
              <a className="button-contact button-whatsapp" href="https://wa.me/213794851081" target="_blank" rel="noreferrer"><span aria-hidden="true">W</span>{language === "ar" ? "تواصل عبر واتساب" : "Contact WhatsApp"}</a>
              <a className="button-contact" href="tel:+213794851081"><span aria-hidden="true">☎</span>{language === "ar" ? "اتصل الآن" : "Appeler maintenant"}</a>
            </div>
            <p className="mt-4 max-w-xl text-sm text-slate-600">{getText(language, "ctaSecondary")}</p>
          </div>

          <div className="how-panel">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{getText(language, "sectionHow")}</p>
            <div className="mt-4 space-y-4">
              {[
                { num: 1, text: getText(language, "step1") },
                { num: 2, text: getText(language, "step2") },
                { num: 3, text: getText(language, "step3") },
              ].map((step) => (
                <div key={step.num} className="how-step">
                  <div className="step-number">
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
        <div className="ethics-panel">
          <h2 className="text-2xl font-bold text-slate-900">{getText(language, "ethicsTitle")}</h2>
          <p className="mt-3 text-slate-600">{getText(language, "ethicsText")}</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="payment-panel">
          <div><p className="section-kicker">{language === "ar" ? "الدفع" : language === "fr" ? "Paiement" : "Payment"}</p><h2>{language === "ar" ? "دفع آمن وتأكيد يدوي" : language === "fr" ? "Paiement sécurisé et confirmation manuelle" : "Secure payment with manual confirmation"}</h2><p>{language === "ar" ? "بعد إرسال الطلب، نتواصل معك عبر واتساب لتأكيد الدفع ومتابعة معالجة طلبك." : language === "fr" ? "Après l’envoi de votre demande, nous vous contactons sur WhatsApp pour confirmer le paiement et poursuivre le traitement." : "After submitting your request, we contact you on WhatsApp to confirm payment and continue processing."}</p></div>
          {sofizpayUrl ? (
            <a className="button-contact button-sofizpay" href={sofizpayUrl} target="_blank" rel="noreferrer">{language === "ar" ? "ادفع عبر Sofizpay" : language === "fr" ? "Payer avec Sofizpay" : "Pay with Sofizpay"} <span aria-hidden="true">↗</span></a>
          ) : (
            <a className="button-contact button-sofizpay" href="https://wa.me/213794851081" target="_blank" rel="noreferrer">{language === "ar" ? "تواصل للدفع" : language === "fr" ? "Contacter pour payer" : "Contact to pay"} <span aria-hidden="true">↗</span></a>
          )}
        </div>
      </section>

      <section id="form" className="mx-auto max-w-5xl px-4 py-10 md:px-8">
        <div className="form-panel rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm md:p-8">
          <div className="section-kicker">{language === "ar" ? "CVUp / خطوتك المهنية القادمة" : language === "fr" ? "CVUp / votre prochaine étape professionnelle" : "CVUp / your next professional move"}</div>
          <h2 className="text-2xl font-bold text-slate-900">{language === "ar" ? "املأ طلب السيرة الذاتية الاحترافية" : language === "fr" ? "Remplissez votre demande de CV professionnel" : getText(language, "formTitle")}</h2>
          <p className="mt-2 text-slate-600">{getText(language, "formDescription")}</p>

          <div className="wizard-progress" aria-label="Form progress">
            <div className="wizard-mobile-progress"><span>{currentStep} / 7</span><strong>{stepTitle(wizardSteps[currentStep - 1])}</strong><div className="wizard-progress-track"><span style={{ width: `${(currentStep / 7) * 100}%` }} /></div></div>
            <nav className="wizard-sidebar" aria-label="Form steps">
              {wizardSteps.map((step, index) => {
                const number = index + 1;
                return <button key={step.en} type="button" className={`wizard-step-link ${number === currentStep ? "is-current" : ""} ${number < currentStep ? "is-complete" : ""}`} aria-current={number === currentStep ? "step" : undefined} onClick={() => number <= currentStep && setCurrentStep(number)}><span className="wizard-step-number">{number < currentStep ? "✓" : `0${number}`}</span><span>{stepTitle(step)}</span></button>;
              })}
            </nav>
            <div className="wizard-main">
              <div className="wizard-heading"><span className="wizard-overline">{currentStep} / 7 · {Math.round((currentStep / 7) * 100)}%</span><h3 id="wizard-step-title" tabIndex={-1}>{stepTitle(wizardSteps[currentStep - 1])}</h3><p>{language === "ar" ? "أكمل هذه الخطوة ثم تابع عندما تكون جاهزًا." : language === "fr" ? "Complétez cette étape, puis continuez quand vous êtes prêt." : "Complete this step, then continue when you are ready."}</p></div>
              <form ref={formRef} className="wizard-form mt-8 space-y-6" onSubmit={handleSubmit} data-current-step={currentStep}>
            <div data-wizard-step="1" className="grid gap-5 md:grid-cols-2">
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

            <div data-wizard-step="1" className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">{getText(language, "phone")}</span>
                <input
                  required
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  aria-required="true"
                  value={form.phone}
                  onChange={(e) => handleFieldChange("phone", e.target.value)}
                  placeholder={language === "ar" ? "مثال: +213 5XX XX XX XX" : language === "fr" ? "Ex. : +213 5XX XX XX XX" : "Example: +213 5XX XX XX XX"}
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

            <div data-wizard-step="2">
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
              <div data-wizard-step="2" className="grid gap-5 rounded-2xl bg-slate-50 p-4 md:grid-cols-2">
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
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={(e) => handleFieldChange("job_description_file", e.target.files?.[0] ?? null)}
                    className="w-full rounded-xl border border-dashed border-slate-300 bg-white p-3 text-sm"
                  />
                </label>
                <div className="md:col-span-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  {getText(language, "note")}
                </div>
              </div>
            )}

            <div data-wizard-step="2" className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">{getText(language, "professionalField")}</span>
                <select
                  value={form.professional_field}
                  onChange={(e) => handleFieldChange("professional_field", e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-500"
                >
                  {professionalFields.map((field) => (
                    <option key={field} value={field}>{optionLabel(field)}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">{getText(language, "targetRole")}</span>
                <input
                  value={form.target_role}
                  onChange={(e) => handleFieldChange("target_role", e.target.value)}
                  placeholder={language === "ar" ? "مثال: مدير تسويق رقمي، محاسب، مسؤول موارد بشرية..." : language === "fr" ? "Ex. : Responsable marketing digital, Comptable, Chargé RH..." : "Digital Marketing Manager, Accountant, HR Officer..."}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-500"
                />
              </label>
            </div>

            <div data-wizard-step="6">
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
                    <span>{optionLabel(languageOption)}</span>
                  </label>
                ))}
              </div>
            </div>

            <div data-wizard-step="6">
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

            <div data-wizard-step="3">
              <h3 className="text-lg font-bold text-slate-900">{getText(language, "professionalEvidenceTitle")}</h3>
              <p className="mt-2 text-sm text-slate-600">{getText(language, "professionalEvidenceHelper")}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {fieldEvidence.map((item) => (
                  <label key={item} className="flex items-start gap-2 rounded-xl border border-slate-200 p-3 text-sm">
                    <input
                      type="checkbox"
                      checked={form.professional_evidence.includes(item)}
                      onChange={() => {
                        const next = form.professional_evidence.includes(item)
                          ? form.professional_evidence.filter((value) => value !== item)
                          : [...form.professional_evidence, item];
                        handleFieldChange("professional_evidence", next);
                      }}
                    />
                    <span>{item === "Other" ? getText(language, "professionalEvidenceOther") : optionLabel(item)}</span>
                  </label>
                ))}
              </div>
              {form.professional_evidence.includes("Other") && (
                <input
                  value={form.professional_evidence_other}
                  onChange={(e) => handleFieldChange("professional_evidence_other", e.target.value)}
                  placeholder={getText(language, "otherSpecify")}
                  className="mt-4 w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-slate-500"
                />
              )}
            </div>

            {fieldPlatforms && (
              <div data-wizard-step="4">
                <h3 className="text-lg font-bold text-slate-900">{getText(language, "platformsTitle")}</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {fieldPlatforms.map((item) => (
                    <label key={item} className="flex items-start gap-2 rounded-xl border border-slate-200 p-3 text-sm">
                      <input
                        type="checkbox"
                        checked={form.platforms_worked_with.includes(item)}
                        onChange={() => {
                          const next = form.platforms_worked_with.includes(item)
                            ? form.platforms_worked_with.filter((value) => value !== item)
                            : [...form.platforms_worked_with, item];
                          handleFieldChange("platforms_worked_with", next);
                        }}
                      />
                      <span>{item === "Other" ? getText(language, "platformsOther") : optionLabel(item)}</span>
                    </label>
                  ))}
                </div>
                {form.platforms_worked_with.includes("Other") && (
                  <input
                    value={form.platforms_other}
                    onChange={(e) => handleFieldChange("platforms_other", e.target.value)}
                    placeholder={getText(language, "otherSpecify")}
                    className="mt-4 w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-slate-500"
                  />
                )}
              </div>
            )}

            <div data-wizard-step="4">
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
                    <span>{optionLabel(tool)}</span>
                  </label>
                ))}
              </div>
              {form.tools.includes("Other") && (
                <input
                  value={form.tools_other}
                  onChange={(e) => handleFieldChange("tools_other", e.target.value)}
                  placeholder={getText(language, "toolsOther")}
                  className="mt-4 w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-slate-500"
                />
              )}
            </div>

            <div data-wizard-step="3">
              <h3 className="text-lg font-bold text-slate-900">{getText(language, "achievementsTitle")}</h3>
              <div className="mt-3 flex gap-4">
                {["Yes", "No"].map((value) => (
                  <label key={value} className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={form.has_measurable_achievements === value}
                      onChange={() => handleFieldChange("has_measurable_achievements", value)}
                    />
                    <span>{value === "Yes" ? getText(language, "yes") : getText(language, "no")}</span>
                  </label>
                ))}
              </div>
              {form.has_measurable_achievements === "Yes" && (
                <>
                  <p className="mt-3 text-sm text-slate-600">{getText(language, "achievementsHelper")}</p>
                  <textarea
                    rows={4}
                    value={form.measurable_achievements_text}
                    onChange={(e) => handleFieldChange("measurable_achievements_text", e.target.value)}
                    placeholder={getText(language, "achievementsPlaceholder")}
                    className="mt-3 w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-slate-500"
                  />
                  {supportingMaterialFields("achievements")}
                </>
              )}
            </div>

            <div data-wizard-step="3">
              <h3 className="text-lg font-bold text-slate-900">{getText(language, "additionalExperienceTitle")}</h3>
              <div className="mt-3 flex gap-4">
                {["Yes", "No"].map((value) => (
                  <label key={value} className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={form.has_additional_experience === value}
                      onChange={() => handleFieldChange("has_additional_experience", value)}
                    />
                    <span>{value === "Yes" ? getText(language, "yes") : getText(language, "no")}</span>
                  </label>
                ))}
              </div>
              {form.has_additional_experience === "Yes" && (
                <>
                  <textarea
                    rows={4}
                    value={form.additional_experience_text}
                    onChange={(e) => handleFieldChange("additional_experience_text", e.target.value)}
                    placeholder={getText(language, "additionalExperiencePlaceholder")}
                    className="mt-3 w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-slate-500"
                  />
                  {supportingMaterialFields("additional_experience")}
                </>
              )}
            </div>

            {fieldCollaborations && (
              <div data-wizard-step="3">
                <h3 className="text-lg font-bold text-slate-900">{getText(language, "collaborationTitle")}</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {fieldCollaborations.map((item) => (
                    <label key={item} className="flex items-start gap-2 rounded-xl border border-slate-200 p-3 text-sm">
                      <input
                        type="checkbox"
                        checked={form.collaboration_types.includes(item)}
                        onChange={() => {
                          const next = form.collaboration_types.includes(item)
                            ? form.collaboration_types.filter((value) => value !== item)
                            : [...form.collaboration_types, item];
                          handleFieldChange("collaboration_types", next);
                        }}
                      />
                      <span>{item === "Other" ? getText(language, "collaborationOther") : optionLabel(item)}</span>
                    </label>
                  ))}
                </div>
                {form.collaboration_types.includes("Other") && (
                  <input
                    value={form.collaboration_other}
                    onChange={(e) => handleFieldChange("collaboration_other", e.target.value)}
                    placeholder={getText(language, "otherSpecify")}
                    className="mt-4 w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-slate-500"
                  />
                )}
              </div>
            )}

            <div data-wizard-step="6" className="rounded-2xl bg-slate-50 p-4">
              <h3 className="text-lg font-bold text-slate-900">{getText(language, "eligibilityTitle")}</h3>
              <p className="mt-2 text-sm text-slate-600">{getText(language, "eligibilityNote")}</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">{getText(language, "currentCountry")}</span>
                  <input value={form.current_country} onChange={(e) => handleFieldChange("current_country", e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-500" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">{getText(language, "nationality")}</span>
                  <input value={form.nationality} onChange={(e) => handleFieldChange("nationality", e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-500" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">{getText(language, "willingToRelocate")}</span>
                  <select value={form.willing_to_relocate} onChange={(e) => handleFieldChange("willing_to_relocate", e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-500">
                    <option value="Yes">{getText(language, "yes")}</option>
                    <option value="No">{getText(language, "no")}</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">{getText(language, "workAuthorization")}</span>
                  <select value={form.work_authorization} onChange={(e) => handleFieldChange("work_authorization", e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-500">
                    {["Citizen / National", "Permanent resident", "Valid work permit", "Need employer sponsorship", "Not sure", "Other"].map((option) => <option key={option} value={option}>{option === "Other" ? getText(language, "workAuthorizationOther") : optionLabel(option)}</option>)}
                  </select>
                </label>
                {form.work_authorization === "Other" && <input value={form.work_authorization_other} onChange={(e) => handleFieldChange("work_authorization_other", e.target.value)} placeholder={getText(language, "otherSpecify")} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-500" />}
                <label className="block md:col-span-2">
                  <span className="mb-2 block text-sm font-medium text-slate-700">{getText(language, "targetCountries")}</span>
                  <input value={form.target_countries} onChange={(e) => handleFieldChange("target_countries", e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-500" />
                </label>
              </div>
            </div>

            <div data-wizard-step="5">
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
                        <option key={option} value={option}>{optionLabel(option)}</option>
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
                        <option key={level} value={level}>{optionLabel(level)}</option>
                      ))}
                    </select>
                    {entry.language === "Other" && (
                      <input
                        value={entry.language_other}
                        onChange={(e) => {
                          const next = [...form.spoken_languages];
                          next[index] = { ...next[index], language_other: e.target.value };
                          handleFieldChange("spoken_languages", next);
                        }}
                        placeholder={getText(language, "otherSpecify")}
                        className="rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-500"
                      />
                    )}
                    {entry.level === "Other" && (
                      <input
                        value={entry.level_other}
                        onChange={(e) => {
                          const next = [...form.spoken_languages];
                          next[index] = { ...next[index], level_other: e.target.value };
                          handleFieldChange("spoken_languages", next);
                        }}
                        placeholder={getText(language, "otherSpecify")}
                        className="rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-500"
                      />
                    )}
                    <label className="flex items-center gap-2 text-sm md:col-span-2">
                      <input
                        type="checkbox"
                        checked={entry.professional_writing}
                        onChange={(e) => {
                          const next = [...form.spoken_languages];
                          next[index] = { ...next[index], professional_writing: e.target.checked };
                          handleFieldChange("spoken_languages", next);
                        }}
                      />
                      <span>{getText(language, "professionalWriting")}</span>
                    </label>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => handleFieldChange("spoken_languages", [...form.spoken_languages, { language: "Arabic", level: "Intermediate", professional_writing: false, language_other: "", level_other: "" }])}
                  className="rounded-full border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
                >
                  {getText(language, "addLanguage")}
                </button>
              </div>
            </div>

            <div data-wizard-step="5">
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
                    placeholder={language === "ar" ? "اسم الشهادة أو التكوين" : language === "fr" ? "Nom de la certification ou de la formation" : "Certification or training name"}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-500"
                  />
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                    onChange={(e) => handleFieldChange("certifications_file", e.target.files?.[0] ?? null)}
                    className="w-full rounded-xl border border-dashed border-slate-300 bg-white p-3 text-sm"
                  />
                  <input
                    value={form.certifications_link}
                    onChange={(e) => handleFieldChange("certifications_link", e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-500"
                    placeholder={language === "ar" ? "رابط اختياري" : language === "fr" ? "Lien facultatif" : "Optional link"}
                  />
                </div>
              )}
            </div>

            <div data-wizard-step="6">
              <span className="mb-3 block text-sm font-medium text-slate-700">{getText(language, "designPreference")}</span>
              <div className="space-y-3">
                {designPreferences.map((option) => (
                  <label key={option} className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3">
                    <input
                      type="radio"
                      checked={form.cv_design_preference === option}
                      onChange={() => handleFieldChange("cv_design_preference", option)}
                    />
                    <span className="text-sm">{option === "Other" ? getText(language, "designOther") : optionLabel(option)}</span>
                  </label>
                ))}
              </div>
              {form.cv_design_preference === "I have a specific template" && (
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                    onChange={(e) => handleFieldChange("cv_template_file", e.target.files?.[0] ?? null)}
                    className="w-full rounded-xl border border-dashed border-slate-300 bg-white p-3 text-sm"
                  />
                  <input
                    value={form.cv_template_link}
                    onChange={(e) => handleFieldChange("cv_template_link", e.target.value)}
                    placeholder={language === "ar" ? "رابط القالب" : language === "fr" ? "Lien du modèle" : "Template link"}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-500"
                  />
                </div>
              )}
              {form.cv_design_preference === "Other" && (
                <input
                  value={form.cv_design_preference_other}
                  onChange={(e) => handleFieldChange("cv_design_preference_other", e.target.value)}
                  placeholder={getText(language, "otherSpecify")}
                  className="mt-4 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-500"
                />
              )}
            </div>

            <div data-wizard-step="6" className="space-y-3">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">{getText(language, "missingInfo")}</span>
                <textarea
                  rows={3}
                  value={form.additional_information}
                  onChange={(e) => handleFieldChange("additional_information", e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-500"
                />
                {supportingMaterialFields("missing_information")}
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">{getText(language, "excludedInfo")}</span>
                <textarea
                  rows={3}
                  value={form.excluded_information}
                  onChange={(e) => handleFieldChange("excluded_information", e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-500"
                />
                {supportingMaterialFields("excluded_information")}
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">{getText(language, "finalProfessionalInfo")}</span>
                <p className="mb-2 text-sm text-slate-600">{getText(language, "finalProfessionalInfoHelper")}</p>
                <textarea
                  rows={4}
                  value={form.additional_professional_information}
                  onChange={(e) => handleFieldChange("additional_professional_information", e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-slate-500"
                />
                {supportingMaterialFields("additional_professional_information")}
              </label>
            </div>

            <div data-wizard-step="6">
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

            <div data-wizard-step="7" className="review-grid">
              {reviewGroups.map((group) => <section key={group.step} className="review-card"><div className="review-card__heading"><h4>{group.title}</h4><button type="button" onClick={() => setCurrentStep(group.step)}>{language === "ar" ? "تعديل" : language === "fr" ? "Modifier" : "Edit"}</button></div>{group.values.map(([label, value]) => <div key={String(label)} className="review-row"><span>{label}</span><strong>{reviewValue(value)}</strong></div>)}</section>)}
              <div className="review-price"><span>{language === "ar" ? "السعر النهائي" : language === "fr" ? "Prix final" : "Final price"}</span><strong>{language === "ar" ? "800 دج" : "800 DA"}</strong></div>
            </div>

            <label data-wizard-step="7" className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4 text-sm text-slate-700">
              <input
                required
                type="checkbox"
                checked={form.final_consent}
                onChange={(e) => handleFieldChange("final_consent", e.target.checked)}
              />
              <span>{getText(language, "finalConsent")}</span>
            </label>

            {status && <p data-wizard-step="7" className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{status}</p>}

            <button
              data-wizard-step="7"
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (language === "ar" ? "جارٍ الإرسال..." : language === "fr" ? "Envoi en cours..." : "Submitting...") : getText(language, "submit")}
            </button>
          </form>
              <div className="wizard-controls"><button type="button" className="wizard-control wizard-control--back" onClick={() => moveStep(-1)} disabled={currentStep === 1}>{language === "ar" ? "السابق" : language === "fr" ? "Précédent" : "Back"}</button>{currentStep < 7 ? <button type="button" className="wizard-control wizard-control--next" onClick={() => moveStep(1)}>{language === "ar" ? "التالي" : language === "fr" ? "Continuer" : "Continue"}</button> : null}</div>
            </div>
          </div>
        </div>
      </section>
      <footer className="site-footer">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 md:flex-row md:items-center md:justify-between md:px-8">
          <div className="brand-lockup"><CvUpLogo compact /><span className="brand-word">CVUp</span></div>
          <p className="text-sm text-slate-500">Real experience. Better presentation.</p>
          <div className="social-links">
            <a href="https://www.facebook.com/profile.php?id=61594422910379" target="_blank" rel="noreferrer">Facebook</a>
            <a href="https://www.instagram.com/cvuptool/" target="_blank" rel="noreferrer">Instagram</a>
          </div>
        </div>
      </footer>
      {showFloatingCta ? <a className="floating-cta" href="#form">{language === "ar" ? "املأ الآن طلب السيرة الاحترافية" : language === "fr" ? "Remplissez votre demande maintenant" : "Start your professional CV request"}<span aria-hidden="true">↗</span></a> : null}
      <a className="floating-whatsapp" href="https://wa.me/213794851081" target="_blank" rel="noreferrer" aria-label="Contact CVUp on WhatsApp"><WhatsAppIcon /></a>
    </main>
  );
}
