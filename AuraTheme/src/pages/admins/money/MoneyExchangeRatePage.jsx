import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Tag,
  Space,
  Row,
  Col,
  Typography,
  Modal,
  Form,
  InputNumber,
  Switch,
  Tabs,
  message,
  Popconfirm,
  Tooltip
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  SwapOutlined,
  EditOutlined,
  ReloadOutlined,
  CalculatorOutlined,
  GlobalOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { useAdminTheme } from '../../../hooks/useAdminTheme';
import { useTranslation } from '../../../contexts/LanguageContext';
import MoneyModuleNav from './MoneyModuleNav';

const { Title, Text } = Typography;
const { Option } = Select;

const API_BASE = '/api/admin/money_exchange';

const formatNum = (val, decimals = 2) => {
  const num = parseFloat(val || 0);
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

const MoneyExchangeRatePage = () => {
  const { t } = useTranslation();
  const { isDark } = useAdminTheme();
  const [currencyForm] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [savingRates, setSavingRates] = useState(false);
  const [currencies, setCurrencies] = useState([]);
  const [rateRows, setRateRows] = useState([]);

  // Live Converter Preview
  const [simAmount, setSimAmount] = useState(100);
  const [simFrom, setSimFrom] = useState('USD');
  const [simTo, setSimTo] = useState('KHR');

  // Add / Edit Currency Modal (replicates AURA_v1 views/money/edit_currency.php)
  const [currencyModalOpen, setCurrencyModalOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState(null);
  const [savingCurrency, setSavingCurrency] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/rates`);
      if (res.data?.status) {
        const curList = res.data.currencies || [];
        const ratesList = res.data.data || [];
        setCurrencies(curList);

        if (ratesList.length > 0) {
          setRateRows(
            ratesList.map((r, idx) => ({
              key: `rate_${r.id || idx}_${Date.now()}`,
              from_currency: r.from_currency,
              to_currency: r.to_currency,
              exchange_rate: parseFloat(r.exchange_rate || 0)
            }))
          );
        } else if (curList.length >= 2) {
          setRateRows([
            {
              key: `rate_init_${Date.now()}`,
              from_currency: curList[0].code,
              to_currency: curList[1].code,
              exchange_rate: 0
            }
          ]);
        }
      }
    } catch (err) {
      console.error('Failed to load exchange rates:', err);
      message.error('Failed to load exchange rates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddPairRow = () => {
    const defaultFrom = currencies[0]?.code || 'USD';
    const defaultTo = currencies.find((c) => c.code !== defaultFrom)?.code || 'KHR';
    setRateRows((prev) => [
      ...prev,
      {
        key: `rate_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        from_currency: defaultFrom,
        to_currency: defaultTo,
        exchange_rate: 0
      }
    ]);
  };

  // Auto-generate all missing ordered pairs across configured currencies
  const handleGenerateMissingPairs = () => {
    if (currencies.length < 2) {
      message.info('Add at least 2 currencies first.');
      return;
    }
    const existingSet = new Set(
      rateRows.map((r) => `${String(r.from_currency).toUpperCase()}__${String(r.to_currency).toUpperCase()}`)
    );
    const additions = [];
    currencies.forEach((fromC) => {
      currencies.forEach((toC) => {
        if (fromC.code !== toC.code) {
          const k = `${fromC.code.toUpperCase()}__${toC.code.toUpperCase()}`;
          if (!existingSet.has(k)) {
            const derived =
              parseFloat(fromC.rate) > 0
                ? Number((parseFloat(toC.rate) / parseFloat(fromC.rate)).toFixed(4))
                : 0;
            additions.push({
              key: `rate_gen_${fromC.code}_${toC.code}_${Date.now()}`,
              from_currency: fromC.code,
              to_currency: toC.code,
              exchange_rate: derived
            });
          }
        }
      });
    });
    if (!additions.length) {
      message.info('All currency pairs are already in the formulation table.');
      return;
    }
    setRateRows((prev) => [...prev, ...additions]);
    message.success(`Added ${additions.length} missing currency pair(s).`);
  };

  const handleUpdateRow = (rowKey, field, val) => {
    setRateRows((prev) =>
      prev.map((r) => {
        if (r.key !== rowKey) return r;
        const next = { ...r, [field]: val };
        if (field !== 'exchange_rate' && next.from_currency === next.to_currency) {
          message.warning('From Currency and To Currency must be different.');
          return r;
        }
        return next;
      })
    );
  };

  const handleRemoveRow = (rowKey) => {
    setRateRows((prev) => prev.filter((r) => r.key !== rowKey));
  };

  const handleSaveExchangeRates = async () => {
    const duplicateCheck = new Set();
    for (const r of rateRows) {
      if (!r.from_currency || !r.to_currency) {
        message.error('Please select both From Currency and To Currency on every row.');
        return;
      }
      if (r.from_currency === r.to_currency) {
        message.error(`Invalid pair ${r.from_currency} → ${r.to_currency}: currencies cannot be identical.`);
        return;
      }
      const pairKey = `${r.from_currency}_${r.to_currency}`;
      if (duplicateCheck.has(pairKey)) {
        message.warning(`Duplicate pair ${r.from_currency} → ${r.to_currency} found; please keep one row per pair.`);
        return;
      }
      duplicateCheck.add(pairKey);
    }

    setSavingRates(true);
    try {
      await axios.post(`${API_BASE}/rates`, { rates: rateRows });
      message.success(t('exchange_rate_updated', 'Exchange rates updated successfully'));
      loadData();
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to save exchange rates');
    } finally {
      setSavingRates(false);
    }
  };

  // Simulator calculation
  const simResult = useMemo(() => {
    if (simFrom === simTo) return { rate: 1, converted: simAmount || 0 };
    const found = rateRows.find(
      (r) =>
        String(r.from_currency).toUpperCase() === String(simFrom).toUpperCase() &&
        String(r.to_currency).toUpperCase() === String(simTo).toUpperCase()
    );
    const rate = found ? parseFloat(found.exchange_rate || 0) : 0;
    return {
      rate,
      converted: (parseFloat(simAmount || 0) || 0) * rate
    };
  }, [simAmount, simFrom, simTo, rateRows]);

  // Currencies CRUD
  const openCurrencyModal = (cur = null) => {
    setEditingCurrency(cur);
    if (cur) {
      currencyForm.setFieldsValue({
        code: cur.code,
        name: cur.name,
        symbol: cur.symbol || '',
        rate: parseFloat(cur.rate || 1),
        auto_update: Boolean(cur.auto_update)
      });
    } else {
      currencyForm.resetFields();
      currencyForm.setFieldsValue({ rate: 1, auto_update: false });
    }
    setCurrencyModalOpen(true);
  };

  const handleSaveCurrency = async (values) => {
    setSavingCurrency(true);
    try {
      if (editingCurrency) {
        await axios.put(`${API_BASE}/currencies/${editingCurrency.id}`, values);
        message.success('Currency updated successfully');
      } else {
        await axios.post(`${API_BASE}/currencies`, values);
        message.success('Currency added successfully');
      }
      setCurrencyModalOpen(false);
      loadData();
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to save currency');
    } finally {
      setSavingCurrency(false);
    }
  };

  const handleDeleteCurrency = async (id) => {
    try {
      await axios.delete(`${API_BASE}/currencies/${id}`);
      message.success('Currency deleted');
      loadData();
    } catch (err) {
      message.error(err.response?.data?.message || 'Cannot delete currency');
    }
  };

  const cardStyle = {
    borderRadius: 10,
    marginBottom: 16,
    background: isDark ? '#0f172a' : '#ffffff',
    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
    boxShadow: isDark ? '0 4px 14px rgba(0, 0, 0, 0.3)' : '0 1px 3px rgba(15, 23, 42, 0.04)'
  };

  return (
    <div style={{ padding: '4px 0 32px' }}>
      <MoneyModuleNav activeKey="exchange_rate" />

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
            {t('money_exchange_rate', 'Money Exchange Rate Board')}
          </Title>
          <Text style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#64748b' }}>
            {t(
              'exchange_rate_subtitle',
              'Configure directional Buy/Sell pair exchange rates and base currency definitions.'
            )}
          </Text>
        </div>

        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={loadData} style={{ borderRadius: 8 }}>
            {t('refresh', 'Refresh')}
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={savingRates}
            onClick={handleSaveExchangeRates}
            style={{ background: '#10b981', borderColor: '#10b981', borderRadius: 8, fontWeight: 600 }}
          >
            {t('update_exchange_rates', 'Save Pair Rates')}
          </Button>
        </Space>
      </div>

      {/* Live Counter Rate Preview Calculator */}
      <Card bordered={false} style={cardStyle} bodyStyle={{ padding: '14px 18px' }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} md={5}>
            <Space>
              <CalculatorOutlined style={{ color: '#10b981', fontSize: 18 }} />
              <Text strong style={{ color: isDark ? '#f1f5f9' : '#0f172a' }}>
                {t('live_rate_preview', 'Live Pair Simulator')}
              </Text>
            </Space>
          </Col>
          <Col xs={24} sm={7} md={5}>
            <InputNumber
              min={0}
              value={simAmount}
              onChange={(v) => setSimAmount(v || 0)}
              style={{ width: '100%' }}
              addonBefore="Amt"
            />
          </Col>
          <Col xs={10} sm={6} md={4}>
            <Select value={simFrom} onChange={setSimFrom} style={{ width: '100%' }}>
              {currencies.map((c) => (
                <Option key={c.code} value={c.code}>
                  {c.code}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={4} sm={2} md={2} style={{ textAlign: 'center' }}>
            <Button
              shape="circle"
              size="small"
              icon={<SwapOutlined />}
              onClick={() => {
                const f = simFrom;
                setSimFrom(simTo);
                setSimTo(f);
              }}
            />
          </Col>
          <Col xs={10} sm={6} md={4}>
            <Select value={simTo} onChange={setSimTo} style={{ width: '100%' }}>
              {currencies.map((c) => (
                <Option key={c.code} value={c.code}>
                  {c.code}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} md={4} style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: isDark ? '#94a3b8' : '#64748b' }}>
              Rate: {formatNum(simResult.rate, 4)}
            </div>
            <Text strong style={{ fontSize: 17, color: isDark ? '#4ade80' : '#059669' }}>
              {formatNum(simResult.converted)} {simTo}
            </Text>
          </Col>
        </Row>
      </Card>

      <Card bordered={false} style={cardStyle}>
        <Tabs
          defaultActiveKey="pairs"
          items={[
            {
              key: 'pairs',
              label: (
                <Space>
                  <SwapOutlined />
                  <span>{t('pair_formulation', 'Currency Pair Exchange Rates')}</span>
                  <Tag color="green">{rateRows.length}</Tag>
                </Space>
              ),
              children: (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 10,
                      marginBottom: 14
                    }}
                  >
                    <Text style={{ fontSize: 13, color: isDark ? '#94a3b8' : '#64748b' }}>
                      {t(
                        'formulation_help',
                        'Define directional counter rates (From Currency → To Currency). These rates auto-populate in Add Exchange.'
                      )}
                    </Text>
                    <Space>
                      <Button icon={<ThunderboltOutlined />} onClick={handleGenerateMissingPairs}>
                        {t('generate_missing_pairs', 'Generate All Pairs')}
                      </Button>
                      <Button
                        type="dashed"
                        icon={<PlusOutlined />}
                        onClick={handleAddPairRow}
                        style={{ borderColor: '#10b981', color: '#10b981' }}
                      >
                        {t('add_pair_row', 'Add Pair Row')}
                      </Button>
                    </Space>
                  </div>

                  <Table
                    rowKey="key"
                    loading={loading}
                    dataSource={rateRows}
                    pagination={false}
                    bordered
                    size="middle"
                    columns={[
                      {
                        title: '#',
                        width: 55,
                        align: 'center',
                        render: (_, __, idx) => idx + 1
                      },
                      {
                        title: t('from_currency', 'From Currency'),
                        dataIndex: 'from_currency',
                        width: 240,
                        render: (val, row) => (
                          <Select
                            value={val}
                            onChange={(v) => handleUpdateRow(row.key, 'from_currency', v)}
                            style={{ width: '100%' }}
                          >
                            {currencies.map((c) => (
                              <Option key={c.code} value={c.code}>
                                <strong>{c.code}</strong> — {c.name} ({c.symbol || c.code})
                              </Option>
                            ))}
                          </Select>
                        )
                      },
                      {
                        title: t('to_currency', 'To Currency'),
                        dataIndex: 'to_currency',
                        width: 240,
                        render: (val, row) => (
                          <Select
                            value={val}
                            onChange={(v) => handleUpdateRow(row.key, 'to_currency', v)}
                            style={{ width: '100%' }}
                          >
                            {currencies.map((c) => (
                              <Option key={c.code} value={c.code}>
                                <strong>{c.code}</strong> — {c.name} ({c.symbol || c.code})
                              </Option>
                            ))}
                          </Select>
                        )
                      },
                      {
                        title: t('exchange_rate', 'Exchange Rate'),
                        dataIndex: 'exchange_rate',
                        width: 200,
                        render: (val, row) => (
                          <InputNumber
                            min={0}
                            step={0.01}
                            value={val}
                            onChange={(v) => handleUpdateRow(row.key, 'exchange_rate', v ?? 0)}
                            style={{ width: '100%' }}
                          />
                        )
                      },
                      {
                        title: t('conversion_formula', 'Formula Preview'),
                        key: 'preview',
                        render: (_, row) => (
                          <Text style={{ color: isDark ? '#cbd5e1' : '#334155', fontSize: 13 }}>
                            1 <strong>{row.from_currency}</strong> × {formatNum(row.exchange_rate, 4)} ={' '}
                            <strong style={{ color: isDark ? '#4ade80' : '#059669' }}>
                              {formatNum(row.exchange_rate, 4)} {row.to_currency}
                            </strong>
                          </Text>
                        )
                      },
                      {
                        title: '',
                        width: 60,
                        align: 'center',
                        render: (_, row) => (
                          <Tooltip title="Remove Pair">
                            <Button
                              danger
                              type="text"
                              icon={<DeleteOutlined />}
                              onClick={() => handleRemoveRow(row.key)}
                            />
                          </Tooltip>
                        )
                      }
                    ]}
                  />

                  <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      type="primary"
                      icon={<SaveOutlined />}
                      loading={savingRates}
                      onClick={handleSaveExchangeRates}
                      style={{ background: '#10b981', borderColor: '#10b981', borderRadius: 8, fontWeight: 600 }}
                    >
                      {t('update', 'Update Exchange Rates')}
                    </Button>
                  </div>
                </div>
              )
            },
            {
              key: 'currencies',
              label: (
                <Space>
                  <GlobalOutlined />
                  <span>{t('currencies_master', 'Currencies (Base Rates)')}</span>
                  <Tag color="blue">{currencies.length}</Tag>
                </Space>
              ),
              children: (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                    <Text style={{ fontSize: 13, color: isDark ? '#94a3b8' : '#64748b' }}>
                      {t('currencies_help', 'Manage currency codes, symbols, and base reference rates.')}
                    </Text>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => openCurrencyModal(null)}
                      style={{ background: '#10b981', borderColor: '#10b981', borderRadius: 8 }}
                    >
                      {t('add_currency', 'Add Currency')}
                    </Button>
                  </div>

                  <Table
                    rowKey="id"
                    loading={loading}
                    dataSource={currencies}
                    pagination={false}
                    bordered
                    size="middle"
                    columns={[
                      {
                        title: 'Code',
                        dataIndex: 'code',
                        width: 110,
                        render: (v) => <Tag color="blue">{v}</Tag>
                      },
                      { title: 'Currency Name', dataIndex: 'name' },
                      { title: 'Symbol', dataIndex: 'symbol', width: 110 },
                      {
                        title: 'Base Exchange Rate',
                        dataIndex: 'rate',
                        width: 180,
                        align: 'right',
                        render: (v) => <strong>{formatNum(v, 4)}</strong>
                      },
                      {
                        title: 'Auto Update',
                        dataIndex: 'auto_update',
                        width: 120,
                        align: 'center',
                        render: (v) => <Tag color={v ? 'green' : 'default'}>{v ? 'Yes' : 'No'}</Tag>
                      },
                      {
                        title: 'Actions',
                        width: 120,
                        align: 'center',
                        render: (_, cur) => (
                          <Space>
                            <Button
                              size="small"
                              icon={<EditOutlined />}
                              onClick={() => openCurrencyModal(cur)}
                            />
                            {cur.id !== 1 && (
                              <Popconfirm
                                title={`Delete currency ${cur.code}?`}
                                onConfirm={() => handleDeleteCurrency(cur.id)}
                              >
                                <Button danger size="small" icon={<DeleteOutlined />} />
                              </Popconfirm>
                            )}
                          </Space>
                        )
                      }
                    ]}
                  />
                </div>
              )
            }
          ]}
        />
      </Card>

      {/* Add / Edit Currency Modal (Replicates AURA_v1 views/money/edit_currency.php) */}
      <Modal
        title={editingCurrency ? `Edit Currency (${editingCurrency.code})` : 'Add New Currency'}
        open={currencyModalOpen}
        onCancel={() => setCurrencyModalOpen(false)}
        onOk={() => currencyForm.submit()}
        confirmLoading={savingCurrency}
        okButtonProps={{ style: { background: '#10b981', borderColor: '#10b981' } }}
      >
        <Form form={currencyForm} layout="vertical" onFinish={handleSaveCurrency}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="code"
                label="Currency Code (e.g. USD, KHR, THB)"
                rules={[{ required: true, message: 'Currency code is required' }]}
              >
                <Input maxLength={5} style={{ textTransform: 'uppercase' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="symbol" label="Symbol (e.g. $, ៛, ฿)">
                <Input />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                name="name"
                label="Currency Name"
                rules={[{ required: true, message: 'Currency name is required' }]}
              >
                <Input placeholder="e.g. Cambodian Riel" />
              </Form.Item>
            </Col>
            <Col span={14}>
              <Form.Item
                name="rate"
                label="Exchange Rate (vs Base Currency)"
                rules={[{ required: true, message: 'Rate is required' }]}
              >
                <InputNumber min={0.0001} step={0.01} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="auto_update" label="Auto Update" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default MoneyExchangeRatePage;
