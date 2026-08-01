// Shared chart color tokens matching tailwind.config.js so all chart wrappers stay consistent.
export const CHART_COLORS = {
  brand: '#4F46E5',
  brandEnd: '#7C3AED',
  coral: '#FF7E7E',
  peach: '#FFB37C',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
};

export function useChartAxisColors(isDark) {
  return {
    grid: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    text: isDark ? '#9CA3AF' : '#6B7280',
    tooltipBg: isDark ? '#171923' : '#FFFFFF',
    tooltipBorder: isDark ? '#252836' : '#ECECF3',
  };
}

export const tooltipContentStyle = (colors) => ({
  borderRadius: 16,
  border: `1px solid ${colors.tooltipBorder}`,
  background: colors.tooltipBg,
  boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
  fontSize: 12,
  padding: '8px 12px',
});
