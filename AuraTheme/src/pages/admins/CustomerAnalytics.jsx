import React, { useMemo } from 'react';
import GenericAnalyticsPage from './reports/GenericAnalyticsPage';
import { useAdminTheme } from '../../hooks/useAdminTheme';
import { useTranslation } from '../../contexts/LanguageContext';

const chartData = [
  { label: 'Jan', value: 320 }, { label: 'Feb', value: 410 }, { label: 'Mar', value: 380 },
  { label: 'Apr', value: 520 }, { label: 'May', value: 470 }, { label: 'Jun', value: 610 },
  { label: 'Jul', value: 580 }, { label: 'Aug', value: 660 }, { label: 'Sep', value: 630 },
  { label: 'Oct', value: 710 }, { label: 'Nov', value: 680 }, { label: 'Dec', value: 790 },
];

const CustomerAnalytics = () => {
  const adminTheme = useAdminTheme();
  const { t } = useTranslation();

  const kpis = useMemo(() => [
    { label: t('active_customers', 'Active Customers'), value: '12,480', change: '+8.1%' },
    { label: t('new_signups', 'New Signups'), value: '790', change: '+14.2%' },
    { label: t('repeat_purchase_rate', 'Repeat Purchase Rate'), value: '46.2%', change: '+3.5%' },
    { label: t('churn_rate', 'Churn Rate'), value: '4.1%', change: '-0.8%' },
  ], [t]);

  return (
    <GenericAnalyticsPage
      title={t('customer_analytics', 'Customer Analytics')}
      subtitle={t('customer_analytics_subtitle', 'Growth, retention, and engagement across the customer base')}
      accent={adminTheme.systemOrange}
      kpis={kpis}
      chartData={chartData}
      chartKey="value"
      chartLabel={t('new_customers_over_time', 'New Customers Over Time')}
    />
  );
};

export default CustomerAnalytics;
