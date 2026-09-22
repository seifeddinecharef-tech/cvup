import Link from "next/link";
import { AdminDashboard } from "@/components/admin-dashboard";
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
    <main className="admin-shell min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-10">
        <header className="admin-page-header">
          <div>
            <p className="admin-eyebrow">CVUp operations</p>
            <h1>Admin workspace</h1>
            <p>Manage client requests, payment, production status and dossier exports from one place.</p>
          </div>
          <div className="admin-page-header__actions">
            <Link href="/" className="admin-button admin-button--secondary">View website</Link>
          </div>
        </header>

        {errorMessage ? (
          <div className="admin-error-card">
            <strong>Unable to load requests</strong>
            <span>{errorMessage}</span>
          </div>
        ) : (
          <AdminDashboard requests={requests} />
        )}
      </div>
    </main>
  );
}
