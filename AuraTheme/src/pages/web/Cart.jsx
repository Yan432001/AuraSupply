import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Row,
  Col,
  Card,
  Space,
  Button,
  Image,
  Input,
  Typography,
  Tag,
  Modal,
  Radio,
  Divider,
  QRCode,
  message,
  Result,
  Badge,
} from 'antd';
import { useCart } from '../../contexts/CartContext';
import { useTranslation } from '../../contexts/LanguageContext';
import {
  MinusOutlined,
  PlusOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  CheckCircleFilled,
  CreditCardOutlined,
  DollarOutlined,
  QrcodeOutlined,
  CarOutlined,
  ShoppingOutlined,
  SendOutlined,
  PrinterOutlined,
  DisconnectOutlined,
  FilePdfOutlined,
  BankOutlined,
  FileProtectOutlined,
} from '@ant-design/icons';
import { formatCurrency, publicTheme } from '../../utils/webTheme';
import { useNetworkStatus } from '../../contexts/NetworkStatusContext';
import OfflineWarningBanner from '../../components/common/OfflineWarningBanner';
import { exportSingleOrderPdf } from '../../utils/orderPdfExporter';
import OftenOrderedTogetherWidget from '../../components/web/cart/OftenOrderedTogetherWidget';
import { submitOrder } from '../../utils/apiconfig';

const { Title, Paragraph, Text } = Typography;

