/**
 * Admin dashboard layout — server component.
 *
 * Placed inside the (dashboard) route group so that /admin/login
 * (a sibling of this group) is NOT wrapped by this layout and renders
 * as a fully standalone page.
 *
 * Structure:
 *   fixed sidebar (240 px) | flex-col main
 *                              top bar (title + admin email + logout)
 *                              scrollable content area
 *
 * Auth guard: calls verifyAdmin() — redirects to /admin/login if unauthenticated.
 */

import { redirect } from 'next/navigation';
import { verifyAdmin } from '@/lib/admin-auth';
import Sidebar from '@/components/admin/Sidebar';
import LogoutButton from '@/components/admin/LogoutButton';

export const metadata = {
  title: 'Deco Admin',
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await verifyAdmin();

  if (!admin) {
    redirect('/admin/login');
  }

  return (
    <div className="flex h-screen overflow-hidden bg-deco-bg">
      {/* Sidebar — fixed 240 px column */}
      <Sidebar />

      {/* Main area — offset by sidebar width */}
      <div className="flex flex-1 flex-col min-w-0 ml-60">
        {/* Top bar */}
        <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-deco-border bg-white px-6">
          <h1 className="text-base font-semibold text-deco-text tracking-tight">
            Analytics Dashboard
          </h1>

          <div className="flex items-center gap-4">
            {/* Admin avatar + email */}
            <div className="flex items-center gap-2">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full bg-deco-primary/10 text-deco-primary text-xs font-bold uppercase select-none"
                aria-hidden="true"
              >
                {admin.email.charAt(0)}
              </div>
              <span className="hidden sm:block text-sm text-deco-text-secondary">
                {admin.email}
              </span>
            </div>

            {/* Sign-out — client component */}
            <LogoutButton />
          </div>
        </header>

        {/* Scrollable content */}
        <main
          id="admin-main"
          className="flex-1 overflow-y-auto p-6"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
