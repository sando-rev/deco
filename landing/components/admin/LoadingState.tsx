/**
 * Skeleton loading state — renders N animated pulse cards.
 *
 * Usage:
 *   import LoadingState from "@/components/admin/LoadingState";
 *
 *   // Default: 4 skeleton cards
 *   <LoadingState />
 *
 *   // Custom count
 *   <LoadingState cards={6} />
 */

interface LoadingStateProps {
  cards?: number;
}

function SkeletonCard() {
  return (
    <div
      className="bg-deco-surface rounded-xl p-5 shadow-sm border border-deco-border flex flex-col gap-4"
      aria-hidden="true"
    >
      {/* Top row: label + icon placeholder */}
      <div className="flex items-start justify-between">
        <div className="h-3.5 w-28 rounded bg-deco-border animate-pulse" />
        <div className="h-9 w-9 rounded-lg bg-deco-border animate-pulse" />
      </div>

      {/* Value placeholder */}
      <div className="h-8 w-20 rounded bg-deco-border animate-pulse" />

      {/* Subtitle placeholder */}
      <div className="h-3 w-36 rounded bg-deco-border animate-pulse" />
    </div>
  );
}

export default function LoadingState({ cards = 4 }: LoadingStateProps) {
  return (
    <section
      role="status"
      aria-label="Loading dashboard data"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {Array.from({ length: cards }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </section>
  );
}