export default function Cart() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { cart, updateQuantity, removeFromCart, clearCart, cartTotal, cartItemCount } = useCart();
  const { isOnline } = useNetworkStatus();

  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);

  // B2B Checkout Form State
  const [companyName, setCompanyName] = useState('Aura Hospitality Partners Ltd.');
  const [taxId, setTaxId] = useState('VAT-KH-902188');
  const [poNumber, setPoNumber] = useState(`PO-${new Date().getFullYear()}-0082`);
  const [customerName, setCustomerName] = useState('Rithy Samnang');
  const [customerPhone, setCustomerPhone] = useState('+855 12 345 678');
  const [customerEmail, setCustomerEmail] = useState('procurement@aurapartner.com');
  const [shippingAddress, setShippingAddress] = useState('No. 128 Norodom Blvd, Daun Penh, Phnom Penh');
  const [deliveryMethod, setDeliveryMethod] = useState('standard'); // standard | express | pickup
  const [paymentMethod, setPaymentMethod] = useState('khqr'); // khqr | invoice | card | cod
  const [orderNotes, setOrderNotes] = useState('');

  // Calculations
  const shippingFee = deliveryMethod === 'pickup' ? 0 : deliveryMethod === 'express' ? 15 : cartTotal >= 100 ? 0 : 10;
  // Volume wholesale discount if cartTotal >= 200 (5%) or >= 500 (10%)
  const bulkDiscount = cartTotal >= 500 ? Number((cartTotal * 0.10).toFixed(2)) : cartTotal >= 200 ? Number((cartTotal * 0.05).toFixed(2)) : 0;
  const taxableSubtotal = Math.max(0, cartTotal - bulkDiscount);
  const taxFee = Number((taxableSubtotal * 0.1).toFixed(2));
  const grandTotal = Number((taxableSubtotal + shippingFee + taxFee).toFixed(2));

  const handleOpenCheckout = () => {
    if (!isOnline) {
      message.error(t('offline_warning', 'You are currently offline. Please restore connection to proceed.'));
      return;
    }
    if (cart.length === 0) {
      message.warning(t('cart_empty_warning', 'Your cart is empty. Add products to continue!'));
      return;
    }
    setCheckoutModalOpen(true);
  };

  const handlePlaceOrder = async () => {
    if (!isOnline) {
      message.error(t('cannot_submit_offline', 'Cannot submit order: Offline.'));
      return;
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      message.error(t('enter_buyer_details', 'Please enter buyer contact details.'));
      return;
    }

    setIsSubmitting(true);

    try {
      const orderPayload = {
        customer: {
          company: companyName,
          taxId: taxId,
          poNumber: poNumber,
          name: customerName,
          phone: customerPhone,
          email: customerEmail,
          address: shippingAddress,
          notes: orderNotes,
        },
        deliveryMethod,
        paymentMethod,
        poNumber,
        notes: orderNotes,
        items: cart.map((item) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity || 1,
          price: item.price || 0,
          unit_price: item.price || 0,
          shop_id: item.shop_id || item.biller_id || 1,
        })),
        shipping: shippingFee,
        discount: bulkDiscount,
      };

      const res = await submitOrder(orderPayload);
      const orderRef = res?.data?.reference_no || (res?.data?.orderId ? `AUR-${res.data.orderId}` : `AUR-${Math.floor(100000 + Math.random() * 900000)}`);

      const orderData = {
        orderId: orderRef,
        dbId: res?.data?.orderId,
        createdAt: new Date().toLocaleString(),
        customer: orderPayload.customer,
        deliveryMethod,
        paymentMethod,
        items: [...cart],
        subtotal: cartTotal,
        bulkDiscount: bulkDiscount,
        shipping: shippingFee,
        tax: taxFee,
        total: grandTotal,
      };

      try {
        const historyKey = 'aura_web_order_history';
        const existing = JSON.parse(localStorage.getItem(historyKey) || '[]');
        localStorage.setItem(historyKey, JSON.stringify([orderData, ...existing]));
      } catch (_) {}

      clearCart();
      setIsSubmitting(false);
      setCheckoutModalOpen(false);
      setCompletedOrder(orderData);
      message.success(`${t('order_recorded_success', 'Procurement Order')} ${orderRef} ${t('recorded_in_db', 'recorded in real database!')}`);
    } catch (err) {
      console.error('Order submission error:', err);
      message.error(err.message || t('error_recording_order', 'Error recording order. Please try again.'));
      setIsSubmitting(false);
    }
  };

  // SUCCESS SCREEN
  if (completedOrder) {
    return (
      <div style={{ padding: '24px 0', maxWidth: 780, margin: '0 auto' }}>
        <Card
          style={{
            borderRadius: 24,
            border: `1px solid ${publicTheme.border}`,
            boxShadow: publicTheme.shadow,
            overflow: 'hidden',
          }}
        >
          <Result
            status="success"
            title={
              <div style={{ fontWeight: 850, fontSize: 24, color: '#0f172a' }}>
                🎉 {t('order_confirmed', 'Commercial Order Confirmed!')}
              </div>
            }
            subTitle={
              <div style={{ fontSize: 14, color: '#64748b' }}>
                {t('order_ref', 'Order Ref')}: <strong style={{ color: publicTheme.primary }}>{completedOrder.orderId}</strong>
                {completedOrder.customer?.poNumber && ` • PO: ${completedOrder.customer.poNumber}`}
              </div>
            }
            extra={[
              <Button
                type="primary"
                key="pdf"
                icon={<FilePdfOutlined />}
                onClick={() => exportSingleOrderPdf(completedOrder)}
                style={{ borderRadius: 12, height: 44, fontWeight: 700, background: publicTheme.primary }}
              >
                {t('download_pdf', 'Download Proforma Invoice PDF')}
              </Button>,
              <Button
                key="profile"
                onClick={() => navigate('/profile')}
                style={{ borderRadius: 12, height: 44, fontWeight: 700 }}
              >
                {t('view_orders', 'View in Procurement Orders')}
              </Button>,
              <Button
                key="catalog"
                onClick={() => navigate('/products')}
                style={{ borderRadius: 12, height: 44 }}
              >
                {t('continue_sourcing', 'Continue Sourcing')}
              </Button>,
            ]}
          >
            <div style={{ background: '#f8fafc', borderRadius: 16, padding: '18px 22px', marginTop: 12, border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a', marginBottom: 12 }}>
                {t('order_summary_settlement', 'Order Summary & Settlement')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: '#64748b' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{t('company_organization', 'Company / Organization:')}</span>
                  <strong style={{ color: '#0f172a' }}>{completedOrder.customer?.company || 'N/A'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{t('settlement_method', 'Settlement Method:')}</span>
                  <span style={{ textTransform: 'uppercase', fontWeight: 700, color: publicTheme.primary }}>
                    {completedOrder.paymentMethod}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{t('logistics_carrier', 'Logistics Carrier:')}</span>
                  <span>{completedOrder.deliveryMethod === 'express' ? t('priority_air_freight', 'Priority Air Freight') : t('regional_land_carrier', 'Regional Land Carrier')}</span>
                </div>
                <Divider style={{ margin: '8px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 900, color: '#0f172a' }}>
                  <span>{t('grand_total_paid', 'Grand Total Paid:')}</span>
                  <span style={{ color: publicTheme.primary }}>{formatCurrency(completedOrder.total)}</span>
                </div>
              </div>
            </div>
          </Result>
        </Card>
      </div>
    );
  }

  // EMPTY CART SCREEN
  if (cart.length === 0) {
    return (
      <div style={{ padding: '60px 0', maxWidth: 640, margin: '0 auto' }}>
        <Card
          style={{
            borderRadius: 24,
            textAlign: 'center',
            padding: '50px 24px',
            border: `1px solid ${publicTheme.border}`,
            boxShadow: publicTheme.lightShadow,
          }}
        >
          <div style={{ fontSize: 56, marginBottom: 16, color: publicTheme.primary }}>🛒</div>
          <Title level={3} style={{ marginBottom: 8, fontWeight: 850, color: publicTheme.text }}>
            {t('cart_empty', 'Your Procurement Cart is Empty')}
          </Title>
          <Paragraph style={{ color: publicTheme.subtext, fontSize: 14, maxWidth: 420, margin: '0 auto 28px' }}>
            {t('cart_empty_desc', 'Browse our wholesale catalog to order specialty coffee micro-lots, artisan bakery goods, packaging, or tech equipment with bulk tier pricing.')}
          </Paragraph>
          <Space size={12}>
            <Button
              type="primary"
              size="large"
              onClick={() => navigate('/products')}
              style={{
                borderRadius: 14,
                height: 46,
                padding: '0 28px',
                fontWeight: 700,
                background: publicTheme.primary,
                border: 'none',
              }}
            >
              {t('explore_catalog', 'Explore Wholesale Catalog')}
            </Button>
            <Button
              size="large"
              onClick={() => navigate('/shops')}
              style={{
                borderRadius: 14,
                height: 46,
                padding: '0 24px',
                fontWeight: 700,
              }}
            >
              {t('browse_suppliers', 'Browse Verified Suppliers')}
            </Button>
          </Space>
        </Card>
      </div>
    );
  }

  // ACTIVE CART SCREEN
  return (
    <div style={{ padding: '16px 0 48px' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          padding: '32px 36px',
          borderRadius: 24,
          color: 'white',
          marginBottom: 28,
          boxShadow: publicTheme.shadow,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#38bdf8', fontWeight: 800, marginBottom: 4 }}>
            {t('commercial_procurement', 'Commercial Procurement')}
          </div>
          <Title level={2} style={{ color: '#ffffff', margin: 0, fontWeight: 850 }}>
            {t('procurement_workspace', 'Procurement Workspace')} ({cartItemCount} {t('items', 'Items')})
          </Title>
        </div>

        <Space size={10}>
          <Button
            ghost
            onClick={() => navigate('/products')}
            style={{ borderRadius: 12, height: 42, color: '#ffffff', borderColor: 'rgba(255,255,255,0.3)', fontWeight: 700 }}
          >
            ← {t('add_more_skus', 'Add More SKUs')}
          </Button>
          <Button
            danger
            onClick={() => clearCart()}
            style={{ borderRadius: 12, height: 42, fontWeight: 700 }}
          >
            {t('clear_cart', 'Clear Cart')}
          </Button>
        </Space>
      </div>

      <Row gutter={[24, 24]}>
        {/* Left Column: Line Items & Business Details */}
        <Col xs={24} lg={16}>
          {/* Items Card */}
          <Card
            style={{
              borderRadius: 22,
              border: `1px solid ${publicTheme.border}`,
              marginBottom: 24,
              boxShadow: publicTheme.lightShadow,
            }}
            styles={{ body: { padding: '20px 24px' } }}
          >
            <div style={{ fontSize: 14, fontWeight: 800, color: publicTheme.text, marginBottom: 16 }}>
              {t('wholesale_order_items', 'Wholesale Order Items')}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {cart.map((item) => {
                const itemPrice = Number(item.price || 0);
                const itemTotal = Number((itemPrice * (item.quantity || 1)).toFixed(2));
                return (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 16px',
                      borderRadius: 16,
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      gap: 14,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 220 }}>
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={64}
                        height={64}
                        preview={false}
                        style={{ borderRadius: 12, objectFit: 'cover' }}
                      />
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 14, color: publicTheme.text }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: 11.5, color: publicTheme.subtext, marginTop: 2 }}>
                          {t('unit_price', 'Unit Price:')} <strong style={{ color: publicTheme.primary }}>{formatCurrency(itemPrice)}</strong>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                      {/* Quantity Stepper */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#ffffff', borderRadius: 10, padding: 4, border: '1px solid #cbd5e1' }}>
                        <Button
                          size="small"
                          type="text"
                          icon={<MinusOutlined style={{ fontSize: 11 }} />}
                          onClick={() => updateQuantity(item.id, Math.max(1, (item.quantity || 1) - 1))}
                        />
                        <span style={{ fontWeight: 800, minWidth: 24, textAlign: 'center', fontSize: 13 }}>
                          {item.quantity || 1}
                        </span>
                        <Button
                          size="small"
                          type="text"
                          icon={<PlusOutlined style={{ fontSize: 11 }} />}
                          onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
                        />
                      </div>

                      <div style={{ textAlign: 'right', minWidth: 80 }}>
                        <div style={{ fontWeight: 850, fontSize: 15, color: publicTheme.text }}>
                          {formatCurrency(itemTotal)}
                        </div>
                      </div>

                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeFromCart(item.id)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* B2B Commercial Invoice Details */}
          <Card
            style={{
              borderRadius: 22,
              border: `1px solid ${publicTheme.border}`,
              marginBottom: 24,
              boxShadow: publicTheme.lightShadow,
            }}
            styles={{ body: { padding: '20px 24px' } }}
          >
            <div style={{ fontSize: 14, fontWeight: 800, color: publicTheme.text, marginBottom: 16 }}>
              🏢 {t('commercial_invoicing_destination', 'Commercial Invoicing & Freight Destination')}
            </div>

            <Row gutter={[16, 14]}>
              <Col xs={24} sm={12}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: publicTheme.subtext, marginBottom: 4 }}>
                  {t('company_name_label', 'Company / Organization Name:')}
                </div>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Acme Corp Ltd."
                  style={{ borderRadius: 10, height: 40 }}
                />
              </Col>
              <Col xs={24} sm={12}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: publicTheme.subtext, marginBottom: 4 }}>
                  {t('tax_id_label', 'Corporate Tax ID / VAT Number:')}
                </div>
                <Input
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  placeholder="e.g. VAT-8910283"
                  style={{ borderRadius: 10, height: 40 }}
                />
              </Col>
              <Col xs={24} sm={12}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: publicTheme.subtext, marginBottom: 4 }}>
                  {t('po_ref_label', 'Purchase Order Ref (PO #):')}
                </div>
                <Input
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  placeholder="e.g. PO-2026-0082"
                  style={{ borderRadius: 10, height: 40 }}
                />
              </Col>
              <Col xs={24} sm={12}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: publicTheme.subtext, marginBottom: 4 }}>
                  {t('buyer_phone_label', 'Buyer Contact Phone:')}
                </div>
                <Input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+855 12 345 678"
                  style={{ borderRadius: 10, height: 40 }}
                />
              </Col>
              <Col xs={24}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: publicTheme.subtext, marginBottom: 4 }}>
                  {t('delivery_address_label', 'Fulfillment & Freight Delivery Address:')}
                </div>
                <Input
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Full warehouse address or street destination"
                  style={{ borderRadius: 10, height: 40 }}
                />
              </Col>
            </Row>
          </Card>

          {/* Delivery & Payment Selection */}
          <Card
            style={{
              borderRadius: 22,
              border: `1px solid ${publicTheme.border}`,
              marginBottom: 24,
              boxShadow: publicTheme.lightShadow,
            }}
            styles={{ body: { padding: '20px 24px' } }}
          >
            <div style={{ fontSize: 14, fontWeight: 800, color: publicTheme.text, marginBottom: 16 }}>
              🚚 {t('logistics_payment_terms', 'Logistics Carrier & Payment Terms')}
            </div>

            <Row gutter={[24, 20]}>
              <Col xs={24} sm={12}>
                <div style={{ fontSize: 12, fontWeight: 700, color: publicTheme.subtext, marginBottom: 8 }}>
                  {t('delivery_method_label', 'Delivery Method:')}
                </div>
                <Radio.Group
                  value={deliveryMethod}
                  onChange={(e) => setDeliveryMethod(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Radio value="standard">
                      <span style={{ fontWeight: 700 }}>{t('regional_land_freight', 'Regional Land Freight')}</span>
                      <div style={{ fontSize: 11, color: publicTheme.subtext }}>{t('regional_freight_desc', '2–4 days (Free over $100)')}</div>
                    </Radio>
                    <Radio value="express">
                      <span style={{ fontWeight: 700 }}>{t('priority_air_cargo', 'Priority Air Cargo (+$15)')}</span>
                      <div style={{ fontSize: 11, color: publicTheme.subtext }}>{t('next_day_delivery', 'Next-day express delivery')}</div>
                    </Radio>
                    <Radio value="pickup">
                      <span style={{ fontWeight: 700 }}>{t('warehouse_pickup', 'Direct Warehouse Pickup (Free)')}</span>
                      <div style={{ fontSize: 11, color: publicTheme.subtext }}>{t('collect_from_hub', 'Collect from Phnom Penh Hub')}</div>
                    </Radio>
                  </Space>
                </Radio.Group>
              </Col>

              <Col xs={24} sm={12}>
                <div style={{ fontSize: 12, fontWeight: 700, color: publicTheme.subtext, marginBottom: 8 }}>
                  {t('settlement_terms_label', 'Settlement & Terms:')}
                </div>
                <Radio.Group
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Radio value="khqr">
                      <span style={{ fontWeight: 700 }}>{t('khqr_code', 'KHQR Instant QR Code')}</span>
                      <div style={{ fontSize: 11, color: publicTheme.subtext }}>{t('instant_multibank_settlement', 'Instant multi-bank settlement')}</div>
                    </Radio>
                    <Radio value="invoice">
                      <span style={{ fontWeight: 700 }}>{t('net_30_invoice', 'Net-30 Corporate Wire Invoice')}</span>
                      <div style={{ fontSize: 11, color: publicTheme.subtext }}>{t('bank_wire_proforma', 'Bank wire against commercial proforma')}</div>
                    </Radio>
                    <Radio value="card">
                      <span style={{ fontWeight: 700 }}>{t('corporate_credit_card', 'Corporate Credit Card')}</span>
                      <div style={{ fontSize: 11, color: publicTheme.subtext }}>{t('visa_mastercard_card', 'Visa / Mastercard commercial card')}</div>
                    </Radio>
                    <Radio value="cod">
                      <span style={{ fontWeight: 700 }}>{t('cash_on_delivery', 'Cash On Delivery (COD)')}</span>
                      <div style={{ fontSize: 11, color: publicTheme.subtext }}>{t('settle_dock_warehouse', 'Settle at loading dock / warehouse')}</div>
                    </Radio>
                  </Space>
                </Radio.Group>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Right Column: Order Summary Card */}
        <Col xs={24} lg={8}>
          <Card
            style={{
              borderRadius: 24,
              border: `1px solid ${publicTheme.border}`,
              boxShadow: publicTheme.shadow,
              position: 'sticky',
              top: 80,
            }}
            styles={{ body: { padding: '24px 22px' } }}
          >
            <div style={{ fontSize: 16, fontWeight: 850, color: publicTheme.text, marginBottom: 18 }}>
              {t('procurement_summary', 'Procurement Summary')}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: publicTheme.subtext }}>
                <span>{t('subtotal', 'Subtotal')} ({cartItemCount} {t('items', 'items')})</span>
                <span style={{ fontWeight: 700, color: publicTheme.text }}>{formatCurrency(cartTotal)}</span>
              </div>

              {bulkDiscount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981' }}>
                  <span>{t('volume_discount', 'Volume Wholesale Discount')}</span>
                  <span style={{ fontWeight: 800 }}>-{formatCurrency(bulkDiscount)}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', color: publicTheme.subtext }}>
                <span>{t('logistics_freight', 'Logistics & Freight')} ({deliveryMethod})</span>
                <span style={{ fontWeight: 700, color: publicTheme.text }}>
                  {shippingFee === 0 ? <Tag color="green" style={{ margin: 0 }}>{t('free', 'FREE')}</Tag> : formatCurrency(shippingFee)}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', color: publicTheme.subtext }}>
                <span>{t('commercial_tax', 'Commercial Tax / VAT (10%)')}</span>
                <span style={{ fontWeight: 700, color: publicTheme.text }}>{formatCurrency(taxFee)}</span>
              </div>

              <Divider style={{ margin: '12px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 4 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: publicTheme.subtext, textTransform: 'uppercase' }}>
                    {t('total_procurement', 'Total Procurement')}
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: publicTheme.primary }}>
                    {formatCurrency(grandTotal)}
                  </div>
                </div>
                <Tag color="blue" style={{ borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                  {t('escrow_protected', 'Escrow Protected')}
                </Tag>
              </div>
            </div>

            <Button
              type="primary"
              size="large"
              block
              onClick={handleOpenCheckout}
              style={{
                marginTop: 22,
                height: 48,
                borderRadius: 14,
                fontWeight: 800,
                fontSize: 14,
                background: 'linear-gradient(135deg, #2f6fed 0%, #1d4ed8 100%)',
                border: 'none',
                boxShadow: '0 8px 24px rgba(47, 111, 237, 0.35)',
              }}
            >
              {t('proceed_secure_order', 'Proceed to Secure Order')} &rarr;
            </Button>

            <div style={{ textAlign: 'center', marginTop: 14 }}>
              <Button
                type="text"
                icon={<FilePdfOutlined />}
                onClick={() => {
                  exportSingleOrderPdf({
                    orderId: `EST-${Math.floor(100000 + Math.random() * 900000)}`,
                    createdAt: new Date().toLocaleDateString(),
                    customer: { company: companyName, taxId, poNumber, name: customerName },
                    items: cart,
                    subtotal: cartTotal,
                    shipping: shippingFee,
                    tax: taxFee,
                    total: grandTotal,
                  });
                }}
                style={{ fontSize: 12, fontWeight: 700, color: publicTheme.primary }}
              >
                {t('download_pdf', 'Download Proforma Invoice PDF')}
              </Button>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Recommended Sourcing Accessories Widget */}
      <OftenOrderedTogetherWidget />

      {/* Checkout Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 850 }}>
            <span>{t('confirm_settle_order', 'Confirm & Settle Commercial Order')}</span>
          </div>
        }
        open={checkoutModalOpen}
        onCancel={() => setCheckoutModalOpen(false)}
        footer={null}
        width={540}
        centered
        style={{ borderRadius: 24, overflow: 'hidden' }}
      >
        <div style={{ padding: '12px 4px' }}>
          {/* Order Snapshot */}
          <div style={{ background: '#f8fafc', borderRadius: 16, padding: '14px 18px', border: '1px solid #e2e8f0', marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: publicTheme.subtext }}>{t('organization', 'Organization:')}</span>
              <span style={{ fontWeight: 700 }}>{companyName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: publicTheme.subtext }}>{t('po_number', 'PO Number:')}</span>
              <span style={{ fontWeight: 700 }}>{poNumber}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: publicTheme.subtext }}>{t('total_payable', 'Total Payable:')}</span>
              <span style={{ fontWeight: 900, color: publicTheme.primary, fontSize: 16 }}>{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          {/* Dynamic QR Code for KHQR Settlement */}
          {paymentMethod === 'khqr' && (
            <div style={{ textAlign: 'center', padding: '14px 0', background: '#ffffff', borderRadius: 16, border: '1px dashed #cbd5e1', marginBottom: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#ef4444', marginBottom: 8, textTransform: 'uppercase' }}>
                🇰🇭 {t('scan_to_pay_khqr', 'Scan to Pay via KHQR / Bakong')}
              </div>
              <QRCode
                value={`https://bakong.nbc.org.kh/pay?amount=${grandTotal}&currency=USD&ref=${poNumber}`}
                size={160}
                style={{ margin: '0 auto' }}
              />
              <div style={{ fontSize: 11, color: publicTheme.subtext, marginTop: 8 }}>
                {t('scan_khqr_apps', 'Scan with any Cambodian Banking App (ABA, Canadia, Acleda, Wing)')}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
            <Button onClick={() => setCheckoutModalOpen(false)} style={{ borderRadius: 10, height: 42 }}>
              {t('cancel', 'Cancel')}
            </Button>
            <Button
              type="primary"
              loading={isSubmitting}
              onClick={handlePlaceOrder}
              style={{
                borderRadius: 10,
                height: 42,
                fontWeight: 800,
                background: publicTheme.primary,
                paddingInline: 24,
              }}
            >
              {t('confirm_authorize_order', 'Confirm & Authorize Order')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
