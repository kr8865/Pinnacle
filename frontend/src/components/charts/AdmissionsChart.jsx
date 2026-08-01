import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import { CHART_COLORS, useChartAxisColors, tooltipContentStyle } from './chartTheme';
import EmptyState from '../EmptyState';

/**
 * data: [{ label: 'Jan', admissions: 24 }]
 */
export default function AdmissionsChart({ data = [], dataKey = 'admissions', labelKey = 'label', height = 280 }) {
  const { isDark } = useTheme() || {};
  const colors = useChartAxisColors(isDark);

  if (!data.length) {
    return <EmptyState title="No admissions data" description="New admissions per month will be plotted here." />;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="admissionsFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS.peach} />
            <stop offset="100%" stopColor={CHART_COLORS.coral} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
        <XAxis dataKey={labelKey} stroke={colors.text} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis stroke={colors.text} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipContentStyle(colors)} formatter={(v) => [v, 'Admissions']} />
        <Bar dataKey={dataKey} fill="url(#admissionsFill)" radius={[8, 8, 0, 0]} maxBarSize={36} />
      </BarChart>
    </ResponsiveContainer>
  );
}
