import React from 'react';
import GenericAnalyticsPage from './reports/GenericAnalyticsPage';
import { useAdminTheme } from '../../hooks/useAdminTheme';

const chartData = [
  { label: 'Jan', value: 42 }, { label: 'Feb', value: 58 }, { label: 'Mar', value: 36 },
  { label: 'Apr', value: 64 }, { label: 'May', value: 30 }, { label: 'Jun', value: 55 },
  { label: 'Jul', value: 62 }, { label: 'Aug', value: 70 }, { label: 'Sep', value: 58 },
  { label: 'Oct', value: 66 }, { label: 'Nov', value: 40 }, { label: 'Dec', value: 52 },
];

const kpis = [
  { label: 'Total Orders', value: '57,800', change: '+12.5%' },
  { label: 'Avg. Order Value', value: '$86.40', change: '+4.2%' },
  { label: 'Conversion Rate', value: '3.8%', change: '+0.6%' },
  { label: 'Cart Abandonment', value: '21.4%', change: '-2.1%' },
];

const SalesAnalytics = () => {
  const adminTheme = useAdminTheme();
  return (
    <GenericAnalyticsPage
      title="Sales Analytics"
      subtitle="Order volume and commercial performance trends"
      accent={adminTheme.primary}
      kpis={kpis}
      chartData={chartData}
      chartKey="value"
      chartLabel="Orders Over Time"
    />
  );
};

export default SalesAnalytics;
