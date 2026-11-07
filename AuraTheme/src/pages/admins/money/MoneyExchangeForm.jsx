import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Form,
  InputNumber,
  message,
  Divider,
  Empty,
  Modal,
  Tooltip,
  AutoComplete,
  Spin
} from 'antd';
import {
  DeleteOutlined,
  ArrowLeftOutlined,
  SwapOutlined,
  BarcodeOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
  DollarOutlined,
  BankOutlined,
  UserAddOutlined
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAdminTheme } from '../../../hooks/useAdminTheme';
import { useTranslation } from '../../../contexts/LanguageContext';
import MoneyModuleNav from './MoneyModuleNav';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const API_BASE = '/api/admin/money_exchange';

function calcDiscountAmount(discountVal, baseAmount) {
  const base = parseFloat(baseAmount) || 0;
  if (!discountVal || base <= 0) return 0;
  const str = String(discountVal).trim();
  if (!str || str === '0') return 0;
  if (str.endsWith('%')) {
    const pct = parseFloat(str.slice(0, -1)) || 0;
    return (base * pct) / 100;
  }
  return parseFloat(str) || 0;
}

const formatNum = (val, decimals = 2) => {
  const num = parseFloat(val || 0);
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

const MoneyExchangeForm = ({ mode = 'create', exchangeId = null }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const duplicateId = searchParams.get('duplicate');
  const { isDark } = useAdminTheme();
  const [form] = Form.useForm();
  const [manualForm] = Form.useForm();
  const [customerForm] = Form.useForm();
  const searchInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [metadata, setMetadata] = useState({
    customers: [],
    billers: [],
    warehouses: [],
    currencies: [],
    exchangeRates: [],
    taxRates: [],
    units: [],
    transferCompanies: [],
    serviceProducts: [],
    salemans: [],
    nextReference: '',
    nextPaymentReference: ''
  });

  const [formItems, setFormItems] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [searchingProducts, setSearchingProducts] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [selectedTransferCompany, setSelectedTransferCompany] = useState(null);

  // Payment state (supports multi-currency c_amount inputs & split payment rows like AURA_v1 money/add.php)
  const [paymentStatus, setPaymentStatus] = useState('paid');
  const [currencyTenders, setCurrencyTenders] = useState({});
  const [paymentRows, setPaymentRows] = useState([
    {
      key: 'pay_1',
      reference_no: '',
      amount: 0,
      paid_by: 'cash',
      bank_name: '',
      account_number: '',
      cheque_no: '',
      note: ''
    }
  ]);

  // Manual service item modal & quick customer modal
  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [creatingCustomer, setCreatingCustomer] = useState(false);

  // Watch order-level adjustments for real-time Grand Total calculation
  const watchedOrderDiscount = Form.useWatch('order_discount', form);
  const watchedOrderTaxId = Form.useWatch('order_tax_id', form);
  const watchedShipping = Form.useWatch('shipping', form);
  const watchedSurcharge = Form.useWatch('surcharge', form);

  // Resolve exchange rate from local matrix first, with API fallback
  const findPairRateLocal = (fromCode, toCode, ratesList, currenciesList) => {
    const f = String(fromCode || '').trim().toUpperCase();
    const tCode = String(toCode || '').trim().toUpperCase();
    if (!f || !tCode) return 0;
    if (f === tCode) return 1;

    const rates = ratesList || metadata.exchangeRates || [];
    const match = rates.find(
      (r) =>
        String(r.from_currency || '').trim().toUpperCase() === f &&
        String(r.to_currency || '').trim().toUpperCase() === tCode
    );
    if (match && parseFloat(match.exchange_rate || 0) > 0) {
      return parseFloat(match.exchange_rate);
    }

    const curs = currenciesList || metadata.currencies || [];
    const fromCur = curs.find((c) => String(c.code).toUpperCase() === f);
    const toCur = curs.find((c) => String(c.code).toUpperCase() === tCode);
    if (fromCur && toCur && parseFloat(fromCur.rate) > 0) {
      return Number((parseFloat(toCur.rate) / parseFloat(fromCur.rate)).toFixed(6));
    }
    return 0;
  };

  const getCurrencySymbol = (code) => {
    const found = (metadata.currencies || []).find(
      (c) => String(c.code || '').toUpperCase() === String(code || '').toUpperCase()
    );
    return found?.symbol || code || '';
  };

  // Load metadata & existing exchange (if edit or duplicate)
  const initializeForm = async () => {
    setLoading(true);
    try {
      const metaRes = await axios.get(`${API_BASE}/meta/options`);
      const meta = metaRes.data?.data || {};
      setMetadata(meta);

      const nowLocal = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);

      const targetLoadId = mode === 'edit' ? exchangeId : duplicateId;

      if (targetLoadId) {
        const exRes = await axios.get(`${API_BASE}/${targetLoadId}`);
        const ex = exRes.data?.data;
        if (ex) {
          const exDate = ex.date
            ? new Date(new Date(ex.date).getTime() - new Date().getTimezoneOffset() * 60000)
                .toISOString()
                .slice(0, 16)
            : nowLocal;

          form.setFieldsValue({
            date: mode === 'edit' ? exDate : nowLocal,
            reference_no: mode === 'edit' ? ex.reference_no : meta.nextReference,
            biller_id: ex.biller_id || meta.billers?.[0]?.id,
            warehouse_id: ex.warehouse_id || meta.warehouses?.[0]?.id,
            customer_id: ex.customer_id || meta.customers?.[0]?.id,
            saleman_by: ex.saleman_by || undefined,
            sale_status: ex.sale_status || 'completed',
            payment_status: mode === 'edit' ? ex.payment_status || 'pending' : 'paid',
            order_discount: ex.order_discount_id || String(ex.order_discount || '0'),
            order_tax_id: ex.order_tax_id || meta.taxRates?.[0]?.id || 1,
            shipping: parseFloat(ex.shipping || 0),
            surcharge: parseFloat(ex.surcharge || 0),
            note: ex.note || '',
            staff_note: ex.staff_note || ''
          });

          setPaymentStatus(mode === 'edit' ? ex.payment_status || 'pending' : 'paid');

          const loadedItems = (ex.items || []).map((it, idx) => {
            const fromCur = it.from_currency || meta.currencies?.[0]?.code || 'USD';
            const toCur =
              it.to_currency ||
              meta.currencies?.find((c) => c.code !== fromCur)?.code ||
              'KHR';
            const rate =
              parseFloat(it.exchange_rate || 0) ||
              findPairRateLocal(fromCur, toCur, meta.exchangeRates, meta.currencies);
            const amt = parseFloat(it.unit_quantity || it.quantity || 1);
            const sub =
              parseFloat(it.subtotal || 0) ||
              (rate > 0 ? rate * amt : parseFloat(it.net_unit_price || 0) * amt);

            return {
              key: `item_${it.id || idx}_${Date.now()}`,
              product_id: it.product_id,
              product_code: it.product_code,
              product_name: it.product_name,
              product_type: it.product_type || 'service',
              from_currency: fromCur,
              to_currency: toCur,
              unit_quantity: amt,
              quantity: parseFloat(it.quantity || 1),
              exchange_rate: rate,
              unit_price: parseFloat(it.unit_price || 0),
              net_unit_price: parseFloat(it.net_unit_price || 0),
              commission: parseFloat(it.commission || 0),
              transfer_fee: 0,
              subtotal: Number(sub.toFixed(4)),
              comment: it.comment || ''
            };
          });
          setFormItems(loadedItems);
        }
      } else {
        // Default values for Add Exchange
        form.setFieldsValue({
          date: nowLocal,
          reference_no: meta.nextReference || '',
          biller_id: meta.billers?.[0]?.id || 1,
          warehouse_id: meta.warehouses?.[0]?.id || 1,
          customer_id: meta.customers?.[0]?.id || 1,
          sale_status: 'completed',
          payment_status: 'paid',
          order_discount: '0',
          order_tax_id: meta.taxRates?.[0]?.id || 1,
          shipping: 0,
          surcharge: 0,
          note: '',
          staff_note: ''
        });
        setPaymentStatus('paid');

        setPaymentRows([
          {
            key: 'pay_1',
            reference_no: meta.nextPaymentReference || '',
            amount: 0,
            paid_by: 'cash',
            bank_name: '',
            account_number: '',
            cheque_no: '',
            note: ''
          }
        ]);

        // Pre-add 1 ready-to-use Exchange Money row so tellers can type an amount immediately
        const defaultSvc = meta.serviceProducts?.[0] || {
          id: 1,
          code: 'EXC',
          name: 'Exchange Money',
          type: 'service'
        };
        const fromCur = meta.currencies?.find((c) => c.code === 'USD')?.code || meta.currencies?.[0]?.code || 'USD';
        const toCur =
          meta.currencies?.find((c) => c.code === 'KHR' && c.code !== fromCur)?.code ||
          meta.currencies?.find((c) => c.code !== fromCur)?.code ||
          'KHR';
        const initialRate = findPairRateLocal(fromCur, toCur, meta.exchangeRates, meta.currencies);

        setFormItems([
          {
            key: `item_init_${Date.now()}`,
            product_id: defaultSvc.id,
            product_code: defaultSvc.code,
            product_name: defaultSvc.name,
            product_type: defaultSvc.type || 'service',
            from_currency: fromCur,
            to_currency: toCur,
            unit_quantity: 1,
            quantity: 1,
            exchange_rate: initialRate,
            unit_price: parseFloat(defaultSvc.price || 0),
            net_unit_price: parseFloat(defaultSvc.price || 0),
            commission: 0,
            transfer_fee: 0,
            subtotal: Number((initialRate * 1).toFixed(4)),
            comment: ''
          }
        ]);
      }

      fetchSuggestions('');
    } catch (err) {
      console.error('Failed to initialize Money Exchange form:', err);
      message.error(t('failed_to_load_metadata', 'Failed to load money exchange form options'));
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestions = async (term = '') => {
    setSearchingProducts(true);
    try {
      const whId = form.getFieldValue('warehouse_id') || 1;
      const res = await axios.get(`${API_BASE}/suggestions`, {
        params: { term: term.trim(), warehouse_id: whId, limit: 20 }
      });
      if (res.data?.status && Array.isArray(res.data.data)) {
        setSuggestions(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch exchange suggestions:', err);
    } finally {
      setSearchingProducts(false);
    }
  };

  useEffect(() => {
    initializeForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, exchangeId, duplicateId]);

  // Recompute row subtotal & optional transfer company range fee
  const recomputeRow = (row) => {
    const qty = parseFloat(row.unit_quantity ?? 0) || 0;
    const rate = parseFloat(row.exchange_rate ?? 0) || 0;
    const fee = parseFloat(row.transfer_fee ?? 0) || 0;
    const netPrice = parseFloat(row.net_unit_price ?? 0) || 0;
    const sub = rate > 0 ? rate * qty + fee : netPrice * qty + fee;
    return {
      ...row,
      subtotal: Number(Math.max(0, sub).toFixed(4))
    };
  };

  // Add a service product or currency pair row
  const handleAddServiceRow = (product = null) => {
    const svc =
      product ||
      metadata.serviceProducts?.[0] || {
        id: 1,
        code: 'EXC',
        name: 'Exchange Money',
        type: 'service',
        price: 0
      };
    const fromCur = metadata.currencies?.find((c) => c.code === 'USD')?.code || metadata.currencies?.[0]?.code || 'USD';
    const toCur =
      metadata.currencies?.find((c) => c.code === 'KHR' && c.code !== fromCur)?.code ||
      metadata.currencies?.find((c) => c.code !== fromCur)?.code ||
      'KHR';
    const rate = findPairRateLocal(fromCur, toCur);

    const newRow = recomputeRow({
      key: `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      product_id: svc.id || 1,
      product_code: svc.code || 'EXC',
      product_name: svc.name || 'Exchange Money',
      product_type: svc.type || 'service',
      from_currency: fromCur,
      to_currency: toCur,
      unit_quantity: 1,
      quantity: 1,
      exchange_rate: rate,
      unit_price: parseFloat(svc.price || 0),
      net_unit_price: parseFloat(svc.price || 0),
      commission: 0,
      transfer_fee: 0,
      comment: ''
    });

    setFormItems((prev) => [...prev, newRow]);
  };

  const handleSelectSuggestion = (code) => {
    const found = suggestions.find((s) => s.code === code);
    if (found) {
      handleAddServiceRow(found);
      setSearchValue('');
    }
  };

  // Handle From/To currency change with duplicate guard & live API rate lookup (matches AURA_v1 money_exchange.js)
  const handleCurrencyChange = async (rowKey, field, newCode) => {
    const targetRow = formItems.find((it) => it.key === rowKey);
    if (!targetRow) return;

    const nextFrom = field === 'from_currency' ? newCode : targetRow.from_currency;
    const nextTo = field === 'to_currency' ? newCode : targetRow.to_currency;

    if (nextFrom && nextTo && nextFrom === nextTo) {
      message.warning(t('same_currency_warning', 'From Currency and To Currency cannot be the same!'));
      return;
    }

    // Immediate local update
    const localRate = findPairRateLocal(nextFrom, nextTo);
    setFormItems((prev) =>
      prev.map((it) =>
        it.key === rowKey
          ? recomputeRow({
              ...it,
              [field]: newCode,
              exchange_rate: localRate
            })
          : it
      )
    );

    // Confirm with live backend rate-lookup endpoint
    try {
      const res = await axios.get(`${API_BASE}/rate-lookup`, {
        params: { from_currency: nextFrom, to_currency: nextTo }
      });
      if (res.data?.status && res.data.data) {
        const fetchedRate = parseFloat(res.data.data.exchange_rate || 0);
        setFormItems((prev) =>
          prev.map((it) =>
            it.key === rowKey
              ? recomputeRow({
                  ...it,
                  [field]: newCode,
                  exchange_rate: fetchedRate
                })
              : it
          )
        );
      }
    } catch (_) {}
  };

  // Swap From <-> To currency in 1 click
  const handleSwapPair = async (rowKey) => {
    const targetRow = formItems.find((it) => it.key === rowKey);
    if (!targetRow) return;
    const swappedFrom = targetRow.to_currency;
    const swappedTo = targetRow.from_currency;
    const localRate = findPairRateLocal(swappedFrom, swappedTo);

    setFormItems((prev) =>
      prev.map((it) =>
        it.key === rowKey
          ? recomputeRow({
              ...it,
              from_currency: swappedFrom,
              to_currency: swappedTo,
              exchange_rate: localRate
            })
          : it
      )
    );

    try {
      const res = await axios.get(`${API_BASE}/rate-lookup`, {
        params: { from_currency: swappedFrom, to_currency: swappedTo }
      });
      if (res.data?.status && res.data.data) {
        const fetchedRate = parseFloat(res.data.data.exchange_rate || 0);
        setFormItems((prev) =>
          prev.map((it) =>
            it.key === rowKey
              ? recomputeRow({
                  ...it,
                  from_currency: swappedFrom,
                  to_currency: swappedTo,
                  exchange_rate: fetchedRate
                })
              : it
          )
        );
      }
    } catch (_) {}
  };

  // Update amount, exchange rate, or comment on row (+ lookup transfer fee if a Transfer Company is selected)
  const handleRowFieldChange = async (rowKey, field, value) => {
    setFormItems((prev) =>
      prev.map((it) => (it.key === rowKey ? recomputeRow({ ...it, [field]: value }) : it))
    );

    if (field === 'unit_quantity' && selectedTransferCompany && parseFloat(value || 0) > 0) {
      try {
        const res = await axios.get(`${API_BASE}/transfer-companies/range-lookup`, {
          params: { company_id: selectedTransferCompany, amount: value }
        });
        if (res.data?.status && res.data.data) {
          const { commission = 0, transfer_fee = 0 } = res.data.data;
          setFormItems((prev) =>
            prev.map((it) =>
              it.key === rowKey
                ? recomputeRow({
                    ...it,
                    commission: parseFloat(commission || 0),
                    transfer_fee: parseFloat(transfer_fee || 0)
                  })
                : it
            )
          );
        }
      } catch (_) {}
    }
  };

  const handleRemoveItem = (rowKey) => {
    setFormItems((prev) => prev.filter((it) => it.key !== rowKey));
  };

  // Order-level totals calculation
  const calculations = useMemo(() => {
    const itemsTotal = formItems.reduce((acc, it) => acc + (parseFloat(it.subtotal) || 0), 0);
    const totalQty = formItems.reduce((acc, it) => acc + (parseFloat(it.unit_quantity) || 0), 0);
    const totalCommission = formItems.reduce((acc, it) => acc + (parseFloat(it.commission) || 0), 0);

    const orderDiscountVal = calcDiscountAmount(watchedOrderDiscount, itemsTotal);
    const taxableBase = Math.max(0, itemsTotal - orderDiscountVal);

    let orderTaxVal = 0;
    const taxObj = (metadata.taxRates || []).find((tr) => Number(tr.id) === Number(watchedOrderTaxId));
    if (taxObj && parseFloat(taxObj.rate) > 0) {
      orderTaxVal =
        String(taxObj.type) === '1'
          ? (taxableBase * parseFloat(taxObj.rate)) / 100
          : parseFloat(taxObj.rate);
    }

    const shippingVal = parseFloat(watchedShipping || 0) || 0;
    const surchargeVal = parseFloat(watchedSurcharge || 0) || 0;
    const grandTotal = Math.max(0, taxableBase + orderTaxVal + shippingVal + surchargeVal);

    return {
      itemsTotal: Number(itemsTotal.toFixed(4)),
      totalQty: Number(totalQty.toFixed(4)),
      totalCommission: Number(totalCommission.toFixed(4)),
      orderDiscountVal: Number(orderDiscountVal.toFixed(4)),
      orderTaxVal: Number(orderTaxVal.toFixed(4)),
      shippingVal: Number(shippingVal.toFixed(4)),
      surchargeVal: Number(surchargeVal.toFixed(4)),
      grandTotal: Number(grandTotal.toFixed(4))
    };
  }, [formItems, watchedOrderDiscount, watchedOrderTaxId, watchedShipping, watchedSurcharge, metadata.taxRates]);

  // Sync default payment row #1 amount when paymentStatus is 'paid' and user hasn't typed custom multi-currency tenders
  useEffect(() => {
    if (mode === 'create' && paymentStatus === 'paid' && Object.keys(currencyTenders).length === 0) {
      setPaymentRows((prev) => {
        if (prev.length === 1) {
          return [{ ...prev[0], amount: calculations.grandTotal }];
        }
        return prev;
      });
    }
  }, [calculations.grandTotal, paymentStatus, mode, currencyTenders]);

  // Multi-currency tender helper (replicates AURA_v1 c_amount inputs in money/add.php)
  const handleCurrencyTenderChange = (curCode, val) => {
    const next = { ...currencyTenders, [curCode]: parseFloat(val || 0) || 0 };
    setCurrencyTenders(next);

    // Sum converted amounts across currencies (matching money/add.php lines 1134-1149)
    let convertedTotal = 0;
    Object.entries(next).forEach(([code, cAmt]) => {
      if (cAmt > 0) {
        const curObj = (metadata.currencies || []).find((c) => c.code === code);
        const baseRate = parseFloat(curObj?.rate || 1) || 1;
        convertedTotal += cAmt / baseRate;
      }
    });

    if (convertedTotal > 0) {
      setPaymentRows((prev) => {
        const copy = [...prev];
        copy[0] = { ...copy[0], amount: Number(convertedTotal.toFixed(4)) };
        return copy;
      });
    }
  };

  // Manual Item Modal submit
  const handleAddManualItem = (values) => {
    if (values.from_currency === values.to_currency) {
      message.warning(t('same_currency_warning', 'From Currency and To Currency cannot be the same!'));
      return;
    }
    const newRow = recomputeRow({
      key: `manual_${Date.now()}`,
      product_id: 1,
      product_code: values.code || 'MANUAL',
      product_name: values.name || 'Manual Exchange Service',
      product_type: 'manual',
      from_currency: values.from_currency,
      to_currency: values.to_currency,
      unit_quantity: parseFloat(values.amount || 1),
      quantity: 1,
      exchange_rate: parseFloat(values.exchange_rate || 0),
      unit_price: 0,
      net_unit_price: 0,
      commission: 0,
      transfer_fee: 0,
      comment: values.comment || ''
    });
    setFormItems((prev) => [...prev, newRow]);
    setManualModalVisible(false);
    manualForm.resetFields();
  };

  // Quick Add Customer Modal submit
  const handleQuickAddCustomer = async (values) => {
    setCreatingCustomer(true);
    try {
      const res = await axios.post('/api/admin/customers', {
        name: values.name,
        company: values.company || values.name,
        phone: values.phone || '',
        email: values.email || '',
        address: values.address || '',
        group_name: 'customer'
      });
      const newCust = res.data?.data || res.data?.customer;
      const metaRes = await axios.get(`${API_BASE}/meta/options`);
      if (metaRes.data?.data) {
        setMetadata(metaRes.data.data);
        const createdId = newCust?.id || metaRes.data.data.customers?.find((c) => c.name === values.name)?.id;
        if (createdId) {
          form.setFieldValue('customer_id', createdId);
        }
      }
      message.success(t('customer_added', 'Customer added successfully'));
      setCustomerModalVisible(false);
      customerForm.resetFields();
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to create customer');
    } finally {
      setCreatingCustomer(false);
    }
  };

  // Submit Create or Update Money Exchange
  const handleSubmit = async (values) => {
    if (!formItems.length) {
      message.error(t('please_add_exchange_items', 'Please add at least one exchange item.'));
      return;
    }

    setSubmitting(true);
    try {
      let paymentsPayload = [];
      if (values.payment_status === 'paid' || values.payment_status === 'partial') {
        const activeCurrencies = Object.entries(currencyTenders)
          .filter(([, amt]) => amt > 0)
          .map(([code, amt]) => {
            const cObj = (metadata.currencies || []).find((c) => c.code === code);
            return { currency: code, amount: amt, rate: cObj?.rate || 1 };
          });

        paymentsPayload = paymentRows
          .filter((p) => parseFloat(p.amount || 0) > 0)
          .map((p, idx) => ({
            reference_no: p.reference_no,
            amount: parseFloat(p.amount || 0),
            paid_by: p.paid_by || 'cash',
            bank_name: p.bank_name,
            account_number: p.account_number,
            cheque_no: p.cheque_no,
            note: p.note,
            amount_usd: currencyTenders.USD || 0,
            amount_khr: currencyTenders.KHR || 0,
            amount_thb: currencyTenders.BAHT || currencyTenders.THB || 0,
            currencies: idx === 0 && activeCurrencies.length > 0 ? activeCurrencies : null
          }));
      }

      const payload = {
        ...values,
        order_discount_id: values.order_discount || '0',
        commission_amount: calculations.totalCommission,
        items: formItems,
        payments: mode === 'create' ? paymentsPayload : paymentsPayload.filter((p) => p.isNew)
      };

      if (mode === 'edit' && exchangeId) {
        await axios.put(`${API_BASE}/${exchangeId}`, payload);
        message.success(t('exchange_updated_success', 'Money exchange updated successfully'));
      } else {
        await axios.post(API_BASE, payload);
        message.success(t('exchange_created_success', 'Money exchange recorded successfully'));
      }
      navigate('/admins/money');
    } catch (err) {
      console.error('Submit Money Exchange error:', err);
      message.error(err.response?.data?.message || 'Failed to save money exchange transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const cardStyle = {
    borderRadius: 10,
    marginBottom: 18,
    background: isDark ? '#0f172a' : '#ffffff',
    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
    boxShadow: isDark ? '0 4px 14px rgba(0, 0, 0, 0.35)' : '0 1px 3px rgba(15, 23, 42, 0.05)'
  };

  return (
    <div style={{ padding: '4px 0 32px' }}>
      <MoneyModuleNav activeKey="add" />

      {/* Top Page Title Bar */}
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
            onClick={() => navigate('/admins/money')}
            style={{ borderRadius: 8 }}
          >
            {t('back_to_list', 'Back')}
          </Button>
          <div>
            <Title level={4} style={{ margin: 0, color: isDark ? '#f8fafc' : '#0f172a' }}>
              {mode === 'edit'
                ? t('edit_money_exchange', `Edit Money Exchange #${exchangeId}`)
                : t('add_money_exchange', 'Add Money Exchange')}
            </Title>
            <Text style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#64748b' }}>
              {t(
                'money_exchange_form_subtitle',
                'Process multi-currency conversions, transfer fees, and multi-currency counter payments.'
              )}
            </Text>
          </div>
        </Space>

        <Space>
          <Button
            icon={<SwapOutlined />}
            onClick={() => navigate('/admins/money/exchange_rate')}
            style={{ borderRadius: 8 }}
          >
            {t('configure_rates', 'Configure Pair Rates')}
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={submitting}
            onClick={() => form.submit()}
            style={{ background: '#10b981', borderColor: '#10b981', borderRadius: 8, fontWeight: 600 }}
          >
            {mode === 'edit' ? t('update_exchange', 'Update Exchange') : t('submit_exchange', 'Submit Exchange')}
          </Button>
        </Space>
      </div>

      <Spin spinning={loading}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {/* 1. Document & Counter Party Details */}
          <Card bordered={false} style={cardStyle}>
            <Row gutter={[16, 4]}>
              <Col xs={24} sm={12} md={6}>
                <Form.Item
                  name="date"
                  label={t('date', 'Date')}
                  rules={[{ required: true, message: 'Date is required' }]}
                >
                  <Input type="datetime-local" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <Form.Item
                  name="reference_no"
                  label={t('reference_no', 'Reference No')}
                  rules={[{ required: true, message: 'Reference No is required' }]}
                >
                  <Input placeholder="ME-202611-0001" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <Form.Item
                  name="biller_id"
                  label={t('biller', 'Biller / Branch')}
                  rules={[{ required: true, message: 'Biller is required' }]}
                >
                  <Select showSearch optionFilterProp="children" placeholder="Select Biller">
                    {(metadata.billers || []).map((b) => (
                      <Option key={b.id} value={b.id}>
                        {b.company && b.company !== '-' ? `${b.company} (${b.name})` : b.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <Form.Item
                  name="warehouse_id"
                  label={t('warehouse', 'Warehouse / Vault')}
                  rules={[{ required: true, message: 'Warehouse is required' }]}
                >
                  <Select showSearch optionFilterProp="children" placeholder="Select Warehouse">
                    {(metadata.warehouses || []).map((w) => (
                      <Option key={w.id} value={w.id}>
                        {w.name} ({w.code})
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={8}>
                <Form.Item
                  label={
                    <Space size={8}>
                      <span>{t('customer', 'Customer')} *</span>
                      <Button
                        type="link"
                        size="small"
                        icon={<UserAddOutlined />}
                        style={{ padding: 0, height: 'auto', fontSize: 12 }}
                        onClick={() => setCustomerModalVisible(true)}
                      >
                        {t('quick_add', 'Quick Add')}
                      </Button>
                    </Space>
                  }
                  name="customer_id"
                  rules={[{ required: true, message: 'Customer is required' }]}
                >
                  <Select showSearch optionFilterProp="children" placeholder="Select Customer">
                    {(metadata.customers || []).map((c) => (
                      <Option key={c.id} value={c.id}>
                        {c.name} {c.phone ? `(${c.phone})` : ''}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <Form.Item name="saleman_by" label={t('saleman_teller', 'Teller / Salesman')}>
                  <Select allowClear showSearch optionFilterProp="children" placeholder="Select Teller">
                    {(metadata.salemans || []).map((s) => (
                      <Option key={s.id} value={s.id}>
                        {s.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={5}>
                <Form.Item label={t('transfer_company_optional', 'Transfer Provider (Fee Auto-Tier)')}>
                  <Select
                    allowClear
                    value={selectedTransferCompany}
                    onChange={(val) => setSelectedTransferCompany(val || null)}
                    placeholder="None (Direct Exchange)"
                  >
                    {(metadata.transferCompanies || []).map((tc) => (
                      <Option key={tc.id} value={tc.id}>
                        {tc.name} ({tc.ranges_count || 0} tiers)
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={5}>
                <Form.Item name="sale_status" label={t('exchange_status', 'Exchange Status')}>
                  <Select>
                    <Option value="completed">{t('completed', 'Completed')}</Option>
                    <Option value="pending">{t('pending', 'Pending')}</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* 2. Scan / Search Service Bar & Exchange Items Table */}
          <Card bordered={false} style={cardStyle}>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 10,
                border: isDark ? '1px solid rgba(255, 255, 255, 0.16)' : '1px solid #cbd5e1',
                borderRadius: 8,
                padding: '6px 12px',
                background: isDark ? '#1e293b' : '#f8fafc',
                marginBottom: 16
              }}
            >
              <BarcodeOutlined style={{ fontSize: 20, color: isDark ? '#34d399' : '#059669' }} />
              <AutoComplete
                style={{ flex: 1, minWidth: 220, background: 'transparent' }}
                value={searchValue}
                options={suggestions.map((s) => ({
                  value: s.code,
                  label: (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontWeight: 600, color: isDark ? '#f1f5f9' : '#1e293b' }}>{s.name}</span>
                        <span style={{ color: isDark ? '#94a3b8' : '#64748b', marginLeft: 8, fontSize: 12 }}>
                          ({s.code})
                        </span>
                      </div>
                      <Tag color="green">{s.type || 'service'}</Tag>
                    </div>
                  )
                }))}
                onSearch={(val) => {
                  setSearchValue(val);
                  fetchSuggestions(val);
                }}
                onSelect={handleSelectSuggestion}
                placeholder={t(
                  'search_exchange_service',
                  'Search service item (e.g. Exchange Money, Money Transfer) or press + Add Pair Row...'
                )}
              >
                <Input
                  ref={searchInputRef}
                  bordered={false}
                  style={{ fontSize: 14, color: isDark ? '#f8fafc' : '#1e293b', background: 'transparent' }}
                  onPressEnter={() => {
                    if (searchValue && suggestions.length > 0) {
                      handleSelectSuggestion(suggestions[0].code);
                    }
                  }}
                />
              </AutoComplete>

              <Space size={8}>
                <Button
                  type="primary"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => handleAddServiceRow()}
                  style={{ background: '#10b981', borderColor: '#10b981', borderRadius: 6 }}
                >
                  {t('add_pair_row', 'Add Pair Row')}
                </Button>
                <Button
                  size="small"
                  icon={<BankOutlined />}
                  onClick={() => {
                    const defaultFrom = metadata.currencies?.[0]?.code || 'USD';
                    const defaultTo = metadata.currencies?.find((c) => c.code !== defaultFrom)?.code || 'KHR';
                    manualForm.setFieldsValue({
                      code: 'EXC-MAN',
                      name: 'Custom Currency Exchange',
                      from_currency: defaultFrom,
                      to_currency: defaultTo,
                      amount: 100,
                      exchange_rate: findPairRateLocal(defaultFrom, defaultTo)
                    });
                    setManualModalVisible(true);
                  }}
                  style={{ borderRadius: 6 }}
                >
                  {t('manual_item', 'Manual Item')}
                </Button>
                <Tooltip title={t('reload_suggestions', 'Reload services')}>
                  <Button
                    type="text"
                    size="small"
                    icon={<ReloadOutlined style={{ color: isDark ? '#94a3b8' : '#64748b' }} />}
                    loading={searchingProducts}
                    onClick={() => fetchSuggestions(searchValue)}
                  />
                </Tooltip>
              </Space>
            </div>

            {/* Exchange Items Table (Matches AURA_v1 views/money/add.php #slTable) */}
            <Table
              dataSource={formItems}
              rowKey="key"
              pagination={false}
              bordered
              size="middle"
              scroll={{ x: 960 }}
              locale={{
                emptyText: (
                  <Empty
                    description={t(
                      'no_exchange_items',
                      'No currency exchange rows yet. Click "+ Add Pair Row" above to start.'
                    )}
                  />
                )
              }}
              columns={[
                {
                  title: t('service_product', 'Product / Service'),
                  key: 'product',
                  width: 230,
                  render: (_, row) => (
                    <div>
                      <Text strong style={{ color: isDark ? '#f8fafc' : '#0f172a', fontSize: 13 }}>
                        {row.product_name}
                      </Text>
                      <div style={{ fontSize: 11, color: isDark ? '#94a3b8' : '#64748b', marginBottom: 4 }}>
                        {row.product_code}
                        {row.commission > 0 && (
                          <Tag color="purple" style={{ marginLeft: 6, fontSize: 10 }}>
                            Comm: {formatNum(row.commission)}
                          </Tag>
                        )}
                        {row.transfer_fee > 0 && (
                          <Tag color="gold" style={{ marginLeft: 4, fontSize: 10 }}>
                            Fee: {formatNum(row.transfer_fee)}
                          </Tag>
                        )}
                      </div>
                      <Input
                        size="small"
                        placeholder={t('row_remark', 'Serial / Counter remark...')}
                        value={row.comment || ''}
                        onChange={(e) => handleRowFieldChange(row.key, 'comment', e.target.value)}
                        style={{ fontSize: 12 }}
                      />
                    </div>
                  )
                },
                {
                  title: t('from_currency', 'From Currency'),
                  dataIndex: 'from_currency',
                  key: 'from_currency',
                  width: 145,
                  render: (val, row) => (
                    <Select
                      value={val}
                      onChange={(newVal) => handleCurrencyChange(row.key, 'from_currency', newVal)}
                      style={{ width: '100%' }}
                    >
                      {(metadata.currencies || []).map((c) => (
                        <Option key={c.code} value={c.code}>
                          <strong>{c.code}</strong> ({c.name})
                        </Option>
                      ))}
                    </Select>
                  )
                },
                {
                  title: '',
                  key: 'swap',
                  width: 48,
                  align: 'center',
                  render: (_, row) => (
                    <Tooltip title={t('swap_currencies', 'Swap From / To Currency')}>
                      <Button
                        type="text"
                        icon={<SwapOutlined style={{ color: '#10b981', fontSize: 16 }} />}
                        onClick={() => handleSwapPair(row.key)}
                      />
                    </Tooltip>
                  )
                },
                {
                  title: t('to_currency', 'To Currency'),
                  dataIndex: 'to_currency',
                  key: 'to_currency',
                  width: 145,
                  render: (val, row) => (
                    <Select
                      value={val}
                      onChange={(newVal) => handleCurrencyChange(row.key, 'to_currency', newVal)}
                      style={{ width: '100%' }}
                    >
                      {(metadata.currencies || []).map((c) => (
                        <Option key={c.code} value={c.code}>
                          <strong>{c.code}</strong> ({c.name})
                        </Option>
                      ))}
                    </Select>
                  )
                },
                {
                  title: t('amount', 'Amount'),
                  dataIndex: 'unit_quantity',
                  key: 'unit_quantity',
                  width: 145,
                  render: (val, row) => (
                    <InputNumber
                      min={0}
                      step={1}
                      value={val}
                      addonAfter={row.from_currency || ''}
                      onChange={(newVal) => handleRowFieldChange(row.key, 'unit_quantity', newVal)}
                      style={{ width: '100%' }}
                    />
                  )
                },
                {
                  title: t('exchange_rate', 'Exchange Rate'),
                  dataIndex: 'exchange_rate',
                  key: 'exchange_rate',
                  width: 150,
                  render: (val, row) => (
                    <InputNumber
                      min={0}
                      step={0.01}
                      value={val}
                      onChange={(newVal) => handleRowFieldChange(row.key, 'exchange_rate', newVal)}
                      style={{ width: '100%' }}
                    />
                  )
                },
                {
                  title: t('subtotal_converted', 'Subtotal'),
                  dataIndex: 'subtotal',
                  key: 'subtotal',
                  width: 165,
                  align: 'right',
                  render: (val, row) => (
                    <div>
                      <Text strong style={{ fontSize: 14, color: isDark ? '#4ade80' : '#059669' }}>
                        {formatNum(val)} {row.to_currency || ''}
                      </Text>
                      {row.from_currency && row.to_currency && (
                        <div style={{ fontSize: 11, color: isDark ? '#94a3b8' : '#64748b' }}>
                          1 {row.from_currency} = {formatNum(row.exchange_rate, 4)} {row.to_currency}
                        </div>
                      )}
                    </div>
                  )
                },
                {
                  title: '',
                  key: 'remove',
                  width: 48,
                  align: 'center',
                  render: (_, row) => (
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      disabled={formItems.length <= 1}
                      onClick={() => handleRemoveItem(row.key)}
                    />
                  )
                }
              ]}
            />

            {/* Dark/Light Mode Adaptive Summary Strip */}
            <div
              style={{
                background: isDark
                  ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)'
                  : '#ecfdf5',
                border: isDark ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid #a7f3d0',
                borderRadius: 8,
                padding: '12px 18px',
                marginTop: 14,
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                fontSize: 13,
                fontWeight: 600,
                color: isDark ? '#f8fafc' : '#065f46'
              }}
            >
              <div>
                <span style={{ color: isDark ? '#94a3b8' : '#047857' }}>{t('items', 'Items')}: </span>
                <strong>
                  {formItems.length} ({formatNum(calculations.totalQty)})
                </strong>
              </div>
              <div>
                <span style={{ color: isDark ? '#94a3b8' : '#047857' }}>{t('total', 'Total')}: </span>
                <strong>{formatNum(calculations.itemsTotal)}</strong>
              </div>
              <div>
                <span style={{ color: isDark ? '#94a3b8' : '#047857' }}>
                  {t('order_discount', 'Order Discount')}:{' '}
                </span>
                <strong style={{ color: isDark ? '#f87171' : '#dc2626' }}>
                  {formatNum(calculations.orderDiscountVal)}
                </strong>
              </div>
              <div>
                <span style={{ color: isDark ? '#94a3b8' : '#047857' }}>{t('order_tax', 'Order Tax')}: </span>
                <strong style={{ color: isDark ? '#60a5fa' : '#2563eb' }}>
                  {formatNum(calculations.orderTaxVal)}
                </strong>
              </div>
              <div>
                <span style={{ color: isDark ? '#94a3b8' : '#047857' }}>
                  {t('fee_surcharge', 'Fee / Surcharge')}:{' '}
                </span>
                <strong style={{ color: isDark ? '#fbbf24' : '#d97706' }}>
                  {formatNum(calculations.shippingVal + calculations.surchargeVal)}
                </strong>
              </div>
              <div style={{ fontSize: 16 }}>
                <span style={{ fontWeight: 700 }}>{t('grand_total', 'Grand Total')}: </span>
                <strong style={{ color: isDark ? '#4ade80' : '#047857', fontSize: 18 }}>
                  {formatNum(calculations.grandTotal)}
                </strong>
              </div>
            </div>
          </Card>

          {/* 3. Order Adjustments, Multi-Currency Payment Collection & Notes */}
          <Card bordered={false} style={cardStyle}>
            <Row gutter={[16, 8]}>
              <Col xs={24} sm={12} md={6}>
                <Form.Item
                  name="order_discount"
                  label={t('order_discount', 'Order Discount (e.g. 5 or 2%)')}
                >
                  <Input placeholder="0 or 5%" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <Form.Item name="order_tax_id" label={t('order_tax', 'Order Tax')}>
                  <Select>
                    {(metadata.taxRates || []).map((tr) => (
                      <Option key={tr.id} value={tr.id}>
                        {tr.name} ({parseFloat(tr.rate || 0)}%)
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={4}>
                <Form.Item name="shipping" label={t('service_charge', 'Service Charge')}>
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={4}>
                <Form.Item name="surcharge" label={t('surcharge', 'Surcharge')}>
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={4}>
                <Form.Item
                  name="payment_status"
                  label={t('payment_status', 'Payment Status')}
                  rules={[{ required: true }]}
                >
                  <Select onChange={(val) => setPaymentStatus(val)}>
                    <Option value="pending">{t('pending', 'Pending')}</Option>
                    <Option value="partial">{t('partial', 'Partial')}</Option>
                    <Option value="paid">{t('paid', 'Paid')}</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            {/* Multi-Currency Payment Section (Replicates AURA_v1 #payments & c_amount in money/add.php) */}
            {mode === 'create' && (paymentStatus === 'paid' || paymentStatus === 'partial') && (
              <>
                <Divider orientation="left" style={{ margin: '10px 0 16px' }}>
                  <Space>
                    <DollarOutlined style={{ color: '#10b981' }} />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>
                      {t('payment_collection_multi_currency', 'Counter Payment Collection & Multi-Currency Tender')}
                    </span>
                  </Space>
                </Divider>

                {/* Multi-currency quick tender inputs (USD, KHR, BAHT, etc.) */}
                {(metadata.currencies || []).length > 0 && (
                  <div
                    style={{
                      padding: '12px 14px',
                      marginBottom: 16,
                      borderRadius: 8,
                      background: isDark ? 'rgba(30, 41, 59, 0.7)' : '#f8fafc',
                      border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0'
                    }}
                  >
                    <Text
                      style={{
                        display: 'block',
                        fontSize: 12,
                        marginBottom: 8,
                        color: isDark ? '#94a3b8' : '#64748b'
                      }}
                    >
                      {t(
                        'multi_currency_tender_hint',
                        'Optional: Enter cash received by currency denomination to auto-convert into total paid amount:'
                      )}
                    </Text>
                    <Row gutter={[12, 8]}>
                      {(metadata.currencies || []).map((cur) => (
                        <Col xs={24} sm={8} md={6} key={cur.id}>
                          <InputNumber
                            min={0}
                            style={{ width: '100%' }}
                            addonBefore={`${cur.code} (${cur.symbol || cur.code})`}
                            placeholder={`Rate: ${cur.rate}`}
                            value={currencyTenders[cur.code] ?? null}
                            onChange={(val) => handleCurrencyTenderChange(cur.code, val)}
                          />
                        </Col>
                      ))}
                    </Row>
                  </div>
                )}

                {paymentRows.map((pRow, idx) => (
                  <div
                    key={pRow.key}
                    style={{
                      padding: 14,
                      marginBottom: 12,
                      borderRadius: 8,
                      background: isDark ? 'rgba(15, 23, 42, 0.65)' : '#f8fafc',
                      border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0'
                    }}
                  >
                    <Row gutter={[12, 8]} align="middle">
                      <Col xs={24} sm={8} md={5}>
                        <Text style={{ fontSize: 12, color: isDark ? '#cbd5e1' : '#475569' }}>
                          {t('payment_reference_no', 'Payment Reference')}
                        </Text>
                        <Input
                          value={pRow.reference_no}
                          placeholder="PAY-ME-..."
                          onChange={(e) => {
                            const val = e.target.value;
                            setPaymentRows((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, reference_no: val } : item))
                            );
                          }}
                        />
                      </Col>

                      <Col xs={24} sm={8} md={5}>
                        <Text style={{ fontSize: 12, color: isDark ? '#cbd5e1' : '#475569' }}>
                          {t('amount_paid', 'Amount Paid')}
                        </Text>
                        <InputNumber
                          min={0}
                          style={{ width: '100%' }}
                          value={pRow.amount}
                          onChange={(val) => {
                            setPaymentRows((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, amount: val || 0 } : item))
                            );
                          }}
                        />
                      </Col>

                      <Col xs={24} sm={8} md={5}>
                        <Text style={{ fontSize: 12, color: isDark ? '#cbd5e1' : '#475569' }}>
                          {t('paying_by', 'Paying By')}
                        </Text>
                        <Select
                          style={{ width: '100%' }}
                          value={pRow.paid_by}
                          onChange={(val) => {
                            setPaymentRows((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, paid_by: val } : item))
                            );
                          }}
                        >
                          <Option value="cash">Cash</Option>
                          <Option value="ABA">ABA / KHQR</Option>
                          <Option value="Wing">Wing Money</Option>
                          <Option value="TrueMoney">TrueMoney</Option>
                          <Option value="Emoney">eMoney</Option>
                          <Option value="bank_transfer">Bank Transfer</Option>
                          <Option value="cheque">Cheque</Option>
                          <Option value="CC">Credit Card</Option>
                        </Select>
                      </Col>

                      <Col xs={20} sm={20} md={7}>
                        <Text style={{ fontSize: 12, color: isDark ? '#cbd5e1' : '#475569' }}>
                          {t('payment_note', 'Payment Note / Transaction ID')}
                        </Text>
                        <Input
                          value={pRow.note}
                          placeholder="e.g. ABA Ref #8839201"
                          onChange={(e) => {
                            const val = e.target.value;
                            setPaymentRows((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, note: val } : item))
                            );
                          }}
                        />
                      </Col>

                      <Col xs={4} sm={4} md={2} style={{ textAlign: 'right', paddingTop: 18 }}>
                        {idx === 0 ? (
                          <Tooltip title={t('add_split_payment', 'Add Split Payment')}>
                            <Button
                              type="dashed"
                              icon={<PlusOutlined />}
                              onClick={() =>
                                setPaymentRows((prev) => [
                                  ...prev,
                                  {
                                    key: `pay_${Date.now()}`,
                                    reference_no: '',
                                    amount: 0,
                                    paid_by: 'cash',
                                    note: ''
                                  }
                                ])
                              }
                            />
                          </Tooltip>
                        ) : (
                          <Button
                            danger
                            type="text"
                            icon={<DeleteOutlined />}
                            onClick={() => setPaymentRows((prev) => prev.filter((_, i) => i !== idx))}
                          />
                        )}
                      </Col>
                    </Row>
                  </div>
                ))}
              </>
            )}

            <Divider style={{ margin: '14px 0' }} />

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item name="note" label={t('exchange_note', 'Customer Receipt Note')}>
                  <TextArea rows={3} placeholder="Customer receipt remarks or serial numbers..." />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="staff_note" label={t('staff_note', 'Internal Teller Note')}>
                  <TextArea rows={3} placeholder="Internal audit remarks..." />
                </Form.Item>
              </Col>
            </Row>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <Button onClick={() => navigate('/admins/money')} style={{ borderRadius: 8 }}>
                {t('cancel', 'Cancel')}
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                icon={<SaveOutlined />}
                style={{ background: '#10b981', borderColor: '#10b981', borderRadius: 8, fontWeight: 600 }}
              >
                {mode === 'edit' ? t('update_exchange', 'Update Exchange') : t('submit_exchange', 'Submit Exchange')}
              </Button>
            </div>
          </Card>
        </Form>
      </Spin>

      {/* Manual Item Modal (Replicates AURA_v1 #mModal in views/money/add.php) */}
      <Modal
        title={t('add_product_manually', 'Add Manual Currency Exchange Row')}
        open={manualModalVisible}
        onCancel={() => setManualModalVisible(false)}
        onOk={() => manualForm.submit()}
        okText={t('add_to_list', 'Add to List')}
      >
        <Form form={manualForm} layout="vertical" onFinish={handleAddManualItem}>
          <Row gutter={12}>
            <Col span={10}>
              <Form.Item name="code" label={t('service_code', 'Service Code')} rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={14}>
              <Form.Item name="name" label={t('service_name', 'Service Name')} rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="from_currency"
                label={t('from_currency', 'From Currency')}
                rules={[{ required: true }]}
              >
                <Select
                  onChange={(val) => {
                    const toCur = manualForm.getFieldValue('to_currency');
                    manualForm.setFieldValue('exchange_rate', findPairRateLocal(val, toCur));
                  }}
                >
                  {(metadata.currencies || []).map((c) => (
                    <Option key={c.code} value={c.code}>
                      {c.code} - {c.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="to_currency" label={t('to_currency', 'To Currency')} rules={[{ required: true }]}>
                <Select
                  onChange={(val) => {
                    const fromCur = manualForm.getFieldValue('from_currency');
                    manualForm.setFieldValue('exchange_rate', findPairRateLocal(fromCur, val));
                  }}
                >
                  {(metadata.currencies || []).map((c) => (
                    <Option key={c.code} value={c.code}>
                      {c.code} - {c.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="amount" label={t('amount', 'Amount')} rules={[{ required: true }]}>
                <InputNumber min={0.01} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="exchange_rate"
                label={t('exchange_rate', 'Exchange Rate')}
                rules={[{ required: true }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="comment" label={t('note', 'Remark')}>
                <Input placeholder="Optional currency note or serial info..." />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Quick Add Customer Modal */}
      <Modal
        title={t('add_customer', 'Quick Add Customer')}
        open={customerModalVisible}
        onCancel={() => setCustomerModalVisible(false)}
        onOk={() => customerForm.submit()}
        confirmLoading={creatingCustomer}
      >
        <Form form={customerForm} layout="vertical" onFinish={handleQuickAddCustomer}>
          <Form.Item
            name="name"
            label={t('customer_name', 'Customer Name')}
            rules={[{ required: true, message: 'Customer name is required' }]}
          >
            <Input placeholder="e.g. Sokha" />
          </Form.Item>
          <Form.Item name="phone" label={t('phone', 'Phone Number')}>
            <Input placeholder="e.g. 012 345 678" />
          </Form.Item>
          <Form.Item name="company" label={t('company', 'Company')}>
            <Input placeholder="Optional company name" />
          </Form.Item>
          <Form.Item name="address" label={t('address', 'Address')}>
            <Input placeholder="Phnom Penh" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MoneyExchangeForm;
