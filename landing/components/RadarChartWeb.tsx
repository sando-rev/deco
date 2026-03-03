const ATTRIBUTES = [
  "Dribbling",
  "Passing",
  "Shooting",
  "Defending",
  "Fitness",
  "Game Insight",
  "Communication",
  "Mental",
];

const SAMPLE_VALUES = [8, 6, 9, 5, 7, 4, 8, 6];
const MAX_SCORE = 10;
const LEVELS = [2, 4, 6, 8, 10];

export function RadarChartWeb({ size = 280 }: { size?: number }) {
  const center = size / 2;
  const radius = size * 0.35;
  const labelRadius = size * 0.47;
  const numAxes = ATTRIBUTES.length;
  const angleStep = (2 * Math.PI) / numAxes;
  const startAngle = -Math.PI / 2;

  const getPoint = (angle: number, value: number) => {
    const r = (value / MAX_SCORE) * radius;
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
  };

  const gridPolygons = LEVELS.map((level) =>
    ATTRIBUTES.map((_, i) => {
      const angle = startAngle + i * angleStep;
      const p = getPoint(angle, level);
      return `${p.x},${p.y}`;
    }).join(" ")
  );

  const dataPoints = SAMPLE_VALUES.map((val, i) => {
    const angle = startAngle + i * angleStep;
    const p = getPoint(angle, val);
    return `${p.x},${p.y}`;
  }).join(" ");

  const axisLines = ATTRIBUTES.map((_, i) => {
    const angle = startAngle + i * angleStep;
    return getPoint(angle, MAX_SCORE);
  });

  const labels = ATTRIBUTES.map((label, i) => {
    const angle = startAngle + i * angleStep;
    const p = getPoint(angle, MAX_SCORE);
    const lp = {
      x: center + ((p.x - center) / radius) * labelRadius,
      y: center + ((p.y - center) / radius) * labelRadius,
    };
    return { ...lp, label, value: SAMPLE_VALUES[i] };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {gridPolygons.map((points, i) => (
        <polygon
          key={`grid-${i}`}
          points={points}
          fill="none"
          stroke="rgba(27, 107, 74, 0.15)"
          strokeWidth={1}
        />
      ))}
      {axisLines.map((p, i) => (
        <line
          key={`axis-${i}`}
          x1={center}
          y1={center}
          x2={p.x}
          y2={p.y}
          stroke="rgba(27, 107, 74, 0.15)"
          strokeWidth={1}
        />
      ))}
      <polygon
        points={dataPoints}
        fill="rgba(27, 107, 74, 0.2)"
        stroke="#1B6B4A"
        strokeWidth={2}
      />
      {SAMPLE_VALUES.map((val, i) => {
        const angle = startAngle + i * angleStep;
        const p = getPoint(angle, val);
        return (
          <circle
            key={`dot-${i}`}
            cx={p.x}
            cy={p.y}
            r={4}
            fill="#1B6B4A"
            stroke="white"
            strokeWidth={2}
          />
        );
      })}
      {labels.map((l, i) => (
        <g key={`label-${i}`}>
          <text
            x={l.x}
            y={l.y - 6}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={9}
            fontWeight={600}
            fill="#6B7280"
          >
            {l.label}
          </text>
          <text
            x={l.x}
            y={l.y + 8}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={11}
            fontWeight={700}
            fill="#1B6B4A"
          >
            {l.value}
          </text>
        </g>
      ))}
    </svg>
  );
}
