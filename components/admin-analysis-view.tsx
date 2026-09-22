import type { CvAnalysis } from "@/lib/ai-schema";

function List({ items }: { items: string[] }) {
  return items.length ? <ul className="list-disc space-y-1 pl-5">{items.map((item) => <li key={item}>{item}</li>)}</ul> : <span>None recorded</span>;
}

type AnalysisField = [label: string, items: string[]];
type AnalysisSection = [title: string, fields: AnalysisField[]];

export function AdminAnalysisView({ analysis }: { analysis: CvAnalysis }) {
  const sections: AnalysisSection[] = [
    ["Candidate Facts", [
      ["Summary facts", analysis.candidate_facts.professional_summary_facts],
      ["Experience", analysis.candidate_facts.experience],
      ["Skills", analysis.candidate_facts.confirmed_skills],
      ["Tools", analysis.candidate_facts.confirmed_tools],
      ["Platforms", analysis.candidate_facts.confirmed_platforms],
      ["Languages", analysis.candidate_facts.confirmed_languages],
      ["Achievements", analysis.candidate_facts.confirmed_achievements],
    ]],
    ["Job Analysis", [
      ["Title", [analysis.job_analysis.job_title]],
      ["Responsibilities", analysis.job_analysis.main_responsibilities],
      ["Required skills", analysis.job_analysis.required_skills],
      ["Important keywords", analysis.job_analysis.important_keywords],
    ]],
    ["Confirmed Matches", analysis.job_matches.filter((match) => match.status !== "not_confirmed").map((match) => [`${match.requirement} (${match.status})`, [match.candidate_evidence]])],
    ["Gaps", analysis.gaps.map((gap) => [gap.requirement, [gap.reason]])],
    ["Eligibility Flags", [["Flags", analysis.eligibility_flags]]],
    ["CV Strategy", [
      ["Target title", [analysis.cv_strategy.target_title]],
      ["Emphasize", analysis.cv_strategy.content_to_emphasize],
      ["Safe keywords", analysis.cv_strategy.keywords_safe_to_use],
    ]],
    ["Internal Quality", [
      ["Data completeness", [analysis.internal_quality.data_completeness]],
      ["Job relevance", [analysis.internal_quality.job_relevance]],
      ["Evidence strength", [analysis.internal_quality.evidence_strength]],
      ["ATS readiness", [analysis.internal_quality.ats_structure_readiness]],
      ["Ready for generation", [analysis.internal_quality.ready_for_generation ? "Yes" : "No"]],
    ]],
  ];

  return <div className="space-y-4">{sections.map(([title, fields]) => <section key={title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><h3 className="text-lg font-bold text-slate-900">{title}</h3><div className="mt-4 grid gap-4 md:grid-cols-2">{fields.map(([label, items]) => <div key={label} className="rounded-2xl bg-slate-50 p-4"><p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p><div className="mt-2 text-sm text-slate-800"><List items={items} /></div></div>)}</div></section>)}</div>;
}