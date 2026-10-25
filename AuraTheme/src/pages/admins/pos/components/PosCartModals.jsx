import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Radio,
  Select,
  Button,
  Space,
  Typography,
  Tag,
  Divider,
  Descriptions,
} from 'antd';
import {
  EditOutlined,
  CommentOutlined,
  PercentageOutlined,
  DollarOutlined,
  CarOutlined,
  UserAddOutlined,
  UserOutlined,
  PlusCircleOutlined,
  CheckOutlined,
} from '@ant-design/icons';

const { Text, Title } = Typography;

// 1. EDIT ITEM MODAL
export const EditItemModal = ({ visible, onClose, item, onSave, themeMode }) => {
  const [form] = Form.useForm();
  const isDark = themeMode === 'dark';
  const [discountType, setDiscountType] = useState('percent'); // 'percent' or 'fixed'
  const [discountVal, setDiscountVal] = useState(0);
  const [currentUnitPrice, setCurrentUnitPrice] = useState(0);
  const [currentQty, setCurrentQty] = useState(1);

  useEffect(() => {
    if (visible && item) {
      const uPrice = parseFloat(item.unit_price) || 0;
      const initialType = item.discount_type || (item.item_discount > 0 && item.discount_val ? 'percent' : 'fixed');
      const initialVal = item.discount_val !== undefined ? item.discount_val : (parseFloat(item.item_discount) || 0);

      setDiscountType(initialType);
      setDiscountVal(initialVal);
      setCurrentUnitPrice(uPrice);
      setCurrentQty(parseFloat(item.quantity) || 1);

      form.setFieldsValue({
        name: item.name,
        unit_price: uPrice,
        quantity: parseFloat(item.quantity) || 1,
        unit_name: item.unit_name || 'Unit',
        item_note: item.item_note || '',
        serial_no: item.serial_no || '',
      });
    }
  }, [visible, item, form]);

  // Compute live discount amounts
  const isPercent = discountType === 'percent';
  const calculatedDiscountUSD = isPercent
    ? (currentUnitPrice * Math.min(100, Math.max(0, parseFloat(discountVal) || 0))) / 100
    : Math.min(currentUnitPrice, Math.max(0, parseFloat(discountVal) || 0));
  const percentEquivalent = currentUnitPrice > 0
    ? ((calculatedDiscountUSD / currentUnitPrice) * 100).toFixed(1)
    : 0;
  const netUnitPrice = Math.max(0, currentUnitPrice - calculatedDiscountUSD);
  const lineTotal = netUnitPrice * currentQty;

  const handleFinish = (values) => {
    const uPrice = parseFloat(values.unit_price) || 0;
    const qty = parseFloat(values.quantity) || 1;
    const dVal = parseFloat(discountVal) || 0;
    const finalDiscountUSD = isPercent
      ? (uPrice * Math.min(100, Math.max(0, dVal))) / 100
      : Math.min(uPrice, Math.max(0, dVal));

    onSave({
      ...item,
      unit_price: uPrice,
      quantity: qty,
      discount_type: discountType,
      discount_val: dVal,
      item_discount: finalDiscountUSD,
      unit_name: values.unit_name,
      item_note: values.item_note || '',
      serial_no: values.serial_no || '',
    });
    onClose();
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <EditOutlined style={{ color: '#2F6FED' }} />
          <span>Edit Cart Item: {item?.name}</span>
        </div>
      }
      footer={null}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} style={{ marginTop: 12 }}>
        <Form.Item name="unit_price" label="Unit Price ($)" rules={[{ required: true }]}>
          <InputNumber
            style={{ width: '100%' }}
            min={0}
            step={0.01}
            precision={2}
            prefix="$"
            size="large"
            onChange={(val) => setCurrentUnitPrice(parseFloat(val) || 0)}
          />
        </Form.Item>

        <Form.Item name="quantity" label="Quantity" rules={[{ required: true }]}>
          <InputNumber
            style={{ width: '100%' }}
            min={0.01}
            step={1}
            size="large"
            onChange={(val) => setCurrentQty(parseFloat(val) || 1)}
          />
        </Form.Item>

        {/* Item Discount Concept: Percentage (%) & Fixed Price ($) */}
        <div style={{ marginBottom: 16 }}>
          <Text strong style={{ display: 'block', marginBottom: 6 }}>
            Item Discount (Percentage % or Price $):
          </Text>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <Radio.Group
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value)}
              buttonStyle="solid"
            >
              <Radio.Button value="percent">Percentage (%)</Radio.Button>
              <Radio.Button value="fixed">Fixed Price ($)</Radio.Button>
            </Radio.Group>
          </div>

          <InputNumber
            style={{ width: '100%' }}
            min={0}
            max={isPercent ? 100 : undefined}
            step={isPercent ? 1 : 0.1}
            precision={isPercent ? 1 : 2}
            prefix={isPercent ? '%' : '$'}
            size="large"
            value={discountVal}
            onChange={(val) => setDiscountVal(val)}
            placeholder={isPercent ? "Enter discount percentage (e.g. 10%)" : "Enter discount price (e.g. $1.50)"}
          />

          {/* Quick preset buttons */}
          <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
            {isPercent
              ? [5, 10, 15, 20, 25, 50].map((p) => (
                  <Button key={p} size="small" onClick={() => setDiscountVal(p)}>
                    {p}%
                  </Button>
                ))
              : [0.5, 1, 2, 5, 10].map((d) => (
                  <Button key={d} size="small" onClick={() => setDiscountVal(d)}>
                    ${d}
                  </Button>
                ))}
            <Button size="small" danger onClick={() => setDiscountVal(0)}>
              Clear
            </Button>
          </div>

          {/* Live Discount Calculation Box */}
          <div
            style={{
              marginTop: 10,
              padding: '10px 12px',
              borderRadius: 8,
              background: calculatedDiscountUSD > 0 ? '#fff1f2' : isDark ? '#1e293b' : '#f8fafc',
              border: `1px solid ${calculatedDiscountUSD > 0 ? '#fecdd3' : isDark ? '#334155' : '#e2e8f0'}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              fontSize: 12,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Original Price:</span>
              <span style={{ fontWeight: 600 }}>${currentUnitPrice.toFixed(2)}</span>
            </div>
            {calculatedDiscountUSD > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e11d48', fontWeight: 700 }}>
                <span>Discount ({isPercent ? `${discountVal}%` : `$${parseFloat(discountVal).toFixed(2)}`}):</span>
                <span>-${calculatedDiscountUSD.toFixed(2)} ({isPercent ? `${discountVal}%` : `${percentEquivalent}%`} off)</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Net Unit Price:</span>
              <span style={{ fontWeight: 700, color: '#2F6FED' }}>${netUnitPrice.toFixed(2)}</span>
            </div>
            <Divider style={{ margin: '4px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ fontWeight: 700 }}>Line Total ({currentQty} {form.getFieldValue('unit_name') || 'Unit'}):</span>
              <span style={{ fontWeight: 900, color: '#2F6FED' }}>${lineTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <Form.Item name="unit_name" label="Unit">
          <Select
            options={[
              { value: 'Unit', label: 'Unit' },
              { value: 'Pcs', label: 'Pcs' },
              { value: 'Box', label: 'Box' },
              { value: 'Pack', label: 'Pack' },
              { value: 'Bottle', label: 'Bottle' },
              { value: 'Kg', label: 'Kg' },
            ]}
          />
        </Form.Item>

        <Form.Item name="serial_no" label="Serial / IMEI / Batch No.">
          <Input placeholder="Optional serial number or batch" />
        </Form.Item>

        <Form.Item name="item_note" label="Item Note / Instructions">
          <Input.TextArea rows={2} placeholder="E.g. Less sugar, extra packaging" />
        </Form.Item>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" htmlType="submit" icon={<CheckOutlined />} style={{ background: '#2F6FED', borderColor: '#2F6FED' }}>
            Update Item
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

// 2. ITEM COMMENT MODAL
export const ItemCommentModal = ({ visible, onClose, item, onSave }) => {
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (visible && item) {
      setComment(item.item_note || '');
    }
  }, [visible, item]);

  const handleSave = () => {
    onSave(item?.id, comment);
    onClose();
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CommentOutlined style={{ color: '#059669' }} />
          <span>Special Instruction for: {item?.name}</span>
        </div>
      }
      onOk={handleSave}
      okText="Save Note"
      okButtonProps={{ style: { background: '#059669' } }}
    >
      <div style={{ padding: '8px 0' }}>
        <Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 13 }}>
          Add kitchen or preparation instruction printed on KOT (Kitchen Order Ticket):
        </Text>
        <Input.TextArea
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="E.g. No spicy, warm water, extra sauce..."
          autoFocus
        />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
          {['No Spicy', 'Less Sweet', 'Extra Ice', 'Takeaway Box', 'Urgent'].map((tag) => (
            <Tag
              key={tag}
              style={{ cursor: 'pointer', borderRadius: 12 }}
              onClick={() => setComment((prev) => (prev ? `${prev}, ${tag}` : tag))}
            >
              + {tag}
            </Tag>
          ))}
        </div>
      </div>
    </Modal>
  );
};

// 3. ORDER DISCOUNT MODAL (PERCENTAGES & PRICES CONCEPT)
export const OrderDiscountModal = ({
  visible,
  onClose,
  discountValue,
  discountType,
  onApply,
  cartSubtotal = 0,
  khrExchangeRate = 4200,
}) => {
  const [type, setType] = useState(discountType || 'fixed');
  const [value, setValue] = useState(discountValue || 0);

  useEffect(() => {
    if (visible) {
      setType(discountType || 'fixed');
      setValue(discountValue || 0);
    }
  }, [visible, discountValue, discountType]);

  const subtotalNum = parseFloat(cartSubtotal) || 0;
  const isPercent = type === 'percent';
  const valNum = parseFloat(value) || 0;
  const calculatedDiscountUSD = isPercent
    ? (subtotalNum * Math.min(100, Math.max(0, valNum))) / 100
    : Math.min(subtotalNum, Math.max(0, valNum));
  const percentEquivalent = subtotalNum > 0
    ? ((calculatedDiscountUSD / subtotalNum) * 100).toFixed(1)
    : 0;
  const payableAfterDiscount = Math.max(0, subtotalNum - calculatedDiscountUSD);
  const calculatedDiscountKHR = Math.round(calculatedDiscountUSD * khrExchangeRate);

  const handleApply = () => {
    onApply(parseFloat(value) || 0, type);
    onClose();
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <PercentageOutlined style={{ color: '#e11d48' }} />
          <span>Apply Order Discount (% or $)</span>
        </div>
      }
      onOk={handleApply}
      okText="Apply Discount"
      okButtonProps={{ danger: true }}
      destroyOnClose
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '8px 0' }}>
        {/* Toggle: Fixed Amount ($) vs Percentage (%) */}
        <div>
          <Text strong style={{ display: 'block', marginBottom: 6 }}>
            Discount Concept:
          </Text>
          <Radio.Group
            value={type}
            onChange={(e) => setType(e.target.value)}
            buttonStyle="solid"
            style={{ width: '100%', display: 'flex' }}
          >
            <Radio.Button value="fixed" style={{ flex: 1, textAlign: 'center' }}>
              Fixed Price ($ USD)
            </Radio.Button>
            <Radio.Button value="percent" style={{ flex: 1, textAlign: 'center' }}>
              Percentage (%)
            </Radio.Button>
          </Radio.Group>
        </div>

        {/* Input Value */}
        <div>
          <Text strong style={{ display: 'block', marginBottom: 6 }}>
            {isPercent ? 'Discount Percentage (%):' : 'Discount Price ($ USD):'}
          </Text>
          <InputNumber
            style={{ width: '100%' }}
            size="large"
            min={0}
            max={isPercent ? 100 : subtotalNum > 0 ? subtotalNum : 999999}
            step={isPercent ? 1 : 0.5}
            precision={isPercent ? 1 : 2}
            prefix={isPercent ? '%' : '$'}
            value={value}
            onChange={(val) => setValue(val)}
            placeholder={isPercent ? 'E.g. 10 for 10%' : 'E.g. 5.00 for $5.00'}
            autoFocus
          />
        </div>

        {/* Quick Presets for both % and $ */}
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Quick {isPercent ? 'Percentage' : 'Price'} Presets:
          </Text>
          <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
            {isPercent
              ? [5, 10, 15, 20, 25, 30, 50].map((p) => (
                  <Button key={p} size="small" onClick={() => setValue(p)}>
                    {p}%
                  </Button>
                ))
              : [1, 2, 5, 10, 15, 20, 50].map((d) => (
                  <Button key={d} size="small" onClick={() => setValue(d)}>
                    ${d}
                  </Button>
                ))}
            <Button size="small" danger onClick={() => setValue(0)}>
              Reset
            </Button>
          </div>
        </div>

        {/* Live Calculation Preview Card */}
        <div
          style={{
            padding: '12px 14px',
            borderRadius: 10,
            background: calculatedDiscountUSD > 0 ? '#fff1f2' : '#f8fafc',
            border: `1px solid ${calculatedDiscountUSD > 0 ? '#fecdd3' : '#e2e8f0'}`,
            display: 'flex',
            flexDirection: 'column',
            gap: 5,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: '#64748b' }}>Cart Subtotal:</span>
            <span style={{ fontWeight: 700 }}>${subtotalNum.toFixed(2)}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#e11d48' }}>
            <span style={{ fontWeight: 700 }}>
              Discount ({isPercent ? `${valNum}%` : `$${valNum.toFixed(2)}`}):
            </span>
            <span style={{ fontWeight: 800 }}>
              -${calculatedDiscountUSD.toFixed(2)} ({isPercent ? `${valNum}%` : `${percentEquivalent}%`} off)
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: '#94a3b8' }}>
            <span>Dual Currency Savings:</span>
            <span style={{ fontWeight: 600, color: '#e11d48' }}>-៛{calculatedDiscountKHR.toLocaleString()} KHR</span>
          </div>

          <Divider style={{ margin: '6px 0', borderColor: calculatedDiscountUSD > 0 ? '#fecdd3' : '#e2e8f0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
            <span style={{ fontWeight: 700, color: '#1e293b' }}>Net Total After Discount:</span>
            <span style={{ fontWeight: 900, color: '#2F6FED' }}>${payableAfterDiscount.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </Modal>
  );
};

// 4. ORDER TAX MODAL
export const OrderTaxModal = ({ visible, onClose, taxRate, onApply }) => {
  const [rate, setRate] = useState(taxRate || 0);

  useEffect(() => {
    if (visible) {
      setRate(taxRate || 0);
    }
  }, [visible, taxRate]);

  const handleApply = () => {
    onApply(parseFloat(rate) || 0);
    onClose();
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      title="Order VAT / Tax Settings"
      onOk={handleApply}
      okText="Apply Tax"
    >
      <div style={{ padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Text type="secondary">Select or enter the applicable sales tax (VAT) percentage:</Text>
        <InputNumber
          style={{ width: '100%' }}
          size="large"
          min={0}
          max={100}
          step={0.5}
          addonAfter="%"
          value={rate}
          onChange={(val) => setRate(val)}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { label: '0% (Tax Exempt)', val: 0 },
            { label: '5% (Reduced)', val: 5 },
            { label: '10% (Cambodia VAT)', val: 10 },
          ].map((item) => (
            <Button
              key={item.val}
              type={rate === item.val ? 'primary' : 'default'}
              size="small"
              onClick={() => setRate(item.val)}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>
    </Modal>
  );
};

// 5. DELIVERY / SHIPPING FEE MODAL
export const DeliveryFeeModal = ({ visible, onClose, shippingFee, onApply }) => {
  const [fee, setFee] = useState(shippingFee || 0);

  useEffect(() => {
    if (visible) {
      setFee(shippingFee || 0);
    }
  }, [visible, shippingFee]);

  const handleApply = () => {
    onApply(parseFloat(fee) || 0);
    onClose();
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CarOutlined style={{ color: '#0284c7' }} />
          <span>Delivery / Shipping Fee</span>
        </div>
      }
      onOk={handleApply}
      okText="Save Delivery Fee"
    >
      <div style={{ padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Text type="secondary">Enter delivery courier charge added to invoice total:</Text>
        <InputNumber
          style={{ width: '100%' }}
          size="large"
          min={0}
          step={0.5}
          precision={2}
          prefix="$"
          value={fee}
          onChange={(val) => setFee(val)}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { label: 'Free ($0)', val: 0 },
            { label: '$1.00 (City Express)', val: 1 },
            { label: '$1.50 (Standard)', val: 1.5 },
            { label: '$2.00 (Suburb)', val: 2 },
            { label: '$3.00 (Province)', val: 3 },
          ].map((item) => (
            <Button
              key={item.val}
              type={fee === item.val ? 'primary' : 'default'}
              size="small"
              onClick={() => setFee(item.val)}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>
    </Modal>
  );
};

// 6. QUICK ADD CUSTOMER MODAL
export const QuickAddCustomerModal = ({ visible, onClose, onAddCustomer }) => {
  const [form] = Form.useForm();

  const handleFinish = (values) => {
    const newCustomer = {
      id: Date.now(),
      name: values.name,
      phone: values.phone || '',
      email: values.email || '',
      address: values.address || '',
    };
    onAddCustomer(newCustomer);
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <UserAddOutlined style={{ color: '#2F6FED' }} />
          <span>Quick Add Customer (F2)</span>
        </div>
      }
      footer={null}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} style={{ marginTop: 12 }}>
        <Form.Item
          name="name"
          label="Customer Name"
          rules={[{ required: true, message: 'Please enter customer name' }]}
        >
          <Input placeholder="Full name or company name" autoFocus />
        </Form.Item>
        <Form.Item name="phone" label="Phone Number">
          <Input placeholder="012 xxx xxx" />
        </Form.Item>
        <Form.Item name="email" label="Email Address">
          <Input placeholder="customer@example.com" />
        </Form.Item>
        <Form.Item name="address" label="Address">
          <Input placeholder="Delivery address or location" />
        </Form.Item>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" htmlType="submit" style={{ background: '#2F6FED', borderColor: '#2F6FED' }}>
            Save & Select Customer
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

// 7. VIEW CUSTOMER DETAILS MODAL
export const CustomerDetailsModal = ({ visible, onClose, customer }) => {
  if (!customer) return null;

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <UserOutlined style={{ color: '#2F6FED' }} />
          <span>Customer Profile</span>
        </div>
      }
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
      ]}
    >
      <div style={{ padding: '8px 0' }}>
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="Name">{customer.name}</Descriptions.Item>
          <Descriptions.Item label="Phone">{customer.phone || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Email">{customer.email || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Address">{customer.address || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Customer Group">
            <Tag color="blue">{customer.group || 'General'}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Loyalty Points">
            <Tag color="gold">{customer.points || 0} pts</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Deposit Balance">
            <Tag color="green">${parseFloat(customer.deposit || 0).toFixed(2)}</Tag>
          </Descriptions.Item>
        </Descriptions>
      </div>
    </Modal>
  );
};

// 8. MANUAL ADD PRODUCT MODAL
export const ManualAddProductModal = ({ visible, onClose, onAddProduct }) => {
  const [form] = Form.useForm();

  const handleFinish = (values) => {
    const customProduct = {
      id: `custom_${Date.now()}`,
      code: values.code || `MAN-${Date.now().toString().slice(-4)}`,
      name: values.name,
      price: parseFloat(values.price) || 0,
      unit_price: parseFloat(values.price) || 0,
      quantity: parseFloat(values.quantity) || 1,
      unit_name: values.unit_name || 'Unit',
      category_name: 'Custom Items',
      category_id: 'custom',
    };
    onAddProduct(customProduct);
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <PlusCircleOutlined style={{ color: '#059669' }} />
          <span>Quick Add Non-Catalog Product</span>
        </div>
      }
      footer={null}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} style={{ marginTop: 12 }}>
        <Form.Item name="name" label="Item Name" rules={[{ required: true, message: 'Enter item name' }]}>
          <Input placeholder="Custom item or service description" autoFocus />
        </Form.Item>
        <Form.Item name="price" label="Unit Price ($)" rules={[{ required: true, message: 'Enter price' }]}>
          <InputNumber style={{ width: '100%' }} min={0} step={0.1} precision={2} prefix="$" size="large" />
        </Form.Item>
        <Form.Item name="quantity" label="Quantity" initialValue={1} rules={[{ required: true }]}>
          <InputNumber style={{ width: '100%' }} min={1} step={1} size="large" />
        </Form.Item>
        <Form.Item name="unit_name" label="Unit" initialValue="Unit">
          <Select
            options={[
              { value: 'Unit', label: 'Unit' },
              { value: 'Pcs', label: 'Pcs' },
              { value: 'Box', label: 'Box' },
              { value: 'Hour', label: 'Hour / Service' },
            ]}
          />
        </Form.Item>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" htmlType="submit" style={{ background: '#059669' }}>
            Add to Cart
          </Button>
        </div>
      </Form>
    </Modal>
  );
};
