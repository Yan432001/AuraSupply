import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Table,
  Button,
  InputNumber,
  Select,
  Space,
  Row,
  Col,
  Typography,
  Tag,
  message,
  Tooltip,
  Spin
} from 'antd';
import {
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  CalculatorOutlined,
  BankOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAdminTheme } from '../../../hooks/useAdminTheme';
import { useTranslation } from '../../../contexts/LanguageContext';
import MoneyModuleNav from './MoneyModuleNav';

const { Title, Text } = Typography;
const { Option } = Select;

const API_BASE = '/api/admin/money_exchange';

const TransferRangePage = () => {
  const { companyId } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isDark } = useAdminTheme();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [company, setCompany] = useState(null);
  const [allCompanies, setAllCompanies] = useState([]);
  const [ranges, setRanges] = useState([]);
  const [testAmount, setTestAmount] = useState(150);

  const loadRanges = async (id) => {
    if (!id) return;
    setLoading(true);
    try {
      const [compRes, listRes] = await Promise.all([
        axios.get(`${API_BASE}/transfer-companies/${id}/ranges`),
        axios.get(`${API_BASE}/transfer-companies`)
      ]);

      if (listRes.data?.status) {
        setAllCompanies(listRes.data.data || []);
      }

      if (compRes.data?.status) {
        setCompany(compRes.data.company || null);
        const rows = compRes.data.data || [];
        if (rows.length > 0) {
          setRanges(
            rows.map((r, idx) => ({
              key: `tr_${r.id || idx}_${Date.now()}`,
              from_amount: parseFloat(r.from_amount || 0),
              to_amount: parseFloat(r.to_amount || 0),
              commission: parseFloat(r.commission || 0),
              transfer_fee: parseFloat(r.transfer_fee || 0)
            }))
          );
        } else {
          setRanges([
            {
              key: `tr_init_${Date.now()}`,
              from_amount: 1,
              to_amount: 100,
              commission: 0,
              transfer_fee: 0
            }
          ]);
        }
      }
    } catch (err) {
      console.error('Failed to load transfer ranges:', err);
      message.error('Failed to load transfer ranges for this company');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRanges(companyId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const handleAddTier = () => {
    const lastMax = ranges.length > 0 ? parseFloat(ranges[ranges.length - 1].to_amount || 0) : 0;
    setRanges((prev) => [
      ...prev,
      {
        key: `tr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        from_amount: lastMax > 0 ? lastMax + 1 : 0,
        to_amount: lastMax > 0 ? lastMax + 500 : 100,
        commission: 0,
        transfer_fee: 0
      }
    ]);
  };

  const handleUpdateTier = (rowKey, field, val) => {
    setRanges((prev) =>
      prev.map((r) => (r.key === rowKey ? { ...r, [field]: parseFloat(val ?? 0) || 0 } : r))
    );
  };

  const handleRemoveTier = (rowKey) => {
    setRanges((prev) => prev.filter((r) => r.key !== rowKey));
  };

  const handleSaveRanges = async () => {
    setSaving(true);
    try {
      await axios.put(`${API_BASE}/transfer-companies/${companyId}/ranges`, { ranges });
      message.success(t('transfer_ranges_saved', 'Transfer ranges updated successfully'));
      loadRanges(companyId);
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to save transfer ranges');
    } finally {
      setSaving(false);
    }
  };

  // Match tier for simulator
  const matchedTier = useMemo(() => {
    const amt = parseFloat(testAmount || 0);
    if (amt <= 0) return null;
    const candidates = ranges.filter(
      (r) => r.from_amount <= amt && (r.to_amount >= amt || r.to_amount === 0)
    );
    if (!candidates.length) return null;
    return candidates.sort((a, b) => b.from_amount - a.from_amount)[0];
  }, [ranges, testAmount]);

  const cardStyle = {
    borderRadius: 10,
    marginBottom: 16,
    background: isDark ? '#0f172a' : '#ffffff',
    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
    boxShadow: isDark ? '0 4px 14px rgba(0, 0, 0, 0.3)' : '0 1px 3px rgba(15, 23, 42, 0.04)'
  };

  return (
    <div style={{ padding: '4px 0 32px' }}>
      <MoneyModuleNav activeKey="transfer_companies" />

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          marginBottom: 16
        }}
      >
        <Space size={12}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/admins/money/transfer_companies')}
            style={{ borderRadius: 8 }}
          >
            {t('back', 'Back')}
          </Button>
          <div>
            <Title level={4} style={{ margin: 0, color: isDark ? '#f8fafc' : '#0f172a' }}>
              <BankOutlined style={{ color: '#10b981', marginRight: 8 }} />
              {t('transfer_range', 'Transfer Range')} — {company?.name || `Company #${companyId}`}
            </Title>
            <Text style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#64748b' }}>
              {t(
                'transfer_range_subtitle',
                'Define tiered From Amount → To Amount brackets with Commission and Transfer Fee (set To Amount = 0 for open-ended upper tier).'
              )}
            </Text>
          </div>
        </Space>

        <Space wrap>
          <Select
            value={Number(companyId)}
            onChange={(val) => navigate(`/admins/money/transfer_range/${val}`)}
            style={{ minWidth: 190 }}
          >
            {allCompanies.map((c) => (
              <Option key={c.id} value={c.id}>
                Switch: {c.name}
              </Option>
            ))}
          </Select>

          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={handleAddTier}
            style={{ borderColor: '#10b981', color: '#10b981', borderRadius: 8 }}
          >
            {t('add_tier', 'Add Range Row')}
          </Button>

          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={saving}
            onClick={handleSaveRanges}
            style={{ background: '#10b981', borderColor: '#10b981', borderRadius: 8, fontWeight: 600 }}
          >
            {t('update', 'Update Transfer Ranges')}
          </Button>
        </Space>
      </div>

      {/* Live Tier Fee & Commission Simulator */}
      <Card bordered={false} style={cardStyle} bodyStyle={{ padding: '14px 18px' }}>
        <Row gutter={[16, 12]} align="middle">
          <Col xs={24} md={7}>
            <Space>
              <CalculatorOutlined style={{ color: '#10b981', fontSize: 18 }} />
              <Text strong style={{ color: isDark ? '#f1f5f9' : '#0f172a' }}>
                {t('tier_simulator', 'Test Transfer Amount Tier')}
              </Text>
            </Space>
          </Col>
          <Col xs={24} sm={10} md={6}>
            <InputNumber
              min={0}
              value={testAmount}
              onChange={(v) => setTestAmount(v || 0)}
              addonBefore="Amount"
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={14} md={11}>
            {matchedTier ? (
              <Space wrap size={12}>
                <Tag color="green">
                  Matched Tier: {matchedTier.from_amount} →{' '}
                  {matchedTier.to_amount > 0 ? matchedTier.to_amount : '∞'}
                </Tag>
                <Tag color="purple">Commission: {matchedTier.commission}</Tag>
                <Tag color="gold">Transfer Fee: {matchedTier.transfer_fee}</Tag>
              </Space>
            ) : (
              <Text type="secondary">No matching range bracket for amount {testAmount || 0}</Text>
            )}
          </Col>
        </Row>
      </Card>

      {/* Formulation Table (Matches AURA_v1 views/money/transfer_range.php) */}
      <Spin spinning={loading}>
        <Card bordered={false} style={cardStyle}>
          <Table
            rowKey="key"
            dataSource={ranges}
            pagination={false}
            bordered
            size="middle"
            onRow={(record) => ({
              style:
                matchedTier && matchedTier.key === record.key
                  ? {
                      background: isDark ? 'rgba(16, 185, 129, 0.14)' : '#ecfdf5'
                    }
                  : undefined
            })}
            columns={[
              {
                title: '#',
                width: 60,
                align: 'center',
                render: (_, __, idx) => idx + 1
              },
              {
                title: t('from_amount', 'From Amount'),
                dataIndex: 'from_amount',
                render: (val, row) => (
                  <InputNumber
                    min={0}
                    step={1}
                    value={val}
                    onChange={(v) => handleUpdateTier(row.key, 'from_amount', v)}
                    style={{ width: '100%' }}
                  />
                )
              },
              {
                title: t('to_amount', 'To Amount (0 = Unlimited)'),
                dataIndex: 'to_amount',
                render: (val, row) => (
                  <InputNumber
                    min={0}
                    step={1}
                    value={val}
                    onChange={(v) => handleUpdateTier(row.key, 'to_amount', v)}
                    style={{ width: '100%' }}
                  />
                )
              },
              {
                title: t('commission', 'Commission'),
                dataIndex: 'commission',
                render: (val, row) => (
                  <InputNumber
                    min={0}
                    step={0.5}
                    value={val}
                    onChange={(v) => handleUpdateTier(row.key, 'commission', v)}
                    style={{ width: '100%' }}
                  />
                )
              },
              {
                title: t('fee', 'Transfer Fee'),
                dataIndex: 'transfer_fee',
                render: (val, row) => (
                  <InputNumber
                    min={0}
                    step={0.5}
                    value={val}
                    onChange={(v) => handleUpdateTier(row.key, 'transfer_fee', v)}
                    style={{ width: '100%' }}
                  />
                )
              },
              {
                title: '',
                width: 60,
                align: 'center',
                render: (_, row) => (
                  <Tooltip title="Remove Range Row">
                    <Button
                      danger
                      type="text"
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemoveTier(row.key)}
                    />
                  </Tooltip>
                )
              }
            ]}
          />

          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={handleAddTier}
              style={{ borderColor: '#10b981', color: '#10b981' }}
            >
              {t('add_tier', 'Add Range Row')}
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={saving}
              onClick={handleSaveRanges}
              style={{ background: '#10b981', borderColor: '#10b981', borderRadius: 8, fontWeight: 600 }}
            >
              {t('update', 'Update Transfer Ranges')}
            </Button>
          </div>
        </Card>
      </Spin>
    </div>
  );
};

export default TransferRangePage;
