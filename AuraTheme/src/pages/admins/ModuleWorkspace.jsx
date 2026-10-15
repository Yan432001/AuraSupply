import React, { useMemo, useState, useEffect } from 'react';
import { Avatar, Badge, Button, Card, Col, Empty, Flex, Row, Space, Table, Tag, Typography } from 'antd';
import { CheckCircleFilled, PlusOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { getMenuByKey, getModuleByKey, moduleHealthLabel } from '../../data/erpModules';
import { formatCurrency } from '../../utils/uiTheme';
import { useAdminTheme } from '../../hooks/useAdminTheme';
import { fetchOrders } from '../../utils/apiconfig';

const { Text, Title } = Typography;

const healthTone = {
  stable: { bg: '#e7faf0', color: '#22c55e' },
  watch: { bg: '#fdf3d9', color: '#f0b429' },
  paused: { bg: '#f2f3f5', color: '#8a94a6' },
};

const statusColor = { Active: 'green', Pending: 'gold', Review: 'blue', Completed: 'green' };

const ModuleWorkspace = () => {
  const adminTheme = useAdminTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const moduleKey = searchParams.get('module');
  const menuKey = searchParams.get('menu');

  const module = useMemo(() => getModuleByKey(moduleKey) || {}, [moduleKey]);
  const menu = useMemo(() => getMenuByKey(moduleKey, menuKey) || null, [moduleKey, menuKey]);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetchOrders()
      .then((res) => {
        if (!isMounted) return;
        const list = res?.data || (Array.isArray(res) ? res : []);
        const mapped = list.map((item, idx) => ({
          key: item.id || idx,
          id: item.referenceNo || `#REC-${item.id}`,
          name: item.customer?.name || item.store_name || 'Commercial Transaction',
          status: item.status || 'Active',
          updated: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recently',
          amount: Number(item.grandTotal || item.subtotal || 0),
        }));
        setRows(mapped);
      })
      .catch((err) => {
        console.error('Failed to load workspace orders:', err);
        if (isMounted) setRows([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, [moduleKey, menuKey]);

  const accent = module?.accent || adminTheme.primary || '#2563eb';
  const health = module?.health || 'stable';

  const tone = useMemo(() => {
    const isDark = adminTheme.isDark;
    const tones = {
      stable: { bg: isDark ? 'rgba(34, 197, 94, 0.16)' : '#e7faf0', color: isDark ? '#4ade80' : '#22c55e' },
      watch: { bg: isDark ? 'rgba(245, 158, 11, 0.16)' : '#fdf3d9', color: isDark ? '#fbbf24' : '#f0b429' },
      paused: { bg: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f2f3f5', color: isDark ? '#94a3b8' : '#8a94a6' },
    };
    return tones[health] || tones.stable;
  }, [adminTheme.isDark, health]);

  const columns = [
    {
      title: 'Reference',
      dataIndex: 'id',
      key: 'id',
      render: (v) => <Text strong style={{ color: accent }}>{v}</Text>
    },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (v) => <Tag color={statusColor[v] || 'default'} style={{ borderRadius: 999 }}>{v}</Tag>,
    },
    { title: 'Last Updated', dataIndex: 'updated', key: 'updated' },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', render: formatCurrency },
  ];

  const moduleLabel = module?.label || 'ERP Module';
  const menuLabel = menu?.label || moduleLabel;

  return (
    <Space direction="vertical" size={18} style={{ width: '100%' }}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
        <div>
          <Text style={{ color: adminTheme.subtext, fontSize: 12.5 }}>
            {moduleLabel}
            {menu?.groupPath?.length ? ` / ${menu.groupPath.join(' / ')}` : ''}
          </Text>
          <Title level={4} style={{ margin: '2px 0 0', color: adminTheme.text }}>
            {menuLabel}
          </Title>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          style={{ borderRadius: 10, background: accent, borderColor: accent }}
        >
          New {menuLabel}
        </Button>
      </Flex>

      <Card
        style={{
          borderRadius: 18,
          border: `1px solid ${adminTheme.border}`,
          background: adminTheme.isDark
            ? `linear-gradient(140deg, #161f30 0%, ${accent}20)`
            : `linear-gradient(140deg, #ffffff, ${accent}14)`
        }}
        styles={{ body: { padding: 22 } }}
      >
        <Row gutter={[20, 16]} align="middle">
          <Col xs={24} md={16}>
            <Flex align="center" gap={10} style={{ marginBottom: 8 }}>
              <Tag
                style={{
                  margin: 0,
                  borderRadius: 999,
                  border: 'none',
                  background: tone.bg,
                  color: tone.color,
                  fontWeight: 700,
                  padding: '4px 12px'
                }}
              >
                <CheckCircleFilled style={{ marginRight: 6 }} />
                {moduleHealthLabel[health] || 'Operational'}
              </Tag>
              <Badge
                color={accent}
                text={
                  <Text style={{ color: adminTheme.subtext, fontSize: 12.5 }}>
                    {module?.kpiLabel || 'Status'}: {module?.kpiValue || 'Active'}
                  </Text>
                }
              />
            </Flex>
            <Text style={{ color: adminTheme.text, fontSize: 14 }}>
              {module?.description || 'Operational ERP module workspace.'}
            </Text>
            {module?.statusNote && (
              <Text style={{ color: adminTheme.subtext, fontSize: 12.5, display: 'block', marginTop: 6 }}>
                {module.statusNote}
              </Text>
            )}
          </Col>
          <Col xs={24} md={8}>
            <Space direction="vertical" size={6} style={{ width: '100%' }}>
              {(module?.detailBullets || []).map((bullet) => (
                <Flex key={bullet} align="flex-start" gap={8}>
                  <CheckCircleFilled style={{ color: accent, fontSize: 13, marginTop: 3 }} />
                  <Text style={{ color: adminTheme.subtext, fontSize: 12.5 }}>{bullet}</Text>
                </Flex>
              ))}
            </Space>
          </Col>
        </Row>
      </Card>

      <Card
        style={{ borderRadius: 18, border: `1px solid ${adminTheme.border}`, background: adminTheme.card }}
        styles={{ body: { padding: 20 } }}
      >
        <Flex justify="space-between" align="center" style={{ marginBottom: 14 }}>
          <Title level={5} style={{ margin: 0, color: adminTheme.text }}>
            {menuLabel} Records
          </Title>
          <Text style={{ color: adminTheme.subtext, fontSize: 12 }}>
            Live records from database (aura_v1_db)
          </Text>
        </Flex>
        {rows && rows.length ? (
          <Table columns={columns} dataSource={rows} loading={loading} pagination={{ pageSize: 8 }} size="small" scroll={{ x: 560 }} />
        ) : (
          <Empty description={loading ? "Loading records from database..." : "No records found in this workspace"} />
        )}
      </Card>
    </Space>
  );
};

export default ModuleWorkspace;
