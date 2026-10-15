import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Form,
  Select,
  Input,
  InputNumber,
  Radio,
  Button,
  Space,
  Typography,
  Divider,
  QRCode,
  Tag,
  App,
  Tooltip,
  Switch,
  Badge,
  Tabs,
  Table,
} from 'antd';
import {
  QrcodeOutlined,
  DownloadOutlined,
  CopyOutlined,
  PrinterOutlined,
  ShopOutlined,
  NumberOutlined,
  LinkOutlined,
  BgColorsOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  AppstoreOutlined,
  CompassOutlined,
  WifiOutlined,
  MobileOutlined,
} from '@ant-design/icons';
import { useAdminTheme } from '../../hooks/useAdminTheme';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

export default function AdminQrCodeGenerator() {
  const adminTheme = useAdminTheme();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const qrRef = useRef(null);
  const standRef = useRef(null);

  // Available Stores from real Database API
  const [stores, setStores] = useState([]);
  const [selectedStoreSlug, setSelectedStoreSlug] = useState('sbc-store');

  // Form State
  const [locationType, setLocationType] = useState('table'); // 'table' | 'counter' | 'room' | 'bar'
  const [locationNumber, setLocationNumber] = useState('1');
  const [zoneLabel, setZoneLabel] = useState('Ground Floor');
  const [destinationType, setDestinationType] = useState('tma'); // 'tma' | 'tma_item' | 'emenu' | 'custom'
  const [targetItemId, setTargetItemId] = useState('1');
  const [customPath, setCustomPath] = useState('');
  const [includeWifi, setIncludeWifi] = useState(false);
  const [wifiSsid, setWifiSsid] = useState('Aura-Guest-WiFi');
  const [wifiPass, setWifiPass] = useState('CoffeeLove2026');

  // QR Code Visual Settings
  const [qrSize, setQrSize] = useState(240);
  const [qrColor, setQrColor] = useState('#0f172a');
  const [qrBgColor, setQrBgColor] = useState('#ffffff');
  const [showLogo, setShowLogo] = useState(true);
  const [errorLevel, setErrorLevel] = useState('H'); // H level allows logo embed without scan disruption

  // Batch Generator State
  const [batchStart, setBatchStart] = useState(1);
  const [batchEnd, setBatchEnd] = useState(10);
  const [batchLocationType, setBatchLocationType] = useState('table');
  const [batchList, setBatchList] = useState([]);

  // Fetch live stores from database API
  useEffect(() => {
    fetch('/api/shops')
      .then((res) => res.json())
      .then((data) => {
        const storeList = data.data || data.stores;
        if (storeList && Array.isArray(storeList) && storeList.length > 0) {
          setStores(storeList);
          if (!selectedStoreSlug || selectedStoreSlug === 'sbc-store') {
            setSelectedStoreSlug(storeList[0].slug || `store-${storeList[0].id}`);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Currently active store object
  const activeStore = useMemo(() => {
    return stores.find((s) => s.slug === selectedStoreSlug) || stores[0] || {};
  }, [stores, selectedStoreSlug]);

  // Update default QR color to match store theme
  useEffect(() => {
    if (activeStore?.theme_color) {
      setQrColor(activeStore.theme_color);
    }
  }, [activeStore]);

  // Compute final QR target URL
  const targetUrl = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://aura-global.app';
    const storeSlug = activeStore?.slug || 'sbc-store';
    const numParam = encodeURIComponent(locationNumber || '1');

    if (destinationType === 'custom' && customPath.trim()) {
      return customPath.startsWith('http') ? customPath : `${origin}${customPath}`;
    }

    if (destinationType === 'tma') {
      return `https://t.me/aura_emenu_order_bot/menu?startapp=shop_${storeSlug}`;
    }

    if (destinationType === 'tma_web') {
      return `${origin}/tma/${storeSlug}?${locationType}=${numParam}`;
    }

    if (destinationType === 'tma_item') {
      return `https://t.me/aura_emenu_order_bot/menu?startapp=item_${targetItemId || 1}`;
    }

    // Default E-Menu
    return `${origin}/shop/${storeSlug}?${locationType}=${numParam}`;
  }, [activeStore, destinationType, customPath, targetItemId, locationType, locationNumber]);

  // Copy target URL to clipboard
  const handleCopyUrl = () => {
    navigator.clipboard.writeText(targetUrl);
    message.success('QR target URL copied to clipboard!');
  };

  // Helper to extract Canvas from QRCode container
  const getQrCanvas = () => {
    if (!qrRef.current) return null;
    return qrRef.current.querySelector('canvas');
  };

  // Download QR Code Image (Standalone PNG)
  const handleDownloadQrOnly = () => {
    const canvas = getQrCanvas();
    if (!canvas) {
      message.error('QR Code canvas not ready');
      return;
    }

    const pngUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = pngUrl;
    link.download = `QR_${activeStore?.slug || 'store'}_${locationType}_${locationNumber}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success(`Downloaded QR Code image for ${locationType} ${locationNumber}!`);
  };

  // Download High-Resolution Table Tent / Counter Stand Card Image
  const handleDownloadStandCard = () => {
    const qrCanvas = getQrCanvas();
    if (!qrCanvas) {
      message.error('QR Code not ready');
      return;
    }

    // Render a high-resolution stand card to an off-screen canvas
    const cardWidth = 720;
    const cardHeight = 1040;
    const offCanvas = document.createElement('canvas');
    offCanvas.width = cardWidth;
    offCanvas.height = cardHeight;
    const ctx = offCanvas.getContext('2d');

    // 1. Background fill
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, cardWidth, cardHeight);

    // 2. Decorative Top Header Banner (with store brand color)
    const brandColor = activeStore?.theme_color || '#2563eb';
    const headerGradient = ctx.createLinearGradient(0, 0, cardWidth, 240);
    headerGradient.addColorStop(0, brandColor);
    headerGradient.addColorStop(1, '#0f172a');
    ctx.fillStyle = headerGradient;
    ctx.fillRect(0, 0, cardWidth, 220);

    // Rounded card border
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, cardWidth - 4, cardHeight - 4);

    // 3. Header Text & Store Name
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 36px "Segoe UI", Roboto, sans-serif';
    ctx.fillText(activeStore?.name || 'Aura Global', cardWidth / 2, 70);

    ctx.font = '18px "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillText(activeStore?.tagline || 'Scan to view menu & place your order', cardWidth / 2, 110);

    // Subtitle Pill Banner
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.beginPath();
    ctx.roundRect(cardWidth / 2 - 190, 140, 380, 48, 24);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px "Segoe UI", Roboto, sans-serif';
    ctx.fillText('📱 CONTACTLESS ORDERING', cardWidth / 2, 172);

    // 4. Location Badge (Table or Counter)
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.roundRect(cardWidth / 2 - 160, 255, 320, 64, 12);
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 28px "Segoe UI", Roboto, sans-serif';
    const locTitle = `${locationType.toUpperCase()} #${locationNumber}`;
    ctx.fillText(locTitle, cardWidth / 2, 298);

    // 5. Draw QR Code centered
    const qrDrawSize = 380;
    const qrX = (cardWidth - qrDrawSize) / 2;
    const qrY = 345;

    // QR container box
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(qrX - 16, qrY - 16, qrDrawSize + 32, qrDrawSize + 32, 16);
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw the actual QR canvas into the card
    ctx.drawImage(qrCanvas, qrX, qrY, qrDrawSize, qrDrawSize);

    // 6. Step-by-Step Instructions
    const stepY = 785;
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 22px "Segoe UI", Roboto, sans-serif';
    ctx.fillText('HOW TO ORDER', cardWidth / 2, stepY);

    ctx.fillStyle = '#64748b';
    ctx.font = '17px "Segoe UI", Roboto, sans-serif';
    ctx.fillText('1. Open your Smartphone Camera or Telegram', cardWidth / 2, stepY + 34);
    ctx.fillText('2. Point camera at the QR code above', cardWidth / 2, stepY + 64);
    ctx.fillText('3. Browse fresh menu items & confirm order', cardWidth / 2, stepY + 94);

    // 7. Optional Wi-Fi info or Footer
    if (includeWifi) {
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(40, 930, cardWidth - 80, 60);
      ctx.fillStyle = '#334155';
      ctx.font = 'bold 15px "Segoe UI", Roboto, sans-serif';
      ctx.fillText(`📶 Free Wi-Fi: ${wifiSsid}   |   Password: ${wifiPass}`, cardWidth / 2, 966);
    } else {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px "Segoe UI", Roboto, sans-serif';
      ctx.fillText(`Powered by Aura E-Menu • ${activeStore?.location || 'Phnom Penh'}`, cardWidth / 2, 970);
    }

    // Trigger download
    const cardDataUrl = offCanvas.toDataURL('image/png');
    const dlLink = document.createElement('a');
    dlLink.href = cardDataUrl;
    dlLink.download = `StandCard_${activeStore?.slug || 'store'}_${locationType}_${locationNumber}.png`;
    document.body.appendChild(dlLink);
    dlLink.click();
    document.body.removeChild(dlLink);
    message.success(`Downloaded Table Stand Card image for ${locationType} ${locationNumber}!`);
  };

  // Print Stand Card directly
  const handlePrint = () => {
    window.print();
  };

  // Generate Batch Table List
  const handleGenerateBatch = () => {
    const list = [];
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://aura-global.app';
    const storeSlug = activeStore?.slug || 'sbc-store';

    for (let i = batchStart; i <= batchEnd; i++) {
      const url = `${origin}/shop/${storeSlug}?${batchLocationType}=${i}`;
      list.push({
        key: i,
        id: i,
        number: `${batchLocationType.toUpperCase()} #${i}`,
        type: batchLocationType,
        url: url,
        store: activeStore?.name,
      });
    }
    setBatchList(list);
    message.success(`Generated ${list.length} QR code locations!`);
  };

  return (
    <div style={{ padding: '0 0 24px 0' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #2563eb 100%)',
          borderRadius: 14,
          padding: '24px 28px',
          color: '#ffffff',
          marginBottom: 20,
          boxShadow: '0 4px 12px rgba(15,23,42,0.18)',
        }}
      >
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col xs={24} md={16}>
            <Title level={3} style={{ color: '#ffffff', margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
              <QrcodeOutlined style={{ color: '#38bdf8' }} />
              QR Code Generator & Table Stand Designer
            </Title>
            <Paragraph style={{ color: 'rgba(255,255,255,0.85)', margin: '6px 0 0 0', fontSize: 14 }}>
              Generate custom QR codes for specific store locations, tables, and counters. Customers can scan to instantly open the E-Menu and place orders directly to that exact seat.
            </Paragraph>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: 'right' }}>
            <Space wrap size="middle">
              <Button
                icon={<DownloadOutlined />}
                onClick={handleDownloadStandCard}
                style={{
                  background: '#2563eb',
                  borderColor: '#2563eb',
                  color: '#ffffff',
                  borderRadius: 8,
                  fontWeight: 600,
                }}
              >
                Download Stand Card
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      <Tabs
        defaultActiveKey="single"
        items={[
          {
            key: 'single',
            label: (
              <span>
                <QrcodeOutlined /> Single Table & Counter Generator
              </span>
            ),
            children: (
              <Row gutter={[24, 24]}>
                {/* Left Column: Form Controls */}
                <Col xs={24} lg={13}>
                  <Card
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <ShopOutlined style={{ color: '#2563eb' }} />
                        <span>Configure Store & Location</span>
                      </div>
                    }
                    bordered
                    style={{
                      borderRadius: 12,
                      background: adminTheme.card,
                      borderColor: adminTheme.border,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    }}
                  >
                    <Form form={form} layout="vertical">
                      {/* 1. Store Selector */}
                      <Form.Item label={<Text strong>Select Target Store / Biller</Text>} required>
                        <Select
                          size="large"
                          value={selectedStoreSlug}
                          onChange={(val) => setSelectedStoreSlug(val)}
                          style={{ width: '100%' }}
                        >
                          {stores.map((s) => (
                            <Option key={s.slug || s.id} value={s.slug}>
                              <Space>
                                {s.logo && (
                                  <img
                                    src={s.logo}
                                    alt={s.name}
                                    style={{ width: 22, height: 22, borderRadius: 4, objectFit: 'cover' }}
                                  />
                                )}
                                <span>{s.name}</span>
                                <Tag color="blue" style={{ fontSize: 11, borderRadius: 6 }}>
                                  {s.location || s.slug}
                                </Tag>
                              </Space>
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>

                      {/* 2. Location Type & Number */}
                      <Row gutter={16}>
                        <Col xs={24} sm={12}>
                          <Form.Item label={<Text strong>Location Type</Text>}>
                            <Select
                              size="large"
                              value={locationType}
                              onChange={(val) => setLocationType(val)}
                              style={{ width: '100%' }}
                            >
                              <Option value="table">Table (Dine-In)</Option>
                              <Option value="counter">Counter (Takeaway / Pickup)</Option>
                              <Option value="bar">Bar / Barista Station</Option>
                              <Option value="room">Private Room / VIP Booth</Option>
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            label={<Text strong>{locationType === 'table' ? 'Table Number' : locationType === 'counter' ? 'Counter Number' : 'Location Identifier'}</Text>}
                            required
                          >
                            <Input
                              size="large"
                              prefix={<NumberOutlined style={{ color: '#94a3b8' }} />}
                              placeholder="e.g. 5, 12, VIP-1"
                              value={locationNumber}
                              onChange={(e) => setLocationNumber(e.target.value)}
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      {/* 3. Zone / Floor Label */}
                      <Row gutter={16}>
                        <Col xs={24} sm={12}>
                          <Form.Item label={<Text strong>Floor / Area Description (Optional)</Text>}>
                            <Input
                              prefix={<CompassOutlined style={{ color: '#94a3b8' }} />}
                              placeholder="e.g. 1st Floor, Patio, Balcony"
                              value={zoneLabel}
                              onChange={(e) => setZoneLabel(e.target.value)}
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Form.Item label={<Text strong>Customer Destination</Text>}>
                            <Select
                              value={destinationType}
                              onChange={(val) => setDestinationType(val)}
                              style={{ width: '100%' }}
                            >
                              <Option value="tma">Telegram Bot App Link (t.me/...startapp=shop_{activeStore?.slug})</Option>
                              <Option value="emenu">Web E-Menu (/shop/{activeStore?.slug})</Option>
                              <Option value="tma_item">Telegram Direct Product Item (item_ID)</Option>
                              <Option value="custom">Custom URL</Option>
                            </Select>
                          </Form.Item>
                        </Col>
                      </Row>

                      {destinationType === 'tma_item' && (
                        <Form.Item label={<Text strong>Target Product Item ID</Text>} required>
                          <Input
                            prefix={<span style={{ fontWeight: 700, color: '#2563eb' }}>item_</span>}
                            placeholder="e.g. 1 (Spanish Iced Latte), 2 (Mondulkiri), 4 (Cold Brew)..."
                            value={targetItemId}
                            onChange={(e) => setTargetItemId(e.target.value.replace(/[^0-9]/g, ''))}
                          />
                        </Form.Item>
                      )}

                      {destinationType === 'custom' && (
                        <Form.Item label="Custom URL Target" required>
                          <Input
                            placeholder="https://... or /shop/..."
                            value={customPath}
                            onChange={(e) => setCustomPath(e.target.value)}
                          />
                        </Form.Item>
                      )}

                      {/* Computed Destination URL Preview */}
                      <div
                        style={{
                          background: adminTheme.cardMuted,
                          padding: '10px 14px',
                          borderRadius: 8,
                          border: `1px solid ${adminTheme.border}`,
                          marginBottom: 18,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <Text style={{ fontSize: 12, color: adminTheme.subtext }}>
                            <LinkOutlined style={{ marginRight: 6 }} /> Generated Target URL
                          </Text>
                          <Button size="small" type="link" icon={<CopyOutlined />} onClick={handleCopyUrl}>
                            Copy Link
                          </Button>
                        </div>
                        <Text code copyable style={{ fontSize: 13, wordBreak: 'break-all', display: 'block' }}>
                          {targetUrl}
                        </Text>
                      </div>

                      <Divider orientation="left" style={{ borderColor: adminTheme.border, fontSize: 13, color: adminTheme.subtext }}>
                        QR Styling & Branding
                      </Divider>

                      {/* QR Styling Controls */}
                      <Row gutter={16}>
                        <Col xs={12} sm={8}>
                          <Form.Item label="QR Code Color">
                            <Input
                              type="color"
                              value={qrColor}
                              onChange={(e) => setQrColor(e.target.value)}
                              style={{ height: 40, width: '100%', padding: 2, cursor: 'pointer' }}
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={12} sm={8}>
                          <Form.Item label="Background">
                            <Input
                              type="color"
                              value={qrBgColor}
                              onChange={(e) => setQrBgColor(e.target.value)}
                              style={{ height: 40, width: '100%', padding: 2, cursor: 'pointer' }}
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={8}>
                          <Form.Item label="Embed Store Logo">
                            <Switch checked={showLogo} onChange={setShowLogo} style={{ marginTop: 6 }} />
                          </Form.Item>
                        </Col>
                      </Row>

                      {/* Wi-Fi Info on Stand Card */}
                      <Divider orientation="left" style={{ borderColor: adminTheme.border, fontSize: 13, color: adminTheme.subtext }}>
                        Customer Wi-Fi on Stand Card (Optional)
                      </Divider>

                      <Row gutter={16} align="middle">
                        <Col xs={24} sm={6}>
                          <Form.Item label="Show Free Wi-Fi">
                            <Switch checked={includeWifi} onChange={setIncludeWifi} />
                          </Form.Item>
                        </Col>
                        {includeWifi && (
                          <>
                            <Col xs={12} sm={9}>
                              <Form.Item label="Wi-Fi SSID (Name)">
                                <Input
                                  prefix={<WifiOutlined style={{ color: '#94a3b8' }} />}
                                  value={wifiSsid}
                                  onChange={(e) => setWifiSsid(e.target.value)}
                                />
                              </Form.Item>
                            </Col>
                            <Col xs={12} sm={9}>
                              <Form.Item label="Wi-Fi Password">
                                <Input
                                  value={wifiPass}
                                  onChange={(e) => setWifiPass(e.target.value)}
                                />
                              </Form.Item>
                            </Col>
                          </>
                        )}
                      </Row>
                    </Form>
                  </Card>
                </Col>

                {/* Right Column: Live Stand Card & QR Code Preview */}
                <Col xs={24} lg={11}>
                  <Card
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <EyeOutlined style={{ color: '#10b981' }} />
                          <span>Live Stand Card Preview</span>
                        </span>
                        <Tag color="cyan">Print Ready</Tag>
                      </div>
                    }
                    extra={
                      <Space>
                        <Button
                          size="small"
                          icon={<DownloadOutlined />}
                          onClick={handleDownloadQrOnly}
                          title="Download standalone QR code image"
                        >
                          QR Only
                        </Button>
                        <Button
                          size="small"
                          type="primary"
                          icon={<DownloadOutlined />}
                          onClick={handleDownloadStandCard}
                          style={{ background: '#2563eb' }}
                        >
                          Stand Card
                        </Button>
                      </Space>
                    }
                    bordered
                    style={{
                      borderRadius: 12,
                      background: adminTheme.card,
                      borderColor: adminTheme.border,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    }}
                  >
                    {/* The Visual Stand Card Preview Container */}
                    <div
                      ref={standRef}
                      style={{
                        background: '#ffffff',
                        border: '2px solid #e2e8f0',
                        borderRadius: 16,
                        overflow: 'hidden',
                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                        maxWidth: 360,
                        margin: '0 auto',
                        textAlign: 'center',
                      }}
                    >
                      {/* Header with store brand styling */}
                      <div
                        style={{
                          background: `linear-gradient(135deg, ${activeStore?.theme_color || '#2563eb'} 0%, #0f172a 100%)`,
                          padding: '20px 16px 16px 16px',
                          color: '#ffffff',
                        }}
                      >
                        {activeStore?.logo && (
                          <img
                            src={activeStore.logo}
                            alt={activeStore.name}
                            style={{
                              width: 50,
                              height: 50,
                              borderRadius: 10,
                              objectFit: 'cover',
                              border: '2px solid rgba(255,255,255,0.8)',
                              marginBottom: 8,
                            }}
                          />
                        )}
                        <Title level={4} style={{ color: '#ffffff', margin: 0, fontWeight: 700, fontSize: 18 }}>
                          {activeStore?.name || 'Aura Global'}
                        </Title>
                        <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11.5, display: 'block', marginTop: 2 }}>
                          {activeStore?.tagline || 'Specialty Coffee & Bakery'}
                        </Text>
                        <div
                          style={{
                            display: 'inline-block',
                            background: 'rgba(255,255,255,0.2)',
                            borderRadius: 16,
                            padding: '3px 12px',
                            fontSize: 11,
                            fontWeight: 600,
                            letterSpacing: '0.04em',
                            marginTop: 10,
                          }}
                        >
                          📱 CONTACTLESS ORDERING
                        </div>
                      </div>

                      {/* Location Badge */}
                      <div style={{ padding: '16px 16px 8px 16px' }}>
                        <div
                          style={{
                            background: '#f8fafc',
                            border: '1px solid #cbd5e1',
                            borderRadius: 8,
                            padding: '6px 12px',
                            display: 'inline-block',
                            marginBottom: 12,
                          }}
                        >
                          <Text strong style={{ fontSize: 16, color: '#0f172a' }}>
                            {locationType.toUpperCase()} #{locationNumber || '1'}
                          </Text>
                          {zoneLabel && (
                            <span style={{ fontSize: 11, color: '#64748b', marginLeft: 6 }}>
                              ({zoneLabel})
                            </span>
                          )}
                        </div>

                        {/* Interactive Ant Design QR Code Component */}
                        <div
                          ref={qrRef}
                          style={{
                            display: 'inline-block',
                            padding: 12,
                            borderRadius: 12,
                            background: qrBgColor,
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                          }}
                        >
                          <QRCode
                            value={targetUrl}
                            size={qrSize}
                            color={qrColor}
                            bgColor={qrBgColor}
                            icon={showLogo ? (activeStore?.logo || '/favicon.ico') : undefined}
                            iconSize={qrSize / 5}
                            errorLevel={errorLevel}
                            bordered={false}
                          />
                        </div>

                        {/* Step Instructions */}
                        <div style={{ marginTop: 14, textAlign: 'center', padding: '0 10px' }}>
                          <Text strong style={{ fontSize: 13, color: '#1e293b', display: 'block' }}>
                            SCAN TO ORDER & PAY
                          </Text>
                          <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4, lineHeight: 1.5 }}>
                            1. Open your camera or Telegram<br />
                            2. Point at QR code to open E-Menu<br />
                            3. Select items & enjoy your order!
                          </div>
                        </div>

                        {/* Wi-Fi footer or store location */}
                        <div
                          style={{
                            marginTop: 14,
                            marginBottom: 8,
                            padding: '8px 12px',
                            background: '#f1f5f9',
                            borderRadius: 6,
                            fontSize: 11,
                            color: '#475569',
                          }}
                        >
                          {includeWifi ? (
                            <div>
                              <WifiOutlined style={{ marginRight: 4, color: '#2563eb' }} />
                              Wi-Fi: <b>{wifiSsid}</b> | Pass: <b>{wifiPass}</b>
                            </div>
                          ) : (
                            <div>
                              📍 {activeStore?.location || 'Phnom Penh'} • Powered by Aura E-Menu
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div style={{ marginTop: 20, textAlign: 'center' }}>
                      <Space size="middle" wrap style={{ justifyContent: 'center' }}>
                        <Button
                          icon={<DownloadOutlined />}
                          onClick={handleDownloadQrOnly}
                          style={{ borderRadius: 8 }}
                        >
                          Save QR PNG
                        </Button>
                        <Button
                          type="primary"
                          icon={<DownloadOutlined />}
                          onClick={handleDownloadStandCard}
                          style={{ borderRadius: 8, background: '#2563eb' }}
                        >
                          Download Table Stand Card
                        </Button>
                      </Space>
                    </div>
                  </Card>
                </Col>
              </Row>
            ),
          },
          {
            key: 'batch',
            label: (
              <span>
                <AppstoreOutlined /> Batch Table Generator
              </span>
            ),
            children: (
              <Card
                title="Batch Generate QR Codes for Multiple Tables / Counters"
                bordered
                style={{
                  borderRadius: 12,
                  background: adminTheme.card,
                  borderColor: adminTheme.border,
                }}
              >
                <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 20 }}>
                  <Col xs={24} sm={8} md={6}>
                    <Text strong style={{ display: 'block', marginBottom: 4 }}>Select Store</Text>
                    <Select
                      value={selectedStoreSlug}
                      onChange={setSelectedStoreSlug}
                      style={{ width: '100%' }}
                    >
                      {stores.map((s) => (
                        <Option key={s.slug} value={s.slug}>{s.name}</Option>
                      ))}
                    </Select>
                  </Col>

                  <Col xs={12} sm={6} md={4}>
                    <Text strong style={{ display: 'block', marginBottom: 4 }}>Type</Text>
                    <Select
                      value={batchLocationType}
                      onChange={setBatchLocationType}
                      style={{ width: '100%' }}
                    >
                      <Option value="table">Table</Option>
                      <Option value="counter">Counter</Option>
                      <Option value="bar">Bar</Option>
                    </Select>
                  </Col>

                  <Col xs={12} sm={5} md={3}>
                    <Text strong style={{ display: 'block', marginBottom: 4 }}>Start #</Text>
                    <InputNumber
                      min={1}
                      max={999}
                      value={batchStart}
                      onChange={setBatchStart}
                      style={{ width: '100%' }}
                    />
                  </Col>

                  <Col xs={12} sm={5} md={3}>
                    <Text strong style={{ display: 'block', marginBottom: 4 }}>End #</Text>
                    <InputNumber
                      min={1}
                      max={999}
                      value={batchEnd}
                      onChange={setBatchEnd}
                      style={{ width: '100%' }}
                    />
                  </Col>

                  <Col xs={24} sm={24} md={8} style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <Button
                      type="primary"
                      icon={<QrcodeOutlined />}
                      onClick={handleGenerateBatch}
                      style={{ height: 38, borderRadius: 8, background: '#2563eb' }}
                    >
                      Generate Range ({batchStart} to {batchEnd})
                    </Button>
                  </Col>
                </Row>

                {batchList.length > 0 && (
                  <Table
                    rowKey="id"
                    dataSource={batchList}
                    pagination={{ pageSize: 10 }}
                    columns={[
                      { title: 'Location', dataIndex: 'number', key: 'number', render: (t) => <b>{t}</b> },
                      { title: 'Store', dataIndex: 'store', key: 'store' },
                      {
                        title: 'Target URL',
                        dataIndex: 'url',
                        key: 'url',
                        render: (u) => <Text code copyable style={{ fontSize: 12 }}>{u}</Text>,
                      },
                      {
                        title: 'QR Preview',
                        key: 'qr',
                        width: 120,
                        render: (_, record) => (
                          <QRCode
                            value={record.url}
                            size={64}
                            bordered={false}
                            color={activeStore?.theme_color || '#0f172a'}
                          />
                        ),
                      },
                      {
                        title: 'Action',
                        key: 'action',
                        width: 160,
                        render: (_, record) => (
                          <Button
                            size="small"
                            icon={<CopyOutlined />}
                            onClick={() => {
                              navigator.clipboard.writeText(record.url);
                              message.success(`Copied URL for ${record.number}!`);
                            }}
                          >
                            Copy Link
                          </Button>
                        ),
                      },
                    ]}
                  />
                )}
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}
