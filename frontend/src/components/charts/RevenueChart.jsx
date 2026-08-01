import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import { CHART_COLORS, useChartAxisColors, tooltipContentStyle } from './chartTheme';
import EmptyState from '../EmptyState';

/**
 * data: [{ label: 'Jan', revenue: 12000 }]
 */
export default function RevenueChart({ data = [], dataKey = 'revenue', labelKey = 'label', height = 280 }) {
  const { isDark } = useTheme() || {};
  const colors = useChartAxisColors(isDark);

  if (!data.length) {
    return <EmptyState title="No revenue data yet" description="Revenue trends will appear here once fees are collected." />;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.brand} stopOpacity={0.35} />
            <stop offset="95%" stopColor={CHART_COLORS.brand} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
        <XAxis dataKey={labelKey} stroke={colors.text} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis stroke={colors.text} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipContentStyle(colors)} labelStyle={{ color: colors.text }} formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']} />
        <Area type="monotone" dataKey={dataKey} stroke={CHART_COLORS.brand} strokeWidth={2.5} fill="url(#revenueFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
