import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Typography,
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  Row,
  Col,
  message,
  Statistic
} from 'antd';
import {
  StopOutlined,
  PlusOutlined,
  ReloadOutlined,
  DollarOutlined,
  FallOutlined,
  RiseOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { useTranslation } from '../../../contexts/LanguageContext';

const { Title, Text } = Typography;
const { Option } = Select;

const AssetDisposalPage = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [disposals, setDisposals] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0 });

  // Assets list for modal
  const [assets, setAssets] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [saleAmount, setSaleAmount] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const fetchDisposals = async (page = pagination.page, limit = pagination.limit) => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/assets/disposals', { params: { page, limit } });
      if (res.data?.status) {
        setDisposals(res.data.data || []);
        if (res.data.pagination) setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Error fetching disposals:', err);
      message.error(t('failed_fetch_disposals', 'Failed to load asset disposals.'));
    } finally {
      setLoading(false);
    }
  };

  const fetchAssets = async () => {
    try {
      const res = await axios.get('/api/admin/assets', { params: { limit: 200 } });
      if (res.data?.status) {
        setAssets(res.data.data?.filter(a => a.status !== 'disposed') || []);
      }
    } catch (err) {
      console.error('Error fetching assets for disposal:', err);
    }
  };

  useEffect(() => {
    fetchDisposals(1, pagination.limit);
  }, []);

  const openNewDisposalModal = () => {
    fetchAssets();
    setSelectedAsset(null);
    setSaleAmount(0);
    form.resetFields();
    form.setFieldsValue({
      disposal_date: dayjs(),
      disposal_method: 'sale',
      sale_amount: 0
    });
    setModalOpen(true);
  };

  const handleAssetSelect = (assetId) => {
    const asset = assets.find(a => a.id === assetId);
    setSelectedAsset(asset || null);
  };

  const handleSaveDisposal = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        disposal_date: values.disposal_date.format('YYYY-MM-DD')
      };
      const res = await axios.post('/api/admin/assets/disposals', payload);
      if (res.data?.status) {
        message.success(t('disposal_logged', 'Asset retired / disposed successfully!'));
        setModalOpen(false);
        fetchDisposals(1, pagination.limit);
      }
    } catch (err) {
      console.error('Save disposal error:', err);
      message.error(err.response?.data?.message || err.message);
    }
  };

  const bookVal = parseFloat(selectedAsset?.current_value) || 0;
  const gainLoss = saleAmount - bookVal;

  const columns = [
    {
      title: t('reference_no', 'Disposal Ref #'),
      dataIndex: 'reference_no',
      key: 'reference_no',
      width: 140,
      render: (ref) => <Tag color="blue" style={{ fontWeight: 600 }}>{ref}</Tag>
    },
    {
      title: t('asset', 'Retired Equipment'),
      key: 'asset',
      render: (_, r) => (
        <div>
          <Text strong style={{ color: '#2563eb' }}>{r.asset_code}</Text>
          <div>{r.asset_name}</div>
        </div>
      )
    },
    {
      title: t('disposal_method', 'Method'),
      dataIndex: 'disposal_method',
      key: 'disposal_method',
      render: (m) => {
        const map = {
          sale: <Tag color="green">Sale / Auction</Tag>,
          scrap: <Tag color="orange">Scrap / Recycled</Tag>,
          damaged: <Tag color="red">Damaged Write-off</Tag>,
          donate: <Tag color="purple">Donated</Tag>,
          trade_in: <Tag color="blue">Trade-In</Tag>
        };
        return map[m] || <Tag>{m}</Tag>;
      }
    },
    {
      title: t('disposal_date', 'Disposal Date'),
      dataIndex: 'disposal_date',
      key: 'disposal_date',
      render: (d) => d ? new Date(d).toLocaleDateString() : '-'
    },
    {
      title: t('book_value_at_disposal', 'Book Value at Disposal ($)'),
      dataIndex: 'book_value_at_disposal',
      key: 'book_value_at_disposal',
      align: 'right',
      render: (v) => `$${parseFloat(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    },
    {
      title: t('sale_proceeds', 'Sale Proceeds ($)'),
      dataIndex: 'sale_amount',
      key: 'sale_amount',
      align: 'right',
      render: (s) => `$${parseFloat(s || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    },
    {
      title: t('gain_loss', 'Gain / (Loss)'),
      dataIndex: 'gain_loss',
      key: 'gain_loss',
      align: 'right',
      render: (gl) => {
        const val = parseFloat(gl || 0);
        if (val > 0) {
          return (
            <Tag color="success" icon={<RiseOutlined />}>
              +${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Tag>
          );
        }
        if (val < 0) {
          return (
            <Tag color="error" icon={<FallOutlined />}>
              -${Math.abs(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Tag>
          );
        }
        return <Tag color="default">$0.00</Tag>;
      }
    },
    {
      title: t('buyer_reason', 'Buyer & Notes'),
      key: 'buyer',
      render: (_, r) => (
        <div style={{ fontSize: 12 }}>
          {r.buyer_name && <div><strong>Buyer:</strong> {r.buyer_name}</div>}
          <div style={{ color: '#64748b' }}>{r.reason || 'No justification logged'}</div>
        </div>
      )
    }
  ];

  return (
    <Card style={{ borderRadius: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            {t('asset_disposals_registry', 'Capital Asset Retirement & Disposal Registry')}
          </Title>
          <Text type="secondary">
            {t('disposals_desc', 'Track equipment salvage sales, scrap write-offs, casualty loss calculations, and gain/loss ledger balances.')}
          </Text>
        </div>
        <Space wrap>
          <Button
            type="primary"
            danger
            icon={<PlusOutlined />}
            onClick={openNewDisposalModal}
          >
            {t('retire_asset_btn', 'Retire / Dispose Equipment')}
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => fetchDisposals(pagination.page, pagination.limit)}>
            {t('refresh', 'Refresh')}
          </Button>
        </Space>
      </div>

      <Table
        dataSource={disposals}
        columns={columns}
        rowKey="id"
        loading={loading}
        size="middle"
        pagination={{
          current: pagination.page,
          pageSize: pagination.limit,
          total: pagination.total,
          showSizeChanger: true,
          onChange: (page, limit) => fetchDisposals(page, limit)
        }}
      />

      <Modal
        title={t('retire_capital_equipment', 'Retire / Dispose Capital Asset')}
        open={modalOpen}
        onOk={handleSaveDisposal}
        onCancel={() => setModalOpen(false)}
        width={680}
        okText={t('confirm_retire', 'Confirm Disposal')}
        okButtonProps={{ danger: true }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="asset_id"
            label={t('select_asset_to_retire', 'Select Equipment to Retire')}
            rules={[{ required: true, message: 'Please select an asset' }]}
          >
            <Select
              showSearch
              placeholder="Search equipment by code or name..."
              optionFilterProp="children"
              onChange={handleAssetSelect}
            >
              {assets.map((a) => (
                <Option key={a.id} value={a.id}>
                  {a.asset_code} &mdash; {a.name} (Book Value: ${parseFloat(a.current_value || 0).toFixed(2)})
                </Option>
              ))}
            </Select>
          </Form.Item>

          {selectedAsset && (
            <Card size="small" style={{ marginBottom: 16, background: '#f8fafc', borderColor: '#cbd5e1' }}>
              <Row gutter={16}>
                <Col span={8}>
                  <Statistic
                    title={t('acquisition_cost', 'Acquisition Cost')}
                    value={selectedAsset.purchase_cost || 0}
                    precision={2}
                    prefix="$"
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title={t('net_book_value', 'Net Book Value')}
                    value={bookVal}
                    precision={2}
                    prefix="$"
                    valueStyle={{ color: '#2563eb' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title={t('computed_gain_loss', 'Gain / (Loss)')}
                    value={gainLoss}
                    precision={2}
                    prefix="$"
                    valueStyle={{ color: gainLoss >= 0 ? '#16a34a' : '#dc2626', fontWeight: 700 }}
                  />
                </Col>
              </Row>
            </Card>
          )}

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="disposal_method" label={t('disposal_method', 'Disposal Method')} rules={[{ required: true }]}>
                <Select>
                  <Option value="sale">Sale / Auction</Option>
                  <Option value="scrap">Scrap / Recycled</Option>
                  <Option value="damaged">Casualty Write-off (Damaged)</Option>
                  <Option value="donate">Donation</Option>
                  <Option value="trade_in">Trade-In</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="sale_amount" label={t('sale_proceeds', 'Sale Proceeds ($)')}>
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  precision={2}
                  onChange={(v) => setSaleAmount(parseFloat(v) || 0)}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="disposal_date" label={t('disposal_date', 'Disposal Date')} rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="buyer_name" label={t('buyer_salvager', 'Buyer / Salvage Recipient')}>
                <Input placeholder="Buyer name, recycling firm..." />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="reason" label={t('disposal_justification', 'Retirement Justification & Authorization')}>
            <Input.TextArea rows={2} placeholder="End of economic useful life, obsolete technology, damaged beyond repair..." />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default AssetDisposalPage;
