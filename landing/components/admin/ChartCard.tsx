/**
 * Chart wrapper card — consistent title header + content area for any chart.
 *
 * Usage:
 *   import ChartCard from "@/components/admin/ChartCard";
 *   import { LineChart, ... } from "recharts";
 *
 *   <ChartCard title="Daily Active Users">
 *     <LineChart ... />
 *   </ChartCard>
 */

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export default function ChartCard({ title, subtitle, children, className = "" }: ChartCardProps) {
  return (
    <section
      className={[
        "bg-deco-surface rounded-xl shadow-sm border border-deco-border flex flex-col",
        className,
      ].join(" ")}
    >
      {/* Card header */}
      <header className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-deco-border">
        <div>
          <h2 className="text-sm font-semibold text-deco-text">{title}</h2>
          {subtitle && <p className="text-xs text-deco-text-tertiary mt-0.5">{subtitle}</p>}
        </div>
      </header>

      {/* Chart content */}
      <div className="flex-1 px-5 py-4 min-h-0">
        {children}
      </div>
    </section>
  );
}
