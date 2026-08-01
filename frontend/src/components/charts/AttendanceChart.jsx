import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell,
  PieChart, Pie,
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import { CHART_COLORS, useChartAxisColors, tooltipContentStyle } from './chartTheme';
import EmptyState from '../EmptyState';

/**
 * data: [{ label: 'Mon', present: 40, absent: 5, leave: 2 }]
 */
export default function AttendanceChart({ data = [], labelKey = 'label', height = 280 }) {
  const { isDark } = useTheme() || {};
  const colors = useChartAxisColors(isDark);

  if (!data.length) {
    return <EmptyState title="No attendance data" description="Attendance trends will show up once records are marked." />;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
        <XAxis dataKey={labelKey} stroke={colors.text} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis stroke={colors.text} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipContentStyle(colors)} />
        <Legend wrapperStyle={{ fontSize: 12, color: colors.text }} />
        <Bar dataKey="present" stackId="a" fill={CHART_COLORS.success} radius={[0, 0, 0, 0]} name="Present" />
        <Bar dataKey="absent" stackId="a" fill={CHART_COLORS.danger} name="Absent" />
        <Bar dataKey="leave" stackId="a" fill={CHART_COLORS.warning} radius={[6, 6, 0, 0]} name="Leave" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function AttendanceDonut({ present = 0, absent = 0, leave = 0, height = 220 }) {
  const { isDark } = useTheme() || {};
  const colors = useChartAxisColors(isDark);
  const data = [
    { name: 'Present', value: present, color: CHART_COLORS.success },
    { name: 'Absent', value: absent, color: CHART_COLORS.danger },
    { name: 'Leave', value: leave, color: CHART_COLORS.warning },
  ].filter((d) => d.value > 0);

  if (!data.length) {
    return <EmptyState title="No attendance yet" />;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius="60%" outerRadius="85%" paddingAngle={2}>
          {data.map((d) => (
            <Cell key={d.name} fill={d.color} stroke="none" />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipContentStyle(colors)} />
      </PieChart>
    </ResponsiveContainer>
  );
}
