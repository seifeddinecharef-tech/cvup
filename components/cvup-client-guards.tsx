"use client";

import { useEffect } from "react";

type LanguageCode = "ar" | "fr" | "en";

const latinNamePattern = /^[A-Za-zÀ-ÖØ-öø-ÿ' .-]{2,160}$/;

const messages = {
  ar: {
    latinHint: "اكتب الاسم واللقب بالأحرف اللاتينية كما تريد أن يظهرا في السيرة الذاتية. هذا الحقل إجباري.",
    latinError: "يرجى كتابة الاسم واللقب بالأحرف اللاتينية فقط.",
    editPolicy:
      "ملاحظة مهمة: بعد إرسال الطلب، أي تعديل على البيانات أو الملفات خلال أول 24 ساعة يُحسب بنسبة 50% من السعر الأصلي. يرجى مراجعة كل المعلومات والملفات بعناية قبل التأكيد والإرسال.",
  },
  fr: {
    latinHint:
      "Saisissez votre nom et prénom en caractères latins, tels qu’ils doivent apparaître sur le CV. Ce champ est obligatoire.",
    latinError: "Veuillez saisir le nom et le prénom uniquement en caractères latins.",
    editPolicy:
      "Note importante : après l’envoi de la demande, toute modification des informations ou des fichiers pendant les premières 24 heures sera facturée à 50 % du prix initial. Merci de vérifier soigneusement vos données avant la confirmation.",
  },
  en: {
    latinHint:
      "Enter your first and last name in Latin characters, exactly as they should appear on the CV. This field is required.",
    latinError: "Please enter your first and last name using Latin characters only.",
    editPolicy:
      "Important note: after submitting the request, any change to the information or files during the first 24 hours will be billed at 50% of the original price. Please review everything carefully before confirming and submitting.",
  },
};

function getCurrentLanguage(): LanguageCode {
  const active = document.querySelector(".language-button--active")?.textContent?.trim().toLowerCase() || "";
  if (active.includes("العربية")) return "ar";
  if (active.includes("english")) return "en";
  return "fr";
}

function findFullNameInput(): HTMLInputElement | null {
  const labelMarkers = ["الاسم الكامل", "nom", "full name"];
  const labels = Array.from(document.querySelectorAll("label"));

  for (const label of labels) {
    const text = label.textContent?.trim().toLowerCase() || "";
    if (labelMarkers.some((marker) => text.includes(marker))) {
      const input = label.querySelector("input");
      if (input instanceof HTMLInputElement) return input;
    }
  }

  const firstVisibleRequired = Array.from(document.querySelectorAll("input[required]")).find((input) => {
    if (!(input instanceof HTMLInputElement)) return false;
    return input.offsetParent !== null && input.type !== "tel" && input.type !== "email";
  });

  return firstVisibleRequired instanceof HTMLInputElement ? firstVisibleRequired : null;
}

function ensureFullNameLatinRequirement(language: LanguageCode) {
  const input = findFullNameInput();
  if (!input) return;

  input.required = true;
  input.autocomplete = "name";
  input.setAttribute("inputmode", "text");
  input.setAttribute("data-cvup-latin-name", "true");
  input.placeholder = language === "ar" ? "مثال: Seif Eddine Charef" : language === "fr" ? "Exemple : Seif Eddine Charef" : "Example: Seif Eddine Charef";

  input.oninput = () => {
    const value = input.value.trim();
    window.sessionStorage.setItem("cvup_last_full_name", value);
    input.setCustomValidity(value && !latinNamePattern.test(value) ? messages[language].latinError : "");
  };
  input.oninput(new Event("input"));

  const label = input.closest("label");
  if (label && !label.querySelector("[data-cvup-latin-hint]")) {
    const hint = document.createElement("p");
    hint.dataset.cvupLatinHint = "true";
    hint.className = "mt-2 text-xs leading-5 text-slate-500";
    hint.textContent = messages[language].latinHint;
    label.appendChild(hint);
  } else {
    const hint = label?.querySelector<HTMLElement>("[data-cvup-latin-hint]");
    if (hint) hint.textContent = messages[language].latinHint;
  }
}

function ensureEditPolicyNote(language: LanguageCode) {
  const stepSeven = document.querySelector('[data-wizard-step="7"]');
  if (!stepSeven) return;

  let note = stepSeven.querySelector<HTMLElement>("[data-cvup-edit-policy]");
  if (!note) {
    note = document.createElement("div");
    note.dataset.cvupEditPolicy = "true";
    note.className = "rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-900";
    const priceBox = stepSeven.querySelector(".review-price");
    if (priceBox?.parentElement === stepSeven) {
      stepSeven.insertBefore(note, priceBox);
    } else {
      stepSeven.prepend(note);
    }
  }

  note.textContent = messages[language].editPolicy;
}

function rememberNameBeforeSubmit() {
  const input = findFullNameInput();
  if (input?.value.trim()) window.sessionStorage.setItem("cvup_last_full_name", input.value.trim());
}

export function CvupClientGuards() {
  useEffect(() => {
    let frame = 0;

    const apply = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const language = getCurrentLanguage();
        ensureFullNameLatinRequirement(language);
        ensureEditPolicyNote(language);
      });
    };

    const handleSubmit = () => rememberNameBeforeSubmit();
    document.addEventListener("submit", handleSubmit, true);

    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener("submit", handleSubmit, true);
    };
  }, []);

  return null;
}
