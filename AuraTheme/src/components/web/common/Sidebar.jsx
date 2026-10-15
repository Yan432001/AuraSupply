import React from 'react';
import { Button, Card, Flex, Progress, Space, Tag, Typography } from 'antd';
import {
  AreaChartOutlined,
  BellOutlined,
  ClusterOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { publicTheme } from '../../../utils/webTheme';

const { Text, Title } = Typography;

const signalItems = [
  { label: 'Supplier response rate', value: 92, tone: publicTheme.primary },
  { label: 'Learning completion', value: 76, tone: publicTheme.secondary },
  { label: 'Service SLA health', value: 97, tone: publicTheme.success },
];

const workflowCards = [
  { title: 'New RFQs', value: '14 open', text: 'Buyer requests waiting for supplier review and pricing confirmation.' },
  { title: 'Service tickets', value: '5 active', text: 'Most issues relate to label stock, rack setup, and dock equipment.' },
];

const Sidebar = () => {
  const navigate = useNavigate();

  return (
    <div style={{ position: 'sticky', top: 102 }}>
      <Space direction="vertical" size={18} style={{ width: '100%' }}>
        <Card
          className="frosted-panel stagger-rise"
          style={{
            borderRadius: 28,
            background: publicTheme.heroBackground,
            border: `1px solid ${publicTheme.border}`,
            boxShadow: publicTheme.shadow,
            overflow: 'hidden',
          }}
          styles={{ body: { padding: 24 } }}
        >
          <Space direction="vertical" size={18} style={{ width: '100%' }}>
            <Tag style={{ width: 'fit-content', borderRadius: 999, border: 'none', background: publicTheme.pill, color: publicTheme.primary, fontWeight: 700, padding: '6px 12px' }}>
              Operations snapshot
            </Tag>
            <div>
              <Title level={4} style={{ margin: 0, color: publicTheme.text }}>
                Business Health
              </Title>
              <Text style={{ color: publicTheme.subtext }}>
                Commercial, service, and learning activity stay aligned in one side panel.
              </Text>
            </div>

            {signalItems.map((item) => (
              <div
                key={item.label}
                style={{
                  padding: 16,
                  borderRadius: 20,
                  background: 'rgba(255,255,255,0.76)',
                  border: `1px solid ${publicTheme.softBorder}`,
                }}
              >
                <Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
                  <Text style={{ color: publicTheme.subtext }}>{item.label}</Text>
                  <Text strong style={{ color: publicTheme.text }}>{item.value}%</Text>
                </Flex>
                <Progress percent={item.value} showInfo={false} strokeColor={item.tone} trailColor="rgba(98,114,127,0.12)" />
              </div>
            ))}
          </Space>
        </Card>

        <Card
          style={{
            borderRadius: 24,
            background: publicTheme.cardBackground,
            border: `1px solid ${publicTheme.border}`,
            boxShadow: publicTheme.lightShadow,
          }}
          styles={{ body: { padding: 22 } }}
        >
          <Space direction="vertical" size={14} style={{ width: '100%' }}>
            <Space>
              <ClusterOutlined style={{ color: publicTheme.primary }} />
              <Text strong style={{ color: publicTheme.text }}>Workflow Focus</Text>
            </Space>

            {workflowCards.map((item) => (
              <div
                key={item.title}
                style={{
                  padding: 16,
                  borderRadius: 20,
                  background: publicTheme.cardMuted,
                  border: `1px solid ${publicTheme.softBorder}`,
                }}
              >
                <Flex justify="space-between" align="center">
                  <Text strong style={{ color: publicTheme.text }}>{item.title}</Text>
                  <Tag style={{ margin: 0, borderRadius: 999, border: 'none', background: publicTheme.pill, color: publicTheme.primary }}>
                    {item.value}
                  </Tag>
                </Flex>
                <Text style={{ color: publicTheme.subtext, display: 'block', marginTop: 8 }}>
                  {item.text}
                </Text>
              </div>
            ))}
          </Space>
        </Card>

        <Card
          style={{
            borderRadius: 24,
            background: 'linear-gradient(160deg, #1c2333 0%, #2f6fed 100%)',
            border: 'none',
            boxShadow: publicTheme.shadow,
          }}
          styles={{ body: { padding: 22 } }}
        >
          <Space direction="vertical" size={14} style={{ width: '100%' }}>
            <Space>
              <AreaChartOutlined style={{ color: '#ffb03d' }} />
              <Text strong style={{ color: 'white' }}>Coordination Layer</Text>
            </Space>
            <Text style={{ color: 'rgba(255,255,255,0.74)' }}>
              Use the service and admin spaces to follow tickets, supplier follow-ups, and replenishment actions.
            </Text>
            <Flex gap={10} wrap="wrap">
              <Tag style={{ margin: 0, borderRadius: 999, background: 'rgba(255,255,255,0.12)', color: 'white', border: 'none', padding: '6px 12px' }}>
                Orders monitored
              </Tag>
              <Tag style={{ margin: 0, borderRadius: 999, background: 'rgba(255,255,255,0.12)', color: 'white', border: 'none', padding: '6px 12px' }}>
                Teams trained
              </Tag>
            </Flex>
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              onClick={() => navigate('/admins/dashboard')}
              style={{ height: 44, borderRadius: 16, background: publicTheme.ribbon, border: 'none', fontWeight: 700 }}
            >
              Open admin portal
            </Button>
            <Button
              icon={<BellOutlined />}
              onClick={() => navigate('/service')}
              style={{ height: 44, borderRadius: 16, background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.14)', color: 'white', fontWeight: 600 }}
            >
              Review service updates
            </Button>
          </Space>
        </Card>
      </Space>
    </div>
  );
};

export default Sidebar;
