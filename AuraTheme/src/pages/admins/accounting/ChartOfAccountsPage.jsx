import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Tag,
  Space,
  Modal,
  Form,
  InputNumber,
  Switch,
  message,
  Popconfirm,
  Tooltip,
  Typography,
  Row,
  Col,
  Descriptions,
  Divider,
  Spin
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  BankOutlined,
  BookOutlined,
  CheckCircleOutlined,
  StopOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { useTranslation } from '../../../contexts/LanguageContext';

const { Title, Text } = Typography;
const { Option } = Select;

const ChartOfAccountsPage = ({ onSelectAccountForLedger }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [sections, setSections] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 50, total: 0 });

  // Modals state
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [accountDetails, setAccountDetails] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  // Load sections and accounts
  const fetchSections = async () => {
    try {
      const res = await axios.get('/api/admin/accounting/sections');
      if (res.data?.status) setSections(res.data.data);
    } catch (_) {}
  };

  const fetchAccounts = async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pagination.pageSize,
        search: search.trim() || undefined,
        section_id: selectedSection || undefined,
        account_type: selectedType || undefined
      };
      const res = await axios.get('/api/admin/accounting/accounts', { params });
      if (res.data?.status) {
        setAccounts(res.data.data || []);
        setPagination({
          current: res.data.pagination?.page || 1,
          pageSize: res.data.pagination?.limit || 50,
          total: res.data.pagination?.total || 0
        });
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to fetch chart of accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
    fetchAccounts(1);
  }, [selectedSection, selectedType]);

  const handleSearch = () => {
    fetchAccounts(1);
  };

  // Add Account Submit
  const handleAddSubmit = async (values) => {
    try {
      const res = await axios.post('/api/admin/accounting/accounts', values);
      if (res.data?.status) {
        message.success(t('account_created_success', 'Account created successfully!'));
        setAddModalVisible(false);
        form.resetFields();
        fetchAccounts(pagination.current);
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to create account');
    }
  };

  // Edit Account Submit
  const handleEditSubmit = async (values) => {
    if (!selectedAccount) return;
    try {
      const res = await axios.put(`/api/admin/accounting/accounts/${selectedAccount.id}`, values);
      if (res.data?.status) {
        message.success(t('account_updated_success', 'Account updated successfully!'));
        setEditModalVisible(false);
        fetchAccounts(pagination.current);
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to update account');
    }
  };

  // Safe Delete Account
  const handleDelete = async (id) => {
    try {
      const res = await axios.delete(`/api/admin/accounting/accounts/${id}`);
      if (res.data?.status) {
        message.success(res.data.message || 'Account deleted successfully');
        fetchAccounts(pagination.current);
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to delete account');
    }
  };

  // View Account Details
  const handleViewDetails = async (record) => {
    setSelectedAccount(record);
    setViewModalVisible(true);
    setDetailLoading(true);
    try {
      const res = await axios.get(`/api/admin/accounting/accounts/${record.id}`);
      if (res.data?.status) {
        setAccountDetails(res.data.data);
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to fetch details');
    } finally {
      setDetailLoading(false);
    }
  };

  const columns = [
    {
      title: t('account_code', 'Account Code'),
      dataIndex: 'accountcode',
      width: 140,
      render: (code) => <Text strong style={{ fontFamily: 'monospace', fontSize: 13, color: '#1d4ed8' }}>{code}</Text>
    },
    {
      title: t('account_name', 'Account Name'),
      dataIndex: 'accountname',
      render: (name, r) => (
        <div>
          <span style={{ fontWeight: 600 }}>{name}</span>
          {r.bank === 1 && (
            <Tag color="cyan" style={{ marginLeft: 8, fontSize: 11 }}>
              <BankOutlined /> {t('bank_cash', 'Bank / Cash')}
            </Tag>
          )}
          {r.inactive === 1 && (
            <Tag color="default" style={{ marginLeft: 8, fontSize: 11 }}>
              <StopOutlined /> {t('inactive', 'Inactive')}
            </Tag>
          )}
        </div>
      )
    },
    {
      title: t('section_category', 'Classification'),
      dataIndex: 'sectionname',
      width: 200,
      render: (sec, r) => {
        let color = 'blue';
        if (r.AccountType === 'AS') color = 'green';
        if (r.AccountType === 'LI') color = 'volcano';
        if (r.AccountType === 'EQ') color = 'purple';
        if (r.AccountType === 'RE') color = 'cyan';
        if (r.AccountType === 'EX' || r.AccountType === 'CO') color = 'orange';

        return (
          <div>
            <Tag color={color} style={{ fontWeight: 500 }}>{r.AccountType || 'GL'}</Tag>
            <span style={{ fontSize: 12, color: '#475569' }}>{sec}</span>
          </div>
        );
      }
    },
    {
      title: t('parent_account', 'Parent Account'),
      dataIndex: 'parent_account_name',
      width: 180,
      render: (pName, r) => pName ? <Text type="secondary" style={{ fontSize: 12 }}>{r.parent_acc} - {pName}</Text> : '-'
    },
    {
      title: t('balance', 'Current Balance'),
      dataIndex: 'current_balance',
      align: 'right',
      width: 150,
      render: (bal, r) => {
        const val = parseFloat(bal || 0);
        return (
          <Text strong style={{ color: val < 0 ? '#dc2626' : '#1e293b' }}>
            ${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        );
      }
    },
    {
      title: t('actions', 'Actions'),
      key: 'actions',
      width: 150,
      align: 'center',
      render: (_, r) => (
        <Space size="small">
          <Tooltip title={t('view_ledger', 'View Ledger / Details')}>
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(r)}
            />
          </Tooltip>

          <Tooltip title={t('edit_account', 'Edit Account')}>
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: '#2563eb' }} />}
              onClick={() => {
                setSelectedAccount(r);
                editForm.setFieldsValue({
                  accountname: r.accountname,
                  parent_acc: r.parent_acc || undefined,
                  sectionid: r.sectionid,
                  bank: r.bank === 1,
                  inactive: r.inactive === 1
                });
                setEditModalVisible(true);
              }}
            />
          </Tooltip>

          <Tooltip title={t('delete_account', 'Delete Account')}>
            <Popconfirm
              title={t('confirm_delete_account', 'Delete Account?')}
              description={t('delete_account_warn', 'This account will be permanently removed if it has no posted transactions.')}
              onConfirm={() => handleDelete(r.id)}
              okText={t('yes_delete', 'Yes, Delete')}
              cancelText={t('cancel', 'Cancel')}
              okButtonProps={{ danger: true }}
            >
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div>
      {/* Header and Controls */}
      <Card bordered={false} style={{ marginBottom: 16, borderRadius: 10 }}>
        <Row gutter={[16, 16]} align="middle" justify="space-between">
          <Col xs={24} md={12} lg={14}>
            <Space wrap>
              <Input
                placeholder={t('search_code_or_name', 'Search account code or name...')}
                prefix={<SearchOutlined />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onPressEnter={handleSearch}
                style={{ width: 240 }}
                allowClear
              />
              <Select
                placeholder={t('filter_by_section', 'Account Classification')}
                value={selectedSection}
                onChange={setSelectedSection}
                style={{ width: 220 }}
                allowClear
              >
                {sections.map(s => (
                  <Option key={s.sectionid} value={s.sectionid}>
                    [{s.AccountType}] {s.sectionname}
                  </Option>
                ))}
              </Select>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                {t('search', 'Search')}
              </Button>
              <Button icon={<ReloadOutlined />} onClick={() => fetchAccounts(1)}>
                {t('refresh', 'Refresh')}
              </Button>
            </Space>
          </Col>

          <Col xs={24} md={12} lg={10} style={{ textAlign: 'right' }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              style={{ background: '#16a34a', borderColor: '#16a34a' }}
              onClick={() => {
                form.resetFields();
                setAddModalVisible(true);
              }}
            >
              {t('add_account', 'Add New Account')}
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Accounts Table */}
      <Card bordered={false} style={{ borderRadius: 10 }}>
        <Table
          dataSource={accounts}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            onChange: (p) => fetchAccounts(p)
          }}
          size="middle"
        />
      </Card>

      {/* Modal: Add New Account */}
      <Modal
        title={<span><BookOutlined style={{ marginRight: 8, color: '#16a34a' }} />{t('add_chart_account', 'Add Chart Account')}</span>}
        open={addModalVisible}
        onCancel={() => setAddModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleAddSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="accountcode"
                label={t('account_code', 'Account Code')}
                rules={[
                  { required: true, message: 'Please enter account code' },
                  { pattern: /^[0-9]+$/, message: 'Must be numerical account code' }
                ]}
              >
                <Input placeholder="e.g. 100150" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="sectionid"
                label={t('section', 'Classification Section')}
                rules={[{ required: true, message: 'Please select a section' }]}
              >
                <Select placeholder="Select section">
                  {sections.map(s => (
                    <Option key={s.sectionid} value={s.sectionid}>
                      [{s.AccountType}] {s.sectionname}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="accountname"
            label={t('account_name', 'Account Name')}
            rules={[{ required: true, message: 'Please enter account name' }]}
          >
            <Input placeholder="e.g. Cash in Vault / Foreign Currency" />
          </Form.Item>

          <Form.Item
            name="parent_acc"
            label={t('parent_account', 'Parent Account (Optional)')}
          >
            <Select placeholder="None (Root Account)" allowClear showSearch optionFilterProp="children">
              {accounts.map(a => (
                <Option key={a.accountcode} value={a.accountcode}>
                  {a.accountcode} - {a.accountname}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="bank" label={t('bank_or_cash', 'Bank / Cash Account?')} valuePropName="checked">
                <Switch checkedChildren={t('yes', 'Yes')} unCheckedChildren={t('no', 'No')} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="inactive" label={t('deactivated', 'Deactivated?')} valuePropName="checked">
                <Switch checkedChildren={t('inactive', 'Inactive')} unCheckedChildren={t('active', 'Active')} />
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ margin: '12px 0 20px 0' }} />

          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setAddModalVisible(false)}>{t('cancel', 'Cancel')}</Button>
              <Button type="primary" htmlType="submit" style={{ background: '#16a34a', borderColor: '#16a34a' }}>
                {t('save_account', 'Save Account')}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      {/* Modal: Edit Account */}
      <Modal
        title={<span><EditOutlined style={{ marginRight: 8, color: '#2563eb' }} />{t('edit_account', 'Edit Account')}</span>}
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={editForm} layout="vertical" onFinish={handleEditSubmit}>
          <Form.Item label={t('account_code', 'Account Code')}>
            <Input value={selectedAccount?.accountcode} disabled />
          </Form.Item>

          <Form.Item
            name="accountname"
            label={t('account_name', 'Account Name')}
            rules={[{ required: true, message: 'Please enter account name' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="sectionid" label={t('section', 'Classification Section')} rules={[{ required: true }]}>
            <Select>
              {sections.map(s => (
                <Option key={s.sectionid} value={s.sectionid}>
                  [{s.AccountType}] {s.sectionname}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="parent_acc" label={t('parent_account', 'Parent Account')}>
            <Select allowClear showSearch optionFilterProp="children">
              {accounts.filter(a => a.id !== selectedAccount?.id).map(a => (
                <Option key={a.accountcode} value={a.accountcode}>
                  {a.accountcode} - {a.accountname}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="bank" label={t('bank_or_cash', 'Bank / Cash Account?')} valuePropName="checked">
                <Switch checkedChildren={t('yes', 'Yes')} unCheckedChildren={t('no', 'No')} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="inactive" label={t('deactivated', 'Deactivated?')} valuePropName="checked">
                <Switch checkedChildren={t('inactive', 'Inactive')} unCheckedChildren={t('active', 'Active')} />
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ margin: '12px 0 20px 0' }} />

          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setEditModalVisible(false)}>{t('cancel', 'Cancel')}</Button>
              <Button type="primary" htmlType="submit">
                {t('update_account', 'Update Account')}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      {/* Modal: View Account & Ledger Details */}
      <Modal
        title={<span><BookOutlined style={{ marginRight: 8 }} />{t('account_details', 'Account Ledger Details')}</span>}
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>{t('close', 'Close')}</Button>,
          <Button
            key="ledger"
            type="primary"
            onClick={() => {
              setViewModalVisible(false);
              if (onSelectAccountForLedger) {
                onSelectAccountForLedger(selectedAccount?.accountcode);
              }
            }}
          >
            {t('open_full_general_ledger', 'Open Full General Ledger')}
          </Button>
        ]}
        width={750}
        destroyOnClose
      >
        {detailLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
        ) : (
          <div>
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label={t('account_code', 'Account Code')}>
                <Text strong style={{ color: '#2563eb', fontSize: 14 }}>{accountDetails?.accountcode}</Text>
              </Descriptions.Item>
              <Descriptions.Item label={t('account_name', 'Account Name')}>
                <Text strong>{accountDetails?.accountname}</Text>
              </Descriptions.Item>
              <Descriptions.Item label={t('classification', 'Classification')}>
                <Tag color="blue">{accountDetails?.AccountType}</Tag> {accountDetails?.sectionname}
              </Descriptions.Item>
              <Descriptions.Item label={t('balance', 'Current Balance')}>
                <Text strong style={{ fontSize: 16, color: '#16a34a' }}>
                  ${(accountDetails?.current_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label={t('parent_account', 'Parent')}>
                {accountDetails?.parent_account_name ? `${accountDetails.parent_acc} - ${accountDetails.parent_account_name}` : t('root_account', 'Root Account')}
              </Descriptions.Item>
              <Descriptions.Item label={t('status', 'Status')}>
                {accountDetails?.inactive === 1 ? <Tag color="default">{t('inactive', 'Inactive')}</Tag> : <Tag color="success">{t('active', 'Active')}</Tag>}
              </Descriptions.Item>
            </Descriptions>

            <Divider style={{ margin: '16px 0 12px 0' }}>{t('recent_transactions', 'Recent Transactions')}</Divider>

            <Table
              dataSource={accountDetails?.recent_transactions || []}
              rowKey="tran_id"
              pagination={false}
              size="small"
              columns={[
                {
                  title: t('date', 'Date'),
                  dataIndex: 'tran_date',
                  render: (d) => d ? new Date(d).toLocaleDateString() : '-'
                },
                {
                  title: t('reference', 'Reference'),
                  dataIndex: 'reference_no',
                  render: (ref) => <Text strong style={{ color: '#2563eb' }}>{ref}</Text>
                },
                {
                  title: t('type', 'Type'),
                  dataIndex: 'tran_type',
                  render: (tp) => <Tag color="geekblue">{tp}</Tag>
                },
                {
                  title: t('debit', 'Debit'),
                  dataIndex: 'debit',
                  align: 'right',
                  render: (v) => v > 0 ? `$${v.toFixed(2)}` : '-'
                },
                {
                  title: t('credit', 'Credit'),
                  dataIndex: 'credit',
                  align: 'right',
                  render: (v) => v > 0 ? `$${v.toFixed(2)}` : '-'
                }
              ]}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ChartOfAccountsPage;
