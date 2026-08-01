import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import { CHART_COLORS, useChartAxisColors, tooltipContentStyle } from './chartTheme';
import EmptyState from '../EmptyState';

/**
 * Generic multi-line growth chart.
 * data: [{ label: 'Jan', students: 120, revenue: 40000 }]
 * lines: [{ key: 'students', label: 'Students', color: CHART_COLORS.brand }]
 */
export default function GrowthChart({
  data = [],
  labelKey = 'label',
  lines = [{ key: 'value', label: 'Growth', color: CHART_COLORS.brand }],
  height = 280,
}) {
  const { isDark } = useTheme() || {};
  const colors = useChartAxisColors(isDark);

  if (!data.length) {
    return <EmptyState title="No growth data yet" description="Growth trends will appear once enough history is recorded." />;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
        <XAxis dataKey={labelKey} stroke={colors.text} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis stroke={colors.text} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipContentStyle(colors)} />
        {lines.length > 1 && <Legend wrapperStyle={{ fontSize: 12, color: colors.text }} />}
        {lines.map((line) => (
          <Line
            key={line.key}
            type="monotone"
            dataKey={line.key}
            name={line.label}
            stroke={line.color}
            strokeWidth={2.5}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export { CHART_COLORS };
