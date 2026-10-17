import React, { useMemo } from 'react';
import GenericAnalyticsPage from './reports/GenericAnalyticsPage';
import { useAdminTheme } from '../../hooks/useAdminTheme';
import { useTranslation } from '../../contexts/LanguageContext';

const chartData = [
  { label: 'Jan', value: 42 }, { label: 'Feb', value: 58 }, { label: 'Mar', value: 36 },
  { label: 'Apr', value: 64 }, { label: 'May', value: 30 }, { label: 'Jun', value: 55 },
  { label: 'Jul', value: 62 }, { label: 'Aug', value: 70 }, { label: 'Sep', value: 58 },
  { label: 'Oct', value: 66 }, { label: 'Nov', value: 40 }, { label: 'Dec', value: 52 },
];

const SalesAnalytics = () => {
  const adminTheme = useAdminTheme();
  const { t } = useTranslation();

  const kpis = useMemo(() => [
    { label: t('total_orders', 'Total Orders'), value: '57,800', change: '+12.5%' },
    { label: t('avg_order_value', 'Avg. Order Value'), value: '$86.40', change: '+4.2%' },
    { label: t('conversion_rate', 'Conversion Rate'), value: '3.8%', change: '+0.6%' },
    { label: t('cart_abandonment', 'Cart Abandonment'), value: '21.4%', change: '-2.1%' },
  ], [t]);

  return (
    <GenericAnalyticsPage
      title={t('sales_analytics', 'Sales Analytics')}
      subtitle={t('sales_analytics_subtitle', 'Order volume and commercial performance trends')}
      accent={adminTheme.primary}
      kpis={kpis}
      chartData={chartData}
      chartKey="value"
      chartLabel={t('orders_over_time', 'Orders Over Time')}
    />
  );
};

export default SalesAnalytics;
