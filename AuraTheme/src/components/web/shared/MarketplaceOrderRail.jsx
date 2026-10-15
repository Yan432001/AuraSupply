import React from 'react';
import { Button, Card, Col, Row, Space, Tag, Typography } from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  InboxOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import { formatCurrency, publicTheme } from '../../utils/webTheme';

const { Text, Title } = Typography;

const MarketplaceOrderRail = ({
  visibleProducts,
  inStockProducts,
  activeFiltersCount,
  topPrice,
  onOpenFilters,
}) => (
  <Card
    style={{
      borderRadius: 28,
      border: `1px solid ${publicTheme.border}`,
      background: publicTheme.cardBackground,
      boxShadow: publicTheme.lightShadow,
    }}
    styles={{ body: { padding: 24 } }}
  >
    <Space direction="vertical" size={18} style={{ width: '100%' }}>
      <div>
        <Tag
          style={{
            margin: 0,
            borderRadius: 999,
            border: 'none',
            background: publicTheme.pill,
            color: publicTheme.primary,
            fontWeight: 700,
            padding: '6px 12px',
          }}
        >
          Buyer control panel
        </Tag>
        <Title level={4} style={{ margin: '12px 0 6px', color: publicTheme.text }}>
          Source faster, compare suppliers, and move approved items into order planning.
        </Title>
        <Text style={{ color: publicTheme.subtext }}>
          This panel keeps the marketplace focused on supplier readiness, stock confidence, and RFQ speed.
        </Text>
      </div>

      <Row gutter={[12, 12]}>
        <Col span={12}>
          <Card style={{ borderRadius: 20, background: publicTheme.cardMuted, border: `1px solid ${publicTheme.softBorder}` }} styles={{ body: { padding: 14 } }}>
            <Text style={{ color: publicTheme.subtext }}>Visible items</Text>
            <Title level={4} style={{ margin: '6px 0 0', color: publicTheme.text }}>
              {visibleProducts}
            </Title>
          </Card>
        </Col>
        <Col span={12}>
          <Card style={{ borderRadius: 20, background: publicTheme.cardMuted, border: `1px solid ${publicTheme.softBorder}` }} styles={{ body: { padding: 14 } }}>
            <Text style={{ color: publicTheme.subtext }}>Ready to ship</Text>
            <Title level={4} style={{ margin: '6px 0 0', color: publicTheme.text }}>
              {inStockProducts}
            </Title>
          </Card>
        </Col>
      </Row>

      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <div
          style={{
            borderRadius: 20,
            border: `1px solid ${publicTheme.softBorder}`,
            background: 'rgba(255,255,255,0.74)',
            padding: 14,
          }}
        >
          <Space align="start" size={12}>
            <InboxOutlined style={{ color: publicTheme.primary, fontSize: 18, marginTop: 2 }} />
            <div>
              <Text strong style={{ color: publicTheme.text, display: 'block' }}>
                Best offer in view
              </Text>
              <Text style={{ color: publicTheme.subtext }}>
                Lowest visible price in the current sourcing view is {formatCurrency(topPrice || 0)}.
              </Text>
            </div>
          </Space>
        </div>

        <div
          style={{
            borderRadius: 20,
            border: `1px solid ${publicTheme.softBorder}`,
            background: 'rgba(255,255,255,0.74)',
            padding: 14,
          }}
        >
          <Space align="start" size={12}>
            <ClockCircleOutlined style={{ color: publicTheme.warning, fontSize: 18, marginTop: 2 }} />
            <div>
              <Text strong style={{ color: publicTheme.text, display: 'block' }}>
                Filter stack active
              </Text>
              <Text style={{ color: publicTheme.subtext }}>
                {activeFiltersCount} sourcing controls are narrowing this review lane.
              </Text>
            </div>
          </Space>
        </div>

        <div
          style={{
            borderRadius: 20,
            border: `1px solid ${publicTheme.softBorder}`,
            background: 'rgba(255,255,255,0.74)',
            padding: 14,
          }}
        >
          <Space align="start" size={12}>
            <CheckCircleOutlined style={{ color: publicTheme.success, fontSize: 18, marginTop: 2 }} />
            <div>
              <Text strong style={{ color: publicTheme.text, display: 'block' }}>
                Supplier-ready ordering
              </Text>
              <Text style={{ color: publicTheme.subtext }}>
                Cards show minimum order, lead time, response rate, and verified supplier context.
              </Text>
            </div>
          </Space>
        </div>
      </Space>

      <Button
        type="primary"
        icon={<MessageOutlined />}
        onClick={onOpenFilters}
        style={{
          height: 46,
          borderRadius: 16,
          background: publicTheme.ribbon,
          border: 'none',
          fontWeight: 700,
        }}
      >
        Open sourcing filters
      </Button>
    </Space>
  </Card>
);

export default MarketplaceOrderRail;
