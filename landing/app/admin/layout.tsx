/**
 * This file intentionally left as a passthrough layout so that
 * /admin/login can render without the dashboard chrome.
 *
 * The actual admin dashboard layout (with auth guard, sidebar, and top bar)
 * lives in app/admin/(dashboard)/layout.tsx and only applies to the
 * authenticated dashboard routes.
 */

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
