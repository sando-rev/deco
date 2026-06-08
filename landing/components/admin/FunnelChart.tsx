/**
 * Horizontal funnel visualization.
 *
 * Usage:
 *   import FunnelChart from "@/components/admin/FunnelChart";
 *
 *   const stages = [
 *     { label: "Signed Up",     value: 4200, percentage: 100 },
 *     { label: "Onboarded",     value: 3150, percentage: 75 },
 *     { label: "First Session", value: 1890, percentage: 45 },
 *     { label: "Retained 7d",   value:  756, percentage: 18 },
 *   ];
 *   <FunnelChart stages={stages} />
 */

interface FunnelStage {
  label: string;
  value: number;
  percentage: number;
}

interface FunnelChartProps {
  stages: FunnelStage[];
}

export default function FunnelChart({ stages }: FunnelChartProps) {
  if (!stages || stages.length === 0) {
    return (
      <p className="text-sm text-deco-text-tertiary py-8 text-center">
        No funnel data available.
      </p>
    );
  }

  // Drop-off from previous step (used for annotation)
  const dropOff = (index: number): number | null => {
    if (index === 0) return null;
    const prev = stages[index - 1].percentage;
    const curr = stages[index].percentage;
    return Math.round(100 - (curr / prev) * 100);
  };

  return (
    <div
      role="list"
      aria-label="Conversion funnel"
      className="flex flex-col gap-3 w-full"
    >
      {stages.map((stage, i) => {
        const drop = dropOff(i);
        return (
          <div
            key={stage.label}
            role="listitem"
            className="flex items-center gap-4"
          >
            {/* Step number */}
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-deco-bg border border-deco-border flex items-center justify-center text-xs font-semibold text-deco-text-secondary">
              {i + 1}
            </span>

            {/* Label + bar + stats */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-sm font-medium text-deco-text truncate">
                  {stage.label}
                </span>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {drop !== null && (
                    <span
                      className="text-xs text-red-500 font-medium"
                      aria-label={`${drop}% drop-off from previous step`}
                    >
                      -{drop}%
                    </span>
                  )}
                  <span className="text-sm font-semibold text-deco-text tabular-nums">
                    {stage.value.toLocaleString()}
                  </span>
                  <span className="text-xs text-deco-text-secondary w-10 text-right tabular-nums">
                    {stage.percentage}%
                  </span>
                </div>
              </div>

              {/* Bar track */}
              <div
                className="h-6 w-full bg-deco-bg rounded-md overflow-hidden"
                role="progressbar"
                aria-valuenow={stage.percentage}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${stage.label}: ${stage.percentage}%`}
              >
                <div
                  className="h-full rounded-md transition-all duration-500"
                  style={{
                    width: `${stage.percentage}%`,
                    background: `linear-gradient(90deg, #1B6B4A 0%, #2D9B6A 100%)`,
                    opacity: 1 - i * 0.08,
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
