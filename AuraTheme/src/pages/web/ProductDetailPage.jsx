import React, { useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Row,
  Col,
  Card,
  Button,
  Tag,
  Typography,
  Space,
  InputNumber,
  Tabs,
  Rate,
  Divider,
  Breadcrumb,
  message,
  Tooltip,
} from 'antd';
import {
  ShoppingCartOutlined,
  HeartOutlined,
  HeartFilled,
  ShareAltOutlined,
  SendOutlined,
  SafetyCertificateFilled,
  CarOutlined,
  CheckCircleFilled,
  DownloadOutlined,
  ShopOutlined,
  ThunderboltFilled,
  FileTextOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { products, baseProducts, shops } from '../../data/shopData';
import simpleData from '../../../../data/simpleData';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { formatCurrency, publicTheme, B2B_WHOLESALE_TIERS, calculateTierPrice } from '../../utils/webTheme';
import RetailProductCard from '../../components/web/shared/RetailProductCard';
import TelegramMiniAppModal from '../../components/web/shared/TelegramMiniAppModal';

const { Title, Text, Paragraph } = Typography;

export default function ProductDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addItem, addToCart } = useCart();
  const { wishlist, toggleWishlist } = useWishlist();

  const [quantity, setQuantity] = useState(5);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [telegramModalOpen, setTelegramModalOpen] = useState(false);

  const foundProduct = useMemo(() => {
    if (!productId) return products[0] || null;

    const inShopData = (products || []).find(
      (p) => String(p.id) === String(productId) || p.slug === productId
    );
    if (inShopData) return inShopData;

    const inBase = (baseProducts || []).find(
      (p) => String(p.id) === String(productId)
    );
    if (inBase) return inBase;

    const inSimple = (simpleData.products || []).find(
      (p) => String(p.id) === String(productId) || p.code === productId
    );
    if (inSimple) return inSimple;

    return products[0] || null;
  }, [productId]);

  const matchingShop = useMemo(() => {
    if (!foundProduct) return shops[0];
    return (
      shops.find((s) => s.id === foundProduct.shopId || s.slug === foundProduct.seller) ||
      shops[0]
    );
  }, [foundProduct]);

  const relatedProducts = useMemo(() => {
    if (!foundProduct) return [];
    return products
      .filter((p) => p.id !== foundProduct.id && (p.category === foundProduct.category || p.shopId === foundProduct.shopId))
      .slice(0, 4);
  }, [foundProduct]);

  if (!foundProduct) {
    return (
      <div style={{ padding: '80px 20px', textAlign: 'center' }}>
        <Title level={3} style={{ color: publicTheme.text }}>Product not found</Title>
        <Button
          type="primary"
          onClick={() => navigate('/products')}
          style={{ borderRadius: 12, height: 44, fontWeight: 700 }}
        >
          Return to Wholesale Catalog
        </Button>
      </div>
    );
  }

  const isWishlisted = wishlist.some((item) => item.id === foundProduct.id);
  const moq = foundProduct.moq || (foundProduct.price > 100 ? 2 : 5);
  const basePrice = Number(foundProduct.price || 0);
  const tierCalc = calculateTierPrice(basePrice, quantity);

  // Gallery images array
  const galleryImages = [
    foundProduct.image,
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&fit=crop',
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&fit=crop',
    'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&fit=crop',
  ].filter(Boolean);

  const handleAddToCart = () => {
    addItem({
      id: foundProduct.id,
      name: foundProduct.name,
      price: tierCalc.unitPrice,
      image: foundProduct.image,
      quantity,
    });
    message.success(`Added ${quantity} units of ${foundProduct.name} to procurement cart!`);
  };

  const handleBuyNow = () => {
    addItem({
      id: foundProduct.id,
      name: foundProduct.name,
      price: tierCalc.unitPrice,
      image: foundProduct.image,
      quantity,
    });
    navigate('/cart');
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      message.success('Product link copied to clipboard!');
    }
  };

  return (
    <div style={{ width: '100%', paddingBottom: 56 }}>
      {/* Breadcrumb */}
      <Breadcrumb
        style={{ marginBottom: 20 }}
        items={[
          { title: <Link to="/">Home</Link> },
          { title: <Link to="/products">Wholesale Catalog</Link> },
          { title: <Link to={`/products?category=${foundProduct.category}`}>{foundProduct.category || 'Supplies'}</Link> },
          { title: foundProduct.name },
        ]}
      />

      {/* Main Product Showcase Card */}
      <Card
        style={{
          borderRadius: 24,
          border: `1px solid ${publicTheme.border}`,
          boxShadow: publicTheme.shadow,
          overflow: 'hidden',
          marginBottom: 32,
        }}
        styles={{ body: { padding: '32px 28px' } }}
      >
        <Row gutter={[40, 36]}>
          {/* Left Column: Multi-Angle High-Res Gallery */}
          <Col xs={24} lg={11}>
            <div
              style={{
                borderRadius: 20,
                overflow: 'hidden',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                aspectRatio: '1 / 1',
                marginBottom: 16,
                position: 'relative',
              }}
            >
              <img
                src={galleryImages[selectedImageIndex] || foundProduct.image}
                alt={foundProduct.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />

              {foundProduct.badge && (
                <span
                  style={{
                    position: 'absolute',
                    top: 14,
                    left: 14,
                    borderRadius: 999,
                    background: '#2f6fed',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: 11,
                    padding: '4px 10px',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                  }}
                >
                  {foundProduct.badge}
                </span>
              )}
            </div>

            {/* Thumbnail Navigation */}
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6 }}>
              {galleryImages.map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  style={{
                    width: 68,
                    height: 68,
                    borderRadius: 12,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: selectedImageIndex === idx ? `2px solid ${publicTheme.primary}` : '1px solid #e2e8f0',
                    opacity: selectedImageIndex === idx ? 1 : 0.7,
                    transition: 'all 0.15s ease',
                    flexShrink: 0,
                  }}
                >
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          </Col>

          {/* Right Column: B2B Specifications, Pricing Tiers & Order Controls */}
          <Col xs={24} lg={13}>
            {/* Supplier Chip & Brand */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="verified-supplier-pill">
                  <CheckCircleFilled style={{ color: '#2f6fed' }} /> Verified Supplier: {matchingShop?.name || 'Aura Partner'}
                </span>
                <Tag color="green" style={{ borderRadius: 6, fontSize: 11 }}>
                  In Stock ({foundProduct.inStock ? 'Ready' : 'Backorder'})
                </Tag>
              </div>

              <Space size={8}>
                <Button
                  shape="circle"
                  icon={isWishlisted ? <HeartFilled style={{ color: '#ef4444' }} /> : <HeartOutlined />}
                  onClick={() => toggleWishlist(foundProduct)}
                />
                <Button shape="circle" icon={<ShareAltOutlined />} onClick={handleShare} />
              </Space>
            </div>

            <Title level={2} style={{ margin: '4px 0 10px', fontWeight: 850, color: publicTheme.text, fontSize: 26 }}>
              {foundProduct.name}
            </Title>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
              <Rate disabled defaultValue={foundProduct.rating || 4.9} style={{ fontSize: 14 }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: publicTheme.text }}>
                {foundProduct.rating || 4.9} ({foundProduct.reviews || 42} verified business reviews)
              </span>
              <span style={{ color: '#cbd5e1' }}>•</span>
              <span className="moq-pill">MOQ: {moq} units</span>
            </div>

            <Paragraph style={{ color: publicTheme.subtext, fontSize: 13.5, lineHeight: 1.6, marginBottom: 20 }}>
              {foundProduct.description}
            </Paragraph>

            {/* B2B Tiered Wholesale Pricing Matrix */}
            <div
              style={{
                borderRadius: 16,
                border: '1px solid #e2e8f0',
                background: '#f8fafc',
                padding: '16px 20px',
                marginBottom: 24,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 800, color: publicTheme.subtext, textTransform: 'uppercase', marginBottom: 10, letterSpacing: '0.04em' }}>
                📊 Wholesale Volume Tier Pricing
              </div>
              <Row gutter={[12, 12]}>
                {B2B_WHOLESALE_TIERS.map((tier) => {
                  const isCurrentTier = tierCalc.tier.tier === tier.tier;
                  const unitP = Number((basePrice * (1 - tier.discountRate)).toFixed(2));
                  return (
                    <Col xs={8} key={tier.tier}>
                      <div
                        style={{
                          background: isCurrentTier ? '#ffffff' : 'rgba(255,255,255,0.6)',
                          borderRadius: 12,
                          padding: '10px 12px',
                          border: isCurrentTier ? `2px solid ${publicTheme.primary}` : '1px solid #e2e8f0',
                          boxShadow: isCurrentTier ? '0 4px 12px rgba(47, 111, 237, 0.15)' : 'none',
                          textAlign: 'center',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ fontSize: 11, fontWeight: 700, color: isCurrentTier ? publicTheme.primary : publicTheme.subtext }}>
                          {tier.maxQty === Infinity ? `${tier.minQty}+ pcs` : `${tier.minQty}–${tier.maxQty} pcs`}
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 850, color: publicTheme.text, margin: '2px 0' }}>
                          {formatCurrency(unitP)}
                        </div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: tier.discountRate > 0 ? '#10b981' : '#64748b' }}>
                          {tier.discountRate > 0 ? `Save ${(tier.discountRate * 100).toFixed(0)}%` : 'Base Tier'}
                        </div>
                      </div>
                    </Col>
                  );
                })}
              </Row>
            </div>

            {/* Quantity Stepper & Instant Cost Calculation */}
            <div
              style={{
                borderRadius: 16,
                border: '1px solid #e2e8f0',
                padding: '16px 20px',
                marginBottom: 24,
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
              }}
            >
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: publicTheme.subtext, marginBottom: 4 }}>
                  Select Procurement Quantity (Min: {moq}):
                </div>
                <InputNumber
                  min={moq}
                  max={10000}
                  value={quantity}
                  onChange={(val) => setQuantity(Math.max(moq, Number(val) || moq))}
                  size="large"
                  style={{ width: 140, borderRadius: 10 }}
                />
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#10b981' }}>
                  {tierCalc.discountRate > 0 ? `Tier Discount Applied: -${(tierCalc.discountRate * 100).toFixed(0)}%` : 'Standard Rate'}
                </div>
                <div style={{ fontSize: 24, fontWeight: 900, color: publicTheme.text }}>
                  {formatCurrency(tierCalc.totalPrice)}
                </div>
                <div style={{ fontSize: 11, color: publicTheme.subtext }}>
                  Unit: {formatCurrency(tierCalc.unitPrice)} • Total Savings: {formatCurrency(tierCalc.savings)}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
              <Button
                type="primary"
                size="large"
                icon={<ShoppingCartOutlined />}
                onClick={handleAddToCart}
                style={{
                  height: 48,
                  borderRadius: 14,
                  fontWeight: 800,
                  fontSize: 14,
                  flex: 1,
                  minWidth: 200,
                  background: publicTheme.primary,
                  border: 'none',
                  boxShadow: '0 8px 20px rgba(47, 111, 237, 0.3)',
                }}
              >
                Add {quantity} to Order
              </Button>

              <Button
                size="large"
                icon={<ThunderboltFilled />}
                onClick={handleBuyNow}
                style={{
                  height: 48,
                  borderRadius: 14,
                  fontWeight: 800,
                  fontSize: 14,
                  background: '#f8fafc',
                  borderColor: publicTheme.border,
                  color: publicTheme.text,
                }}
              >
                Instant Checkout
              </Button>

              <Button
                size="large"
                icon={<SendOutlined />}
                onClick={() => setTelegramModalOpen(true)}
                style={{
                  height: 48,
                  borderRadius: 14,
                  fontWeight: 700,
                  color: '#0284c7',
                  background: '#f0f9ff',
                  borderColor: '#bae6fd',
                }}
              >
                Telegram Inquiry
              </Button>
            </div>

            {/* Guarantees Strip */}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: publicTheme.subtext, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <SafetyCertificateFilled style={{ color: '#10b981' }} /> Escrow Inspection Guarantee
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <CarOutlined style={{ color: publicTheme.primary }} /> Express Regional Freight (2-4 Days)
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <FileTextOutlined style={{ color: '#ea580c' }} /> Commercial Proforma Tax Invoice Included
              </span>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Technical Specifications & Details Tabs */}
      <Card
        style={{
          borderRadius: 22,
          border: `1px solid ${publicTheme.border}`,
          marginBottom: 36,
          boxShadow: publicTheme.lightShadow,
        }}
        styles={{ body: { padding: '24px 28px' } }}
      >
        <Tabs
          defaultActiveKey="specs"
          items={[
            {
              key: 'specs',
              label: 'Technical Specifications',
              children: (
                <div>
                  <table className="b2b-spec-table">
                    <tbody>
                      <tr>
                        <td className="spec-label">Product / Model Name</td>
                        <td className="spec-val">{foundProduct.name}</td>
                      </tr>
                      <tr>
                        <td className="spec-label">Verified Manufacturer</td>
                        <td className="spec-val">{matchingShop?.name || foundProduct.brand}</td>
                      </tr>
                      <tr>
                        <td className="spec-label">Industry Classification</td>
                        <td className="spec-val">{foundProduct.category}</td>
                      </tr>
                      <tr>
                        <td className="spec-label">Minimum Order Quantity (MOQ)</td>
                        <td className="spec-val">{moq} units</td>
                      </tr>
                      <tr>
                        <td className="spec-label">Quality Standard & Compliance</td>
                        <td className="spec-val">ISO 9001:2015 / Factory Audited Batch</td>
                      </tr>
                      <tr>
                        <td className="spec-label">Fulfillment Logistics Hub</td>
                        <td className="spec-val">{foundProduct.branch || 'Phnom Penh Flagship Hub'}</td>
                      </tr>
                      <tr>
                        <td className="spec-label">Commercial Warranty</td>
                        <td className="spec-val">12 Months Manufacturer Warranty & Replacement Guarantee</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ),
            },
            {
              key: 'logistics',
              label: 'Logistics & Lead Times',
              children: (
                <div style={{ color: publicTheme.text, lineHeight: 1.7, fontSize: 13.5 }}>
                  <p><strong>Regional Hub Dispatch:</strong> Items stored locally at our Phnom Penh, Bangkok, or Rayong fulfillment facilities ship within 24 to 48 business hours.</p>
                  <p><strong>Custom OEM & Bulk Orders:</strong> Quantities exceeding 500 units are dispatched direct from manufacturer facilities with 10–14 days transit and full container tracking.</p>
                  <p><strong>FOB & CIF IncoTerms:</strong> Proforma invoices include clear customs clearance, import tax documentation, and bill of lading issuance.</p>
                </div>
              ),
            },
            {
              key: 'supplier',
              label: 'Supplier Profile & Factory Credentials',
              children: (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 14, background: publicTheme.primary, color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 18 }}>
                      {matchingShop?.name?.slice(0, 2) || 'AS'}
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: publicTheme.text }}>{matchingShop?.name}</div>
                      <div style={{ fontSize: 12, color: publicTheme.subtext }}>{matchingShop?.summary || 'Authorized B2B Supplier Partner'}</div>
                    </div>
                  </div>
                  <Button type="primary" onClick={() => navigate(`/shops/${matchingShop?.id}`)}>
                    View Supplier Storefront & Full Catalog
                  </Button>
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* Frequently Sourced Together */}
      {relatedProducts.length > 0 && (
        <div>
          <Title level={3} style={{ fontWeight: 850, color: publicTheme.text, marginBottom: 18 }}>
            Frequently Sourced Together
          </Title>
          <Row gutter={[16, 16]}>
            {relatedProducts.map((prod) => (
              <Col xs={24} sm={12} md={6} key={prod.id}>
                <RetailProductCard
                  product={prod}
                  onPreview={() => navigate(`/products/${prod.id}`)}
                  onOrder={(p) => addItem({ ...p, quantity: 1 })}
                  onWishlist={toggleWishlist}
                  isWishlisted={wishlist.some((item) => item.id === prod.id)}
                />
              </Col>
            ))}
          </Row>
        </div>
      )}

      {/* Telegram Gateway Modal */}
      <TelegramMiniAppModal
        open={telegramModalOpen}
        onClose={() => setTelegramModalOpen(false)}
        shop={matchingShop}
        product={foundProduct}
        allProducts={products}
      />
    </div>
  );
}
