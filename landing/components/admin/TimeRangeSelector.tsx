"use client";

/**
 * Time range pill-button selector.
 *
 * Usage:
 *   import TimeRangeSelector from "@/components/admin/TimeRangeSelector";
 *
 *   const [range, setRange] = useState("30d");
 *   <TimeRangeSelector value={range} onChange={setRange} />
 */

interface TimeRangeSelectorProps {
  value: string;
  onChange: (range: string) => void;
}

const RANGES = [
  { label: "7d",  value: "7d" },
  { label: "30d", value: "30d" },
  { label: "90d", value: "90d" },
  { label: "All", value: "all" },
];

export default function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  return (
    <div
      role="group"
      aria-label="Select time range"
      className="inline-flex items-center gap-1 bg-deco-bg rounded-lg p-1 border border-deco-border"
    >
      {RANGES.map((range) => {
        const active = value === range.value;
        return (
          <button
            key={range.value}
            type="button"
            onClick={() => onChange(range.value)}
            aria-pressed={active}
            className={[
              "px-3 py-1.5 rounded-md text-xs font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deco-primary focus-visible:ring-offset-1",
              active
                ? "bg-deco-primary text-white shadow-sm"
                : "text-deco-text-secondary hover:text-deco-text hover:bg-deco-border/60",
            ].join(" ")}
          >
            {range.label}
          </button>
        );
      })}
    </div>
  );
}
