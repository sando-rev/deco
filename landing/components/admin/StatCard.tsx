/**
 * KPI Metric Card
 *
 * Usage:
 *   import StatCard from "@/components/admin/StatCard";
 *
 *   <StatCard
 *     title="Total Users"
 *     value={1284}
 *     subtitle="Active accounts"
 *     trend={{ value: 12.5, positive: true }}
 *     icon={<UsersIcon />}
 *   />
 */

interface TrendProps {
  value: number;
  positive: boolean;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: TrendProps;
  icon?: React.ReactNode;
}

const TrendUp = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const TrendDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
    <polyline points="17 18 23 18 23 12" />
  </svg>
);

export default function StatCard({ title, value, subtitle, trend, icon }: StatCardProps) {
  return (
    <article className="bg-deco-surface rounded-xl p-5 shadow-sm border border-deco-border flex flex-col gap-3">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-deco-text-secondary leading-tight">
          {title}
        </p>
        {icon && (
          <span
            className="flex-shrink-0 w-9 h-9 rounded-lg bg-deco-bg flex items-center justify-center text-deco-primary"
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
      </div>

      {/* Value */}
      <div className="flex items-end gap-3 flex-wrap">
        <p className="text-3xl font-bold text-deco-text tracking-tight leading-none">
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>

        {trend && (
          <span
            className={[
              "flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full mb-0.5",
              trend.positive
                ? "text-emerald-700 bg-emerald-50"
                : "text-red-600 bg-red-50",
            ].join(" ")}
            aria-label={`${trend.positive ? "Up" : "Down"} ${trend.value}%`}
          >
            {trend.positive ? <TrendUp /> : <TrendDown />}
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-xs text-deco-text-tertiary leading-tight">{subtitle}</p>
      )}
    </article>
  );
}
