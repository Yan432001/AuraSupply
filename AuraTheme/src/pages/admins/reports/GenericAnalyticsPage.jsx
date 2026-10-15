import React from 'react';
import { Card, Col, Flex, Row, Space, Tag, Typography } from 'antd';
import { ArrowUpOutlined } from '@ant-design/icons';
import { Area, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAdminTheme } from '../../../hooks/useAdminTheme';

const { Text, Title } = Typography;

const GenericAnalyticsPage = ({ title, subtitle, accent, kpis, chartData, chartKey, chartLabel }) => {
  const adminTheme = useAdminTheme();
  const cardStyle = {
    borderRadius: 18,
    border: `1px solid ${adminTheme.border}`,
    background: adminTheme.card,
    height: '100%',
  };

  return (
  <Space direction="vertical" size={18} style={{ width: '100%' }}>
    <div>
      <Title level={4} style={{ margin: 0, color: adminTheme.text }}>{title}</Title>
      <Text style={{ color: adminTheme.subtext, fontSize: 12.5 }}>{subtitle}</Text>
    </div>

    <Row gutter={[16, 16]}>
      {kpis.map((kpi) => (
        <Col xs={12} md={6} key={kpi.label}>
          <Card style={cardStyle} styles={{ body: { padding: 18 } }}>
            <Text style={{ color: adminTheme.subtext, fontSize: 12.5 }}>{kpi.label}</Text>
            <Title level={3} style={{ margin: '4px 0 6px', color: adminTheme.text }}>{kpi.value}</Title>
            <Tag
              icon={<ArrowUpOutlined style={{ fontSize: 10 }} />}
              style={{ margin: 0, borderRadius: 999, border: 'none', background: `${accent}1a`, color: accent, fontWeight: 700 }}
            >
              {kpi.change}
            </Tag>
          </Card>
        </Col>
      ))}
    </Row>

    <Card style={cardStyle} styles={{ body: { padding: 20 } }}>
      <Flex justify="space-between" align="center" style={{ marginBottom: 14 }}>
        <Title level={5} style={{ margin: 0, color: adminTheme.text }}>{chartLabel}</Title>
        <Text style={{ color: adminTheme.subtext, fontSize: 12 }}>Last 12 months</Text>
      </Flex>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={chartData} margin={{ left: -20, right: 10 }}>
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: adminTheme.subtext }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: adminTheme.subtext }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ borderRadius: 12, border: `1px solid ${adminTheme.border}`, background: adminTheme.card, color: adminTheme.text }} />
          <Area type="monotone" dataKey={chartKey} stroke={accent} strokeWidth={2} fill={accent} fillOpacity={0.14} />
          <Line type="monotone" dataKey={chartKey} stroke={accent} strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </Card>
  </Space>
  );
};

export default GenericAnalyticsPage;
