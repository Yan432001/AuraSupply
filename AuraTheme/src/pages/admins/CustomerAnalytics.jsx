import React from 'react';
import GenericAnalyticsPage from './reports/GenericAnalyticsPage';
import { useAdminTheme } from '../../hooks/useAdminTheme';

const chartData = [
  { label: 'Jan', value: 320 }, { label: 'Feb', value: 410 }, { label: 'Mar', value: 380 },
  { label: 'Apr', value: 520 }, { label: 'May', value: 470 }, { label: 'Jun', value: 610 },
  { label: 'Jul', value: 580 }, { label: 'Aug', value: 660 }, { label: 'Sep', value: 630 },
  { label: 'Oct', value: 710 }, { label: 'Nov', value: 680 }, { label: 'Dec', value: 790 },
];

const kpis = [
  { label: 'Active Customers', value: '12,480', change: '+8.1%' },
  { label: 'New Signups', value: '790', change: '+14.2%' },
  { label: 'Repeat Purchase Rate', value: '46.2%', change: '+3.5%' },
  { label: 'Churn Rate', value: '4.1%', change: '-0.8%' },
];

const CustomerAnalytics = () => {
  const adminTheme = useAdminTheme();
  return (
    <GenericAnalyticsPage
      title="Customer Analytics"
      subtitle="Growth, retention, and engagement across the customer base"
      accent={adminTheme.systemOrange}
      kpis={kpis}
      chartData={chartData}
      chartKey="value"
      chartLabel="New Customers Over Time"
    />
  );
};

export default CustomerAnalytics;
