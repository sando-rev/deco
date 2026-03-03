import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Polygon, Line, Circle, Text as SvgText, G } from 'react-native-svg';
import { Colors } from '../constants/theme';

export interface RadarSkill {
  label: string;
  score: number;
}

interface RadarChartProps {
  skills: RadarSkill[];
  size?: number;
  showLabels?: boolean;
  comparisonSkills?: RadarSkill[];
}

const MAX_SCORE = 10;
const LEVELS = [2, 4, 6, 8, 10];

export function RadarChart({
  skills,
  size = 280,
  showLabels = true,
  comparisonSkills,
}: RadarChartProps) {
  const center = size / 2;
  const radius = size * 0.35;
  const labelRadius = size * 0.47;
  const numAxes = skills.length;

  if (numAxes < 3) return null; // Need at least 3 axes for a radar chart

  const angleStep = (2 * Math.PI) / numAxes;
  const startAngle = -Math.PI / 2;

  // Adjust label size based on number of axes
  const labelFontSize = numAxes > 12 ? 8 : numAxes > 10 ? 9 : 10;

  const getPoint = (angle: number, value: number, maxRadius: number) => {
    const r = (value / MAX_SCORE) * maxRadius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  // Grid levels
  const gridPolygons = LEVELS.map((level) => {
    const points = skills.map((_, i) => {
      const angle = startAngle + i * angleStep;
      const p = getPoint(angle, level, radius);
      return `${p.x},${p.y}`;
    }).join(' ');
    return points;
  });

  // Data polygon
  const getDataPoints = (data: RadarSkill[]) => {
    return data.map((skill, i) => {
      const angle = startAngle + i * angleStep;
      const p = getPoint(angle, skill.score, radius);
      return `${p.x},${p.y}`;
    }).join(' ');
  };

  const dataPoints = getDataPoints(skills);
  const comparisonPoints = comparisonSkills
    ? getDataPoints(comparisonSkills)
    : null;

  // Axis lines
  const axisLines = skills.map((_, i) => {
    const angle = startAngle + i * angleStep;
    const p = getPoint(angle, MAX_SCORE, radius);
    return { x2: p.x, y2: p.y };
  });

  // Labels
  const labels = skills.map((skill, i) => {
    const angle = startAngle + i * angleStep;
    const p = getPoint(angle, MAX_SCORE, labelRadius);
    return {
      x: p.x,
      y: p.y,
      label: skill.label,
      value: skill.score,
    };
  });

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        {/* Grid polygons */}
        {gridPolygons.map((points, i) => (
          <Polygon
            key={`grid-${i}`}
            points={points}
            fill="none"
            stroke={Colors.radarGrid}
            strokeWidth={1}
          />
        ))}

        {/* Axis lines */}
        {axisLines.map((line, i) => (
          <Line
            key={`axis-${i}`}
            x1={center}
            y1={center}
            x2={line.x2}
            y2={line.y2}
            stroke={Colors.radarGrid}
            strokeWidth={1}
          />
        ))}

        {/* Comparison data polygon (if provided) */}
        {comparisonPoints && (
          <Polygon
            points={comparisonPoints}
            fill="rgba(245, 166, 35, 0.15)"
            stroke={Colors.accent}
            strokeWidth={1.5}
            strokeDasharray="4,4"
          />
        )}

        {/* Data polygon */}
        <Polygon
          points={dataPoints}
          fill={Colors.radarFill}
          stroke={Colors.radarStroke}
          strokeWidth={2}
        />

        {/* Data points */}
        {skills.map((skill, i) => {
          const angle = startAngle + i * angleStep;
          const p = getPoint(angle, skill.score, radius);
          return (
            <Circle
              key={`point-${i}`}
              cx={p.x}
              cy={p.y}
              r={4}
              fill={Colors.primary}
              stroke={Colors.white}
              strokeWidth={2}
            />
          );
        })}

        {/* Labels */}
        {showLabels &&
          labels.map((l, i) => (
            <G key={`label-${i}`}>
              <SvgText
                x={l.x}
                y={l.y}
                textAnchor="middle"
                alignmentBaseline="middle"
                fontSize={labelFontSize}
                fontWeight="600"
                fill={Colors.textSecondary}
              >
                {l.label}
              </SvgText>
              <SvgText
                x={l.x}
                y={l.y + 13}
                textAnchor="middle"
                alignmentBaseline="middle"
                fontSize={11}
                fontWeight="700"
                fill={Colors.primary}
              >
                {l.value}
              </SvgText>
            </G>
          ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
