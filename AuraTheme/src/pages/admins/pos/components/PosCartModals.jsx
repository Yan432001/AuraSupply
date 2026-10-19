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

  useEffect(() => {
    if (visible && item) {
      form.setFieldsValue({
        name: item.name,
        unit_price: item.unit_price,
        quantity: item.quantity,
        item_discount: item.item_discount || 0,
        unit_name: item.unit_name || 'Unit',
        item_note: item.item_note || '',
        serial_no: item.serial_no || '',
      });
    }
  }, [visible, item, form]);

  const handleFinish = (values) => {
    onSave({
      ...item,
      unit_price: parseFloat(values.unit_price) || 0,
      quantity: parseFloat(values.quantity) || 1,
      item_discount: parseFloat(values.item_discount) || 0,
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
          <EditOutlined style={{ color: '#2563eb' }} />
          <span>Edit Cart Item: {item?.name}</span>
        </div>
      }
      footer={null}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} style={{ marginTop: 12 }}>
        <Form.Item name="unit_price" label="Unit Price ($)" rules={[{ required: true }]}>
          <InputNumber style={{ width: '100%' }} min={0} step={0.01} precision={2} prefix="$" size="large" />
        </Form.Item>

        <Form.Item name="quantity" label="Quantity" rules={[{ required: true }]}>
          <InputNumber style={{ width: '100%' }} min={0.01} step={1} size="large" />
        </Form.Item>

        <Form.Item name="item_discount" label="Item Discount ($)">
          <InputNumber style={{ width: '100%' }} min={0} step={0.1} precision={2} prefix="$" size="large" />
        </Form.Item>

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
          <Button type="primary" htmlType="submit" icon={<CheckOutlined />} style={{ background: '#2563eb' }}>
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

// 3. ORDER DISCOUNT MODAL
export const OrderDiscountModal = ({ visible, onClose, discountValue, discountType, onApply }) => {
  const [type, setType] = useState(discountType || 'fixed');
  const [value, setValue] = useState(discountValue || 0);

  useEffect(() => {
    if (visible) {
      setType(discountType || 'fixed');
      setValue(discountValue || 0);
    }
  }, [visible, discountValue, discountType]);

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
          <span>Apply Order Discount</span>
        </div>
      }
      onOk={handleApply}
      okText="Apply Discount"
      okButtonProps={{ danger: true }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '12px 0' }}>
        <div>
          <Text strong style={{ display: 'block', marginBottom: 6 }}>
            Discount Type:
          </Text>
          <Radio.Group value={type} onChange={(e) => setType(e.target.value)} buttonStyle="solid">
            <Radio.Button value="fixed">Fixed Amount ($)</Radio.Button>
            <Radio.Button value="percent">Percentage (%)</Radio.Button>
          </Radio.Group>
        </div>

        <div>
          <Text strong style={{ display: 'block', marginBottom: 6 }}>
            Discount Value:
          </Text>
          <InputNumber
            style={{ width: '100%' }}
            size="large"
            min={0}
            max={type === 'percent' ? 100 : 999999}
            step={type === 'percent' ? 1 : 0.5}
            prefix={type === 'fixed' ? '$' : '%'}
            value={value}
            onChange={(val) => setValue(val)}
            autoFocus
          />
        </div>

        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Quick Presets:
          </Text>
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            {type === 'percent'
              ? [5, 10, 15, 20, 50].map((p) => (
                  <Button key={p} size="small" onClick={() => setValue(p)}>
                    {p}%
                  </Button>
                ))
              : [1, 2, 5, 10, 20].map((d) => (
                  <Button key={d} size="small" onClick={() => setValue(d)}>
                    ${d}
                  </Button>
                ))}
            <Button size="small" danger onClick={() => setValue(0)}>
              Reset
            </Button>
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
          <UserAddOutlined style={{ color: '#2563eb' }} />
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
          <Button type="primary" htmlType="submit" style={{ background: '#2563eb' }}>
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
          <UserOutlined style={{ color: '#2563eb' }} />
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
