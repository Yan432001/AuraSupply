import React from 'react';
import { Card, Statistic, Typography, Flex } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { useAdminTheme } from '../../../hooks/useAdminTheme';

const { Text } = Typography;

const DashboardCard = ({ title, prefixIcon, trend, trendValue, trendColor, valueColor, total }) => {
  const adminTheme = useAdminTheme();

  return (
    <Card
      hoverable
      style={{
        borderRadius: 14,
        overflow: 'hidden',
        background: adminTheme.card,
        borderColor: adminTheme.border,
        boxShadow: adminTheme.isDark ? '0 4px 14px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.03)',
      }}
    >
      <Flex justify="space-between" align="center" gap="small">
        <Statistic
          title={<Text style={{ color: adminTheme.subtext, fontSize: 12.5 }}>{title}</Text>}
          value={total}
          prefix={prefixIcon}
          valueStyle={{ color: valueColor || adminTheme.text, fontWeight: 'bold' }}
        />
        <Flex vertical align="end">
          <Text style={{ color: trendColor, fontWeight: 'bold' }}>
            {trend === 'up' ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {trendValue}
          </Text>
          <Text style={{ fontSize: 11.5, color: adminTheme.subtext }}>
            vs last month
          </Text>
        </Flex>
      </Flex>
    </Card>
  );
};

export default DashboardCard;