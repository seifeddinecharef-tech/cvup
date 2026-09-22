import Link from "next/link";
import { getAdminRequests } from "@/lib/admin-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminPage() {
  let requests: Awaited<ReturnType<typeof getAdminRequests>> = [];
  let errorMessage: string | null = null;

  try {
    requests = await getAdminRequests();
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Unable to load requests.";
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-slate-500">CVUp admin</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">CVUp Admin</h1>
          </div>
          <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600">
            {requests.length} requests
          </div>
        </div>

        {errorMessage ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : requests.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600 shadow-sm">
            No requests found.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Request code</th>
                    <th className="px-4 py-3 font-semibold">Created</th>
                    <th className="px-4 py-3 font-semibold">Full name</th>
                    <th className="px-4 py-3 font-semibold">Phone</th>
                    <th className="px-4 py-3 font-semibold">Email</th>
                    <th className="px-4 py-3 font-semibold">CV type</th>
                    <th className="px-4 py-3 font-semibold">Target role</th>
                    <th className="px-4 py-3 font-semibold">Languages</th>
                    <th className="px-4 py-3 font-semibold">Field</th>
                    <th className="px-4 py-3 font-semibold">Recruitment</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {requests.map((request) => (
                    <tr key={request.request_code ?? request.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        <Link
                          href={`/admin/${request.request_code}`}
                          className="text-slate-900 underline-offset-2 hover:underline"
                        >
                          {request.request_code}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {request.created_at ? new Date(request.created_at).toLocaleString() : "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-800">{request.full_name || "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{request.phone || "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{request.email || "—"}</td>
                      <td className="px-4 py-3 text-slate-700">{request.cv_type || "—"}</td>
                      <td className="px-4 py-3 text-slate-700">{request.target_role || request.target_job_title || "—"}</td>
                      <td className="px-4 py-3 text-slate-700">
                        {Array.isArray(request.selected_cv_languages)
                          ? request.selected_cv_languages.join(", ")
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{request.professional_field || "—"}</td>
                      <td className="px-4 py-3 text-slate-700">
                        {request.recruitment_consent === true ? "Yes" : request.recruitment_consent === false ? "No" : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                          {request.status || "NEW"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
