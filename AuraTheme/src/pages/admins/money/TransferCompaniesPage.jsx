import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Space,
  Typography,
  Modal,
  Form,
  Tag,
  message,
  Popconfirm,
  Tooltip
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
  SlidersOutlined,
  BankOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAdminTheme } from '../../../hooks/useAdminTheme';
import { useTranslation } from '../../../contexts/LanguageContext';
import MoneyModuleNav from './MoneyModuleNav';

const { Title, Text } = Typography;

const API_BASE = '/api/admin/money_exchange';

const TransferCompaniesPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isDark } = useAdminTheme();
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [searchText, setSearchText] = useState('');

  // Add / Edit Transfer Company Modal (replicates add_transfer_company.php & edit_transfer_company.php)
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchCompanies = async (q = searchText) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/transfer-companies`, {
        params: { search: q }
      });
      if (res.data?.status) {
        setCompanies(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch transfer companies:', err);
      message.error('Failed to load transfer companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenModal = (company = null) => {
    setEditingCompany(company);
    if (company) {
      form.setFieldsValue({ name: company.name });
    } else {
      form.resetFields();
    }
    setModalOpen(true);
  };

  const handleSaveCompany = async (values) => {
    setSubmitting(true);
    try {
      if (editingCompany) {
        await axios.put(`${API_BASE}/transfer-companies/${editingCompany.id}`, values);
        message.success(t('transfer_company_updated', 'Transfer company updated successfully'));
      } else {
        await axios.post(`${API_BASE}/transfer-companies`, values);
        message.success(t('transfer_company_added', 'Transfer company added successfully'));
      }
      setModalOpen(false);
      fetchCompanies();
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to save transfer company');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCompany = async (id) => {
    try {
      await axios.delete(`${API_BASE}/transfer-companies/${id}`);
      message.success(t('transfer_company_deleted', 'Transfer company deleted successfully'));
      fetchCompanies();
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to delete transfer company');
    }
  };

  const cardStyle = {
    borderRadius: 10,
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
        <div>
          <Title level={4} style={{ margin: 0, color: isDark ? '#f8fafc' : '#0f172a' }}>
            {t('transfer_companies', 'Money Transfer Companies')}
          </Title>
          <Text style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#64748b' }}>
            {t(
              'transfer_companies_subtitle',
              'Manage remittance and mobile money providers (e.g. TrueMoney, eMoney, Wing, ABA) and configure tiered transfer fee & commission ranges.'
            )}
          </Text>
        </div>

        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => fetchCompanies()} style={{ borderRadius: 8 }} />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal(null)}
            style={{ background: '#10b981', borderColor: '#10b981', borderRadius: 8, fontWeight: 600 }}
          >
            {t('add_transfer_company', 'Add Transfer Company')}
          </Button>
        </Space>
      </div>

      <Card bordered={false} style={cardStyle}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <Input
            allowClear
            prefix={<SearchOutlined style={{ color: isDark ? '#94a3b8' : '#64748b' }} />}
            placeholder={t('search_transfer_company', 'Search company name (e.g. True, Emoney, Wing)...')}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={() => fetchCompanies(searchText)}
            style={{ maxWidth: 360 }}
          />
          <Button onClick={() => fetchCompanies(searchText)}>{t('search', 'Search')}</Button>
        </div>

        <Table
          rowKey="id"
          loading={loading}
          dataSource={companies}
          bordered
          pagination={{ pageSize: 15, showSizeChanger: true }}
          columns={[
            {
              title: 'ID',
              dataIndex: 'id',
              width: 80,
              align: 'center'
            },
            {
              title: t('company_name', 'Transfer Company Name'),
              dataIndex: 'name',
              render: (val, record) => (
                <Space>
                  <BankOutlined style={{ color: '#10b981' }} />
                  <Button
                    type="link"
                    style={{ padding: 0, fontWeight: 600, fontSize: 14 }}
                    onClick={() => navigate(`/admins/money/transfer_range/${record.id}`)}
                  >
                    {val}
                  </Button>
                </Space>
              )
            },
            {
              title: t('configured_ranges', 'Fee & Commission Tiers'),
              dataIndex: 'ranges_count',
              width: 210,
              align: 'center',
              render: (cnt) => (
                <Tag color={cnt > 0 ? 'green' : 'default'}>
                  {cnt} {cnt === 1 ? 'Range Tier' : 'Range Tiers'}
                </Tag>
              )
            },
            {
              title: t('amount_coverage', 'Tier Amount Coverage'),
              key: 'coverage',
              width: 220,
              align: 'center',
              render: (_, rec) =>
                rec.ranges_count > 0 ? (
                  <Text style={{ fontSize: 13 }}>
                    {rec.min_amount} → {rec.max_amount > 0 ? rec.max_amount : 'Unlimited'}
                  </Text>
                ) : (
                  <Text type="secondary">Not configured</Text>
                )
            },
            {
              title: t('actions', 'Actions'),
              key: 'actions',
              width: 250,
              align: 'center',
              render: (_, record) => (
                <Space>
                  <Button
                    size="small"
                    type="primary"
                    ghost
                    icon={<SlidersOutlined />}
                    onClick={() => navigate(`/admins/money/transfer_range/${record.id}`)}
                  >
                    {t('transfer_range', 'Transfer Ranges')}
                  </Button>
                  <Tooltip title={t('edit_transfer_company', 'Edit Company')}>
                    <Button
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => handleOpenModal(record)}
                    />
                  </Tooltip>
                  <Popconfirm
                    title={`Delete transfer company "${record.name}"?`}
                    description="Associated transfer ranges will also be removed."
                    onConfirm={() => handleDeleteCompany(record.id)}
                    okButtonProps={{ danger: true }}
                  >
                    <Button danger size="small" icon={<DeleteOutlined />} />
                  </Popconfirm>
                </Space>
              )
            }
          ]}
        />
      </Card>

      {/* Add / Edit Transfer Company Modal */}
      <Modal
        title={
          editingCompany
            ? t('edit_transfer_company', `Edit Transfer Company: ${editingCompany.name}`)
            : t('add_transfer_company', 'Add Transfer Company')
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        okButtonProps={{ style: { background: '#10b981', borderColor: '#10b981' } }}
      >
        <Form form={form} layout="vertical" onFinish={handleSaveCompany}>
          <Form.Item
            name="name"
            label={t('company_name', 'Company / Provider Name')}
            rules={[{ required: true, message: 'Please enter transfer company name' }]}
          >
            <Input placeholder="e.g. Wing, TrueMoney, eMoney, Western Union" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TransferCompaniesPage;
