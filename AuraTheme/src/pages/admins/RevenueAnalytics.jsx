import React from 'react';
import GenericAnalyticsPage from './reports/GenericAnalyticsPage';
import { useAdminTheme } from '../../hooks/useAdminTheme';

const chartData = [
  { label: 'Jan', value: 32000 }, { label: 'Feb', value: 41000 }, { label: 'Mar', value: 38000 },
  { label: 'Apr', value: 52000 }, { label: 'May', value: 47000 }, { label: 'Jun', value: 61000 },
  { label: 'Jul', value: 58000 }, { label: 'Aug', value: 66000 }, { label: 'Sep', value: 63000 },
  { label: 'Oct', value: 71000 }, { label: 'Nov', value: 68000 }, { label: 'Dec', value: 79000 },
];

const kpis = [
  { label: 'Total Revenue', value: '$637,254', change: '+10.5%' },
  { label: 'Net Margin', value: '28.4%', change: '+1.8%' },
  { label: 'Refund Rate', value: '2.1%', change: '-0.4%' },
  { label: 'Revenue per Customer', value: '$142', change: '+6.3%' },
];

const RevenueAnalytics = () => {
  const adminTheme = useAdminTheme();
  return (
    <GenericAnalyticsPage
      title="Revenue Analytics"
      subtitle="Financial performance across the storefront and ERP channels"
      accent={adminTheme.systemTeal}
      kpis={kpis}
      chartData={chartData}
      chartKey="value"
      chartLabel="Revenue Over Time"
    />
  );
};

export default RevenueAnalytics;
