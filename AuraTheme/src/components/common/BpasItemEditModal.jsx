import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Button,
  Row,
  Col,
  Typography,
  Divider,
  Space,
  Tooltip,
  message
} from 'antd';
import {
  CalculatorOutlined,
  CloseOutlined,
  EditOutlined,
  CheckOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAdminTheme } from '../../hooks/useAdminTheme';

const { Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

/**
 * BpasItemEditModal
 * Replicates the AURA_v1 Edit Item Popup Modal (Image 2)
 *
 * Supported Fields:
 * - Product Tax (Select)
 * - Quantity (Input number)
 * - Product Expiry (DatePicker / Text)
 * - Product Unit (Select: Base unit + Sub-units)
 * - Product Option (Variants or 'n/a')
 * - Product Discount (Input)
 * - Unit Cost / Unit Price (Input number)
 * - Description (Input / Textarea)
 * - Summary Bar: Net Unit Cost/Price | Product Tax
 * - Calculate Unit Cost/Price Card: Subtotal + Calculator Button
 * - Submit Button
 */
export default function BpasItemEditModal({
  open,
  onClose,
  item,
  units = [],
  taxRates = [],
  onSave,
  mode = 'full' // 'quantity-adjustment' | 'procurement' | 'sales' | 'full'
}) {
  const isSales = mode === 'sales';
  const { themeTokens, isDark } = useAdminTheme();
  const [form] = Form.useForm();

  // Local calculation states
  const [quantity, setQuantity] = useState(1);
  const [unitCost, setUnitCost] = useState(0); // Holds Unit Cost or Unit Price depending on mode
  const [discount, setDiscount] = useState('0');
  const [selectedTaxRateId, setSelectedTaxRateId] = useState(null);
  const [selectedUnitId, setSelectedUnitId] = useState(null);
  const [subtotalInput, setSubtotalInput] = useState('');

  // 1. Available Units for this specific product
  const availableUnits = useMemo(() => {
    if (!item) return units;
    const baseId = item.base_unit_id || item.unit_id || item.unit;
    if (!baseId) return units;

    // Filter units that belong to this base unit family
    const family = units.filter(
      (u) => Number(u.id) === Number(baseId) || Number(u.base_unit) === Number(baseId)
    );
    if (family.length > 0) return family;

    // Fallback: return all units
    return units;
  }, [item, units]);

  // 2. Available Variants for this product
  const variants = useMemo(() => {
    return item?.variants || [];
  }, [item]);

  // 3. Initialize form values when modal opens or item changes
  useEffect(() => {
    if (open && item) {
      const initQty = Number(item.unit_quantity != null ? item.unit_quantity : item.quantity) || 1;
      const initPrice = isSales
        ? Number(item.unit_price != null ? item.unit_price : item.price != null ? item.price : item.cost) || 0
        : Number(item.unit_cost != null ? item.unit_cost : item.cost != null ? item.cost : item.price) || 0;
      const initDiscount = String(item.discount || item.item_discount || '0');
      const initTaxId = item.tax_rate_id || item.tax_rate || (taxRates[0]?.id || null);
      const initUnitId = item.unit_id || item.product_unit_id || item.unit || (availableUnits[0]?.id || 1);

      setQuantity(initQty);
      setUnitCost(initPrice);
      setDiscount(initDiscount);
      setSelectedTaxRateId(initTaxId);
      setSelectedUnitId(initUnitId);
      setSubtotalInput((initQty * initPrice).toFixed(2));

      form.setFieldsValue({
        product_tax: initTaxId,
        quantity: initQty,
        expiry: item.expiry ? dayjs(item.expiry) : null,
        product_unit: initUnitId,
        option_id: item.option_id || undefined,
        discount: initDiscount,
        unit_cost: initPrice,
        description: item.description || item.note || item.serial_no || '',
        subtotal: (initQty * initPrice).toFixed(2)
      });
    }
  }, [open, item, form, taxRates, availableUnits, isSales]);

  // 4. Calculations: Net Unit Cost/Price & Product Tax
  const calculations = useMemo(() => {
    const cost = Number(unitCost) || 0;
    let discVal = 0;
    const discStr = String(discount).trim();

    if (discStr.endsWith('%')) {
      const pct = parseFloat(discStr.replace('%', '')) || 0;
      discVal = (cost * pct) / 100;
    } else {
      discVal = parseFloat(discStr) || 0;
    }

    const netUnitCost = Math.max(0, cost - discVal);

    // Find tax rate
    const taxObj = taxRates.find((t) => Number(t.id) === Number(selectedTaxRateId));
    let taxVal = 0;
    if (taxObj && Number(taxObj.rate) > 0) {
      taxVal = (netUnitCost * Number(taxObj.rate)) / 100;
    }

    return {
      netUnitCost: netUnitCost.toFixed(2),
      productTax: taxVal.toFixed(2),
      itemSubtotal: ((netUnitCost + taxVal) * quantity).toFixed(2)
    };
  }, [unitCost, discount, selectedTaxRateId, quantity, taxRates]);

  // 5. Handle Subtotal Calculator (Subtotal / Quantity = Unit Cost/Price)
  const handleCalculateCost = () => {
    const sub = parseFloat(subtotalInput);
    const qty = parseFloat(quantity);
    if (!sub || sub <= 0) {
      message.warning('Please enter a valid subtotal amount.');
      return;
    }
    if (!qty || qty <= 0) {
      message.warning('Quantity must be greater than 0 to calculate unit rate.');
      return;
    }

    const calculatedCost = Number((sub / qty).toFixed(4));
    setUnitCost(calculatedCost);
    form.setFieldsValue({ unit_cost: calculatedCost });
    message.success(`${isSales ? 'Unit Price' : 'Unit Cost'} calculated: $${calculatedCost.toFixed(2)}`);
  };

  // 6. Handle Unit Switch with smart price conversion
  const handleUnitChange = (newUnitId) => {
    setSelectedUnitId(newUnitId);
    const prevUnit = availableUnits.find(u => Number(u.id) === Number(selectedUnitId));
    const nextUnit = availableUnits.find(u => Number(u.id) === Number(newUnitId));

    if (prevUnit && nextUnit && item?.base_unit_price) {
      // Re-scale unit cost/price from base unit price
      const basePrice = Number(item.base_unit_price || item.price || item.cost || unitCost);
      let newPrice = basePrice;
      const op = nextUnit.operator;
      const val = parseFloat(nextUnit.operation_value) || 1;
      if (op === '*') newPrice = basePrice * val;
      else if (op === '/') newPrice = val !== 0 ? basePrice / val : basePrice;

      setUnitCost(newPrice);
      form.setFieldsValue({
        product_unit: newUnitId,
        unit_cost: newPrice
      });
      setSubtotalInput((quantity * newPrice).toFixed(2));
    } else {
      form.setFieldsValue({ product_unit: newUnitId });
    }
  };

  // 7. Handle Form Submission
  const handleSubmit = (values) => {
    const qty = Number(values.quantity);
    if (!qty || qty <= 0) {
      message.error('Quantity must be greater than 0.');
      return;
    }

    // Resolve selected unit details
    const chosenUnit = units.find((u) => Number(u.id) === Number(values.product_unit)) ||
      availableUnits.find((u) => Number(u.id) === Number(values.product_unit));

    let baseQuantity = qty;
    if (chosenUnit && chosenUnit.operator && chosenUnit.operation_value) {
      const opVal = parseFloat(chosenUnit.operation_value) || 1;
      if (chosenUnit.operator === '*') baseQuantity = qty * opVal;
      else if (chosenUnit.operator === '/') baseQuantity = opVal !== 0 ? qty / opVal : qty;
      else if (chosenUnit.operator === '+') baseQuantity = qty + opVal;
      else if (chosenUnit.operator === '-') baseQuantity = qty - opVal;
    }

    const priceRate = Number(values.unit_cost) || 0;
    const netRate = Number(calculations.netUnitCost);
    const taxRate = Number(calculations.productTax);
    const subtotalRate = Number(calculations.itemSubtotal);

    const updatedItem = {
      ...item,
      quantity: baseQuantity, // Base quantity for inventory / ledger
      unit_quantity: qty,     // Entered quantity in unit
      unit_id: values.product_unit,
      product_unit_id: values.product_unit,
      unit_name: chosenUnit?.name || chosenUnit?.code || item.unit_name || 'Unit',
      product_unit_code: chosenUnit?.code || chosenUnit?.name || item.unit_name || 'Unit',
      unit_operator: chosenUnit?.operator || null,
      unit_operation_value: chosenUnit?.operation_value || null,
      option_id: values.option_id || null,
      expiry: values.expiry ? values.expiry.format('YYYY-MM-DD') : null,
      discount: values.discount || '0',
      item_discount: values.discount || '0',
      unit_price: priceRate,
      real_unit_price: priceRate,
      net_unit_price: netRate,
      unit_cost: item.cost || (isSales ? item.cost : priceRate),
      real_unit_cost: item.cost || (isSales ? item.cost : priceRate),
      net_unit_cost: isSales ? (item.cost || 0) : netRate,
      tax_rate_id: values.product_tax || null,
      tax: taxRate,
      item_tax: taxRate,
      subtotal: subtotalRate,
      description: values.description || '',
      note: values.description || '',
      serial_no: values.description || item.serial_no || ''
    };

    if (onSave) onSave(updatedItem);
    if (onClose) onClose();
  };

  if (!item) return null;

  const productName = item.product_name || item.name || 'Product';
  const productCode = item.product_code || item.code || '';

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={520}
      centered
      closable={false}
      styles={{
        content: {
          padding: 0,
          borderRadius: 8,
          overflow: 'hidden',
          background: isDark ? '#1e293b' : '#ffffff',
          boxShadow: isDark
            ? '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)'
            : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }
      }}
    >
      {/* Modal Header: Title + Close Icon */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 20px',
          borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0',
          background: isDark ? '#0f172a' : '#ffffff'
        }}
      >
        <span
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: isDark ? '#f8fafc' : '#1e293b',
            letterSpacing: '0.01em'
          }}
        >
          {productName.toUpperCase()} {productCode ? `(${productCode})` : ''}
        </span>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 18,
            cursor: 'pointer',
            color: isDark ? '#94a3b8' : '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 4,
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = isDark ? '#f8fafc' : '#334155')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
        >
          <CloseOutlined />
        </button>
      </div>

      {/* Modal Form Body */}
      <Form
        form={form}
        layout="horizontal"
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        labelAlign="right"
        style={{ padding: '16px 20px 20px', background: isDark ? '#1e293b' : '#ffffff' }}
        onFinish={handleSubmit}
      >
        {/* 1. Product Tax */}
        <Form.Item
          label={<span style={{ fontWeight: 600, color: isDark ? '#cbd5e1' : '#334155' }}>Product Tax</span>}
          name="product_tax"
          style={{ marginBottom: 10 }}
        >
          <Select
            placeholder="Select Tax"
            allowClear
            value={selectedTaxRateId}
            onChange={(val) => setSelectedTaxRateId(val)}
            style={{ width: '100%' }}
          >
            <Option value={null}>No Tax (0%)</Option>
            {taxRates.map((t) => (
              <Option key={t.id} value={t.id}>
                {t.name} ({Number(t.rate)}%)
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* 2. Quantity */}
        <Form.Item
          label={<span style={{ fontWeight: 600, color: isDark ? '#cbd5e1' : '#334155' }}>Quantity</span>}
          name="quantity"
          rules={[{ required: true, message: 'Please enter quantity' }]}
          style={{ marginBottom: 10 }}
        >
          <InputNumber
            min={0.01}
            step={1}
            style={{ width: '100%' }}
            value={quantity}
            onChange={(val) => {
              setQuantity(val || 1);
              if (subtotalInput && Number(unitCost) > 0) {
                setSubtotalInput(((val || 1) * Number(unitCost)).toFixed(2));
              }
            }}
          />
        </Form.Item>

        {/* 3. Product Expiry */}
        <Form.Item
          label={<span style={{ fontWeight: 600, color: isDark ? '#cbd5e1' : '#334155' }}>Product Expiry</span>}
          name="expiry"
          style={{ marginBottom: 10 }}
        >
          <DatePicker
            placeholder="YYYY-MM-DD"
            style={{ width: '100%' }}
            format="YYYY-MM-DD"
          />
        </Form.Item>

        {/* 4. Product Unit */}
        <Form.Item
          label={<span style={{ fontWeight: 600, color: isDark ? '#cbd5e1' : '#334155' }}>Product Unit</span>}
          name="product_unit"
          rules={[{ required: true, message: 'Please select unit' }]}
          style={{ marginBottom: 10 }}
        >
          <Select
            placeholder="Select Unit"
            value={selectedUnitId}
            onChange={(val) => handleUnitChange(val)}
            style={{ width: '100%' }}
          >
            {availableUnits.map((u) => {
              const convLabel = u.operator && u.operation_value
                ? ` (${u.operator} ${u.operation_value})`
                : '';
              return (
                <Option key={u.id} value={u.id}>
                  {u.name || u.code} {convLabel}
                </Option>
              );
            })}
          </Select>
        </Form.Item>

        {/* 5. Product Option */}
        <Form.Item
          label={<span style={{ fontWeight: 600, color: isDark ? '#cbd5e1' : '#334155' }}>Product Option</span>}
          name="option_id"
          style={{ marginBottom: 10 }}
        >
          {variants.length > 0 ? (
            <Select placeholder="Select Variant" allowClear style={{ width: '100%' }}>
              {variants.map((v) => (
                <Option key={v.id} value={v.id}>
                  {v.name} {v.sku ? `(${v.sku})` : ''}
                </Option>
              ))}
            </Select>
          ) : (
            <div style={{ paddingTop: 5, color: isDark ? '#94a3b8' : '#64748b', fontSize: 13 }}>n/a</div>
          )}
        </Form.Item>

        {/* 6. Product Discount */}
        <Form.Item
          label={<span style={{ fontWeight: 600, color: isDark ? '#cbd5e1' : '#334155' }}>product discount</span>}
          name="discount"
          style={{ marginBottom: 10 }}
        >
          <Input
            placeholder="0 or 5%"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
          />
        </Form.Item>

        {/* 7. Unit Cost / Unit Price */}
        <Form.Item
          label={<span style={{ fontWeight: 600, color: isDark ? '#cbd5e1' : '#334155' }}>{isSales ? 'Unit Price' : 'Unit Cost'}</span>}
          name="unit_cost"
          style={{ marginBottom: 10 }}
        >
          <InputNumber
            min={0}
            step={0.01}
            style={{ width: '100%' }}
            value={unitCost}
            onChange={(val) => {
              setUnitCost(val || 0);
              setSubtotalInput(((Number(val) || 0) * quantity).toFixed(2));
            }}
          />
        </Form.Item>

        {/* 8. Description */}
        <Form.Item
          label={<span style={{ fontWeight: 600, color: isDark ? '#cbd5e1' : '#334155' }}>Description</span>}
          name="description"
          style={{ marginBottom: 14 }}
        >
          <Input placeholder="Item remarks or serial number..." />
        </Form.Item>

        {/* 9. Gray Summary Row: Net Unit Cost/Price | Product Tax */}
        <div
          style={{
            background: isDark ? 'rgba(15, 23, 42, 0.75)' : '#eceff1',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
            borderRadius: 4,
            padding: '10px 16px',
            marginBottom: 14,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 13,
            color: isDark ? '#f1f5f9' : '#1e293b'
          }}
        >
          <div>
            <strong style={{ marginRight: 8, color: isDark ? '#94a3b8' : '#334155' }}>{isSales ? 'Net Unit Price' : 'Net Unit Cost'}</strong>
            <span style={{ fontWeight: 700, color: isDark ? '#38bdf8' : '#0f172a' }}>{calculations.netUnitCost}</span>
          </div>
          <div>
            <strong style={{ marginRight: 8, color: isDark ? '#94a3b8' : '#334155' }}>Product Tax</strong>
            <span style={{ fontWeight: 700, color: isDark ? '#38bdf8' : '#0f172a' }}>{calculations.productTax}</span>
          </div>
        </div>

        {/* 10. Calculate Unit Cost / Unit Price Box */}
        <div
          style={{
            border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #e2e8f0',
            borderRadius: 4,
            overflow: 'hidden',
            marginBottom: 16
          }}
        >
          <div
            style={{
              background: isDark ? 'rgba(15, 23, 42, 0.85)' : '#f8fafc',
              padding: '8px 14px',
              borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0',
              fontWeight: 700,
              fontSize: 13,
              color: isDark ? '#f1f5f9' : '#334155'
            }}
          >
            {isSales ? 'Calculate Unit Price' : 'Calculate Unit Cost'}
          </div>
          <div style={{ padding: '12px 14px', background: isDark ? 'rgba(30, 41, 59, 0.4)' : '#ffffff' }}>
            <Row align="middle" gutter={8}>
              <Col span={8} style={{ textAlign: 'right' }}>
                <span style={{ fontWeight: 600, color: isDark ? '#cbd5e1' : '#334155', fontSize: 13 }}>Subtotal</span>
              </Col>
              <Col span={16}>
                <Input
                  value={subtotalInput}
                  onChange={(e) => setSubtotalInput(e.target.value)}
                  onPressEnter={handleCalculateCost}
                  placeholder="Total amount"
                  suffix={
                    <Tooltip title={`Calculate ${isSales ? 'Unit Price' : 'Unit Cost'} = Subtotal / Quantity`}>
                      <Button
                        type="text"
                        size="small"
                        icon={<CalculatorOutlined style={{ color: isDark ? '#60a5fa' : '#2563eb' }} />}
                        onClick={handleCalculateCost}
                        style={{ padding: 0 }}
                      />
                    </Tooltip>
                  }
                />
              </Col>
            </Row>
          </div>
        </div>

        {/* 11. Modal Footer: Submit Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="primary"
            htmlType="submit"
            style={{
              background: '#337ab7',
              borderColor: '#2e6da4',
              borderRadius: 4,
              fontWeight: 600,
              padding: '4px 22px',
              height: 34
            }}
          >
            Submit
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
