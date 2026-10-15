import React, { useMemo } from 'react';
import {
  Avatar,
  Button,
  Card,
  Col,
  Flex,
  Grid,
  Input,
  Row,
  Space,
  Tag,
  Typography,
} from 'antd';
import {
  AppstoreOutlined,
  FireOutlined,
  GiftOutlined,
  RightOutlined,
  RocketOutlined,
  SearchOutlined,
  ShopOutlined,
  StarFilled,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { products, sellers, shopCategories } from '../data/shopData';
import { formatCurrency, publicTheme } from '../utils/webTheme';

const { Title, Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;

const shopTheme = {
  primary: '#ff6a1a',
  secondary: '#ff8d3a',
  soft: '#fff4eb',
  pale: '#fff9f4',
  dark: '#552100',
  border: 'rgba(255, 122, 48, 0.14)',
  shadow: '0 20px 48px rgba(255, 106, 26, 0.14)',
};

const promoCards = [
  {
    title: 'Flash deals',
    text: 'Fast discounts across top warehouse and workplace products.',
    accent: 'linear-gradient(135deg, #ff6a1a 0%, #ff8d3a 100%)',
  },
  {
    title: 'Factory direct',
    text: 'Browse supplier-led offers with more aggressive marketplace pricing.',
    accent: 'linear-gradient(135deg, #ff8447 0%, #ffb067 100%)',
  },
];

const quickChannels = [
  { title: 'New arrivals', icon: <RocketOutlined /> },
  { title: 'Hot suppliers', icon: <FireOutlined /> },
  { title: 'Bundle promos', icon: <GiftOutlined /> },
  { title: 'Shop floors', icon: <ShopOutlined /> },
  { title: 'Trending tools', icon: <ThunderboltOutlined /> },
  { title: 'All categories', icon: <AppstoreOutlined /> },
];

const MarketplaceTile = ({ product, compact = false }) => {
  const seller = sellers.find((item) => item.id === product.seller);

  return (
    <Card
      hoverable
      style={{
        borderRadius: compact ? 20 : 24,
        border: `1px solid ${shopTheme.border}`,
        background: '#ffffff',
        boxShadow: '0 10px 28px rgba(85, 33, 0, 0.06)',
        height: '100%',
        overflow: 'hidden',
      }}
      styles={{ body: { padding: compact ? 14 : 16 } }}
      cover={
        <div style={{ position: 'relative', aspectRatio: compact ? '1 / 1' : '4 / 3', background: shopTheme.pale }}>
          <img
            src={product.image}
            alt={product.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <Tag
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              margin: 0,
              borderRadius: 999,
              border: 'none',
              background: 'rgba(255,255,255,0.92)',
              color: shopTheme.primary,
              fontWeight: 700,
            }}
          >
            {product.category}
          </Tag>
        </div>
      }
    >
      <Space direction="vertical" size={compact ? 8 : 10} style={{ width: '100%' }}>
        <Title level={5} style={{ margin: 0, color: publicTheme.text, fontSize: compact ? 15 : 16, lineHeight: 1.35 }}>
          {product.name}
        </Title>
        <Flex justify="space-between" align="end" gap={10}>
          <div>
            <Text strong style={{ display: 'block', color: shopTheme.primary, fontSize: compact ? 22 : 24 }}>
              {formatCurrency(product.price)}
            </Text>
            <Text style={{ color: publicTheme.subtext, fontSize: 12 }}>{seller?.name}</Text>
          </div>
          <Tag
            style={{
              margin: 0,
              borderRadius: 999,
              border: 'none',
              background: shopTheme.soft,
              color: shopTheme.primary,
              fontWeight: 700,
            }}
          >
            {product.inStock ? 'Hot' : 'Soon'}
          </Tag>
        </Flex>
      </Space>
    </Card>
  );
};

const ShopHome = () => {
  const navigate = useNavigate();
  const screens = useBreakpoint();

  const hotProducts = useMemo(() => products.slice(0, 8), []);
  const trendProducts = useMemo(() => products.slice(4, 12), []);
  const categoryShowcase = useMemo(() => shopCategories.slice(0, 6), []);

  return (
    <div style={{ minHeight: '100vh' }}>
      <Card
        style={{
          borderRadius: 34,
          border: `1px solid ${shopTheme.border}`,
          background: 'linear-gradient(180deg, #fff7f1 0%, #fffdfb 100%)',
          boxShadow: shopTheme.shadow,
          marginBottom: 24,
          overflow: 'hidden',
        }}
        styles={{ body: { padding: screens.xs ? 18 : 24 } }}
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Flex justify="space-between" align={screens.md ? 'center' : 'flex-start'} vertical={!screens.md} gap={12}>
            <div>
              <Tag
                style={{
                  margin: 0,
                  borderRadius: 999,
                  border: 'none',
                  background: shopTheme.soft,
                  color: shopTheme.primary,
                  fontWeight: 700,
                  padding: '8px 14px',
                }}
              >
                Marketplace homepage
              </Tag>
              <Title level={1} style={{ margin: '12px 0 6px', color: shopTheme.dark, fontSize: 'clamp(32px, 5vw, 54px)', lineHeight: 1.02 }}>
                Shop with a brighter, faster discovery page.
              </Title>
              <Paragraph style={{ margin: 0, color: '#7a4b2f', maxWidth: 720, fontSize: 16 }}>
                This new Shop page is inspired by Taobao’s homepage pattern: bold search, category navigation, promotional blocks, and dense product discovery built for desktop and mobile browsing.
              </Paragraph>
            </div>
            <Space wrap>
              <Button
                type="primary"
                onClick={() => navigate('/sourcing')}
                style={{
                  height: 46,
                  borderRadius: 999,
                  background: publicTheme.ribbon,
                  border: 'none',
                  fontWeight: 700,
                }}
              >
                Open sourcing
              </Button>
              <Button
                onClick={() => navigate('/community')}
                style={{
                  height: 46,
                  borderRadius: 999,
                  borderColor: shopTheme.border,
                  color: shopTheme.primary,
                  fontWeight: 700,
                }}
              >
                See service updates
              </Button>
            </Space>
          </Flex>

          <Flex gap={12} wrap="wrap">
            <Input
              size="large"
              prefix={<SearchOutlined style={{ color: shopTheme.primary }} />}
              placeholder="Search hot products, suppliers, and category deals"
              style={{
                flex: 1,
                minWidth: screens.xs ? '100%' : 320,
                height: 52,
                borderRadius: 999,
                border: `2px solid ${shopTheme.primary}`,
                background: '#ffffff',
              }}
            />
            <Button
              type="primary"
              size="large"
              style={{
                height: 52,
                borderRadius: 999,
                paddingInline: 26,
                background: 'linear-gradient(135deg, #ff6a1a 0%, #ff914d 100%)',
                border: 'none',
                fontWeight: 800,
              }}
            >
              Search Shop
            </Button>
          </Flex>

          <div className="responsive-scroll-row">
            <Space size={10} wrap={!screens.md}>
              {quickChannels.map((item) => (
                <Button
                  key={item.title}
                  style={{
                    height: 42,
                    borderRadius: 999,
                    background: '#ffffff',
                    border: `1px solid ${shopTheme.border}`,
                    color: shopTheme.primary,
                    fontWeight: 700,
                    boxShadow: '0 8px 18px rgba(255, 106, 26, 0.08)',
                  }}
                  icon={item.icon}
                >
                  {item.title}
                </Button>
              ))}
            </Space>
          </div>
        </Space>
      </Card>

      <Row gutter={[18, 18]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={6}>
          <Card
            style={{
              height: '100%',
              borderRadius: 28,
              border: `1px solid ${shopTheme.border}`,
              background: '#ffffff',
              boxShadow: shopTheme.shadow,
            }}
            styles={{ body: { padding: 18 } }}
          >
            <Space direction="vertical" size={10} style={{ width: '100%' }}>
              <Text strong style={{ color: shopTheme.primary, fontSize: 16 }}>
                Top categories
              </Text>
              {categoryShowcase.map((category) => (
                <Flex
                  key={category.id}
                  justify="space-between"
                  align="center"
                  style={{
                    padding: '12px 14px',
                    borderRadius: 16,
                    background: shopTheme.pale,
                    border: `1px solid ${shopTheme.border}`,
                  }}
                >
                  <Space size={10}>
                    <Avatar
                      size={34}
                      style={{
                        background: 'linear-gradient(135deg, #ff6a1a 0%, #ff9e5e 100%)',
                        color: 'white',
                        fontWeight: 800,
                      }}
                    >
                      {category.icon}
                    </Avatar>
                    <div>
                      <Text strong style={{ color: publicTheme.text, display: 'block' }}>
                        {category.name}
                      </Text>
                      <Text style={{ color: publicTheme.subtext, fontSize: 12 }}>
                        {category.subcategories.length} subcategories
                      </Text>
                    </div>
                  </Space>
                  <RightOutlined style={{ color: shopTheme.primary }} />
                </Flex>
              ))}
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            style={{
              borderRadius: 30,
              border: 'none',
              background: 'linear-gradient(135deg, #ff6a1a 0%, #ff8240 48%, #ffb46f 100%)',
              boxShadow: shopTheme.shadow,
              height: '100%',
            }}
            styles={{ body: { padding: screens.xs ? 20 : 28 } }}
          >
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} md={14}>
                <Space direction="vertical" size={14}>
                  <Tag
                    style={{
                      width: 'fit-content',
                      margin: 0,
                      borderRadius: 999,
                      border: 'none',
                      background: 'rgba(255,255,255,0.18)',
                      color: 'white',
                      fontWeight: 700,
                    }}
                  >
                    Taobao-inspired promo zone
                  </Tag>
                  <Title level={2} style={{ margin: 0, color: 'white', lineHeight: 1.05 }}>
                    Big visuals, hot offers, and fast shopping entry points.
                  </Title>
                  <Paragraph style={{ margin: 0, color: 'rgba(255,255,255,0.86)', fontSize: 15 }}>
                    The center rail is designed to feel more like a vibrant marketplace homepage than a standard B2B grid, while still using your existing product catalog.
                  </Paragraph>
                  <Space wrap>
                    <Button
                      size="large"
                      style={{
                        height: 46,
                        borderRadius: 999,
                        background: '#ffffff',
                        color: shopTheme.primary,
                        border: 'none',
                        fontWeight: 800,
                      }}
                    >
                      Shop flash sale
                    </Button>
                    <Button
                      size="large"
                      style={{
                        height: 46,
                        borderRadius: 999,
                        background: 'rgba(255,255,255,0.16)',
                        color: 'white',
                        borderColor: 'rgba(255,255,255,0.28)',
                        fontWeight: 700,
                      }}
                    >
                      New arrivals
                    </Button>
                  </Space>
                </Space>
              </Col>
              <Col xs={24} md={10}>
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  {promoCards.map((item) => (
                    <div
                      key={item.title}
                      style={{
                        borderRadius: 22,
                        padding: 18,
                        background: item.accent,
                        color: 'white',
                        boxShadow: '0 16px 30px rgba(85, 33, 0, 0.14)',
                      }}
                    >
                      <Text style={{ color: 'rgba(255,255,255,0.72)' }}>{item.title}</Text>
                      <Title level={4} style={{ margin: '6px 0', color: 'white' }}>
                        {item.text}
                      </Title>
                      <Button
                        type="text"
                        style={{ color: 'white', padding: 0, fontWeight: 700 }}
                      >
                        Browse now
                      </Button>
                    </div>
                  ))}
                </Space>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} lg={6}>
          <Space direction="vertical" size={18} style={{ width: '100%' }}>
            <Card
              style={{
                borderRadius: 28,
                border: `1px solid ${shopTheme.border}`,
                background: '#ffffff',
                boxShadow: shopTheme.shadow,
              }}
              styles={{ body: { padding: 18 } }}
            >
              <Space direction="vertical" size={10} style={{ width: '100%' }}>
                <Text strong style={{ color: shopTheme.primary }}>Hot rankings</Text>
                {hotProducts.slice(0, 4).map((product, index) => (
                  <Flex key={product.id} align="center" gap={12}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: index === 0 ? shopTheme.primary : shopTheme.soft,
                        color: index === 0 ? 'white' : shopTheme.primary,
                        display: 'grid',
                        placeItems: 'center',
                        fontWeight: 800,
                      }}
                    >
                      {index + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <Text strong style={{ display: 'block', color: publicTheme.text }}>
                        {product.name}
                      </Text>
                      <Text style={{ color: publicTheme.subtext, fontSize: 12 }}>
                        {formatCurrency(product.price)}
                      </Text>
                    </div>
                  </Flex>
                ))}
              </Space>
            </Card>

            <Card
              style={{
                borderRadius: 28,
                border: `1px solid ${shopTheme.border}`,
                background: 'linear-gradient(135deg, #fff3e8 0%, #fffaf5 100%)',
                boxShadow: shopTheme.shadow,
              }}
              styles={{ body: { padding: 18 } }}
            >
              <Space direction="vertical" size={10} style={{ width: '100%' }}>
                <Text strong style={{ color: shopTheme.primary }}>Seller spotlight</Text>
                {sellers.slice(0, 3).map((seller) => (
                  <Flex key={seller.id} justify="space-between" align="center">
                    <div>
                      <Text strong style={{ display: 'block', color: publicTheme.text }}>
                        {seller.name}
                      </Text>
                      <Text style={{ color: publicTheme.subtext, fontSize: 12 }}>
                        {seller.branch}
                      </Text>
                    </div>
                    <Space size={4}>
                      <StarFilled style={{ color: '#ff9b44' }} />
                      <Text strong style={{ color: shopTheme.primary }}>{seller.rating}</Text>
                    </Space>
                  </Flex>
                ))}
              </Space>
            </Card>
          </Space>
        </Col>
      </Row>

      <Card
        style={{
          borderRadius: 30,
          border: `1px solid ${shopTheme.border}`,
          background: '#ffffff',
          boxShadow: shopTheme.shadow,
          marginBottom: 24,
        }}
        styles={{ body: { padding: screens.xs ? 18 : 24 } }}
      >
        <Flex justify="space-between" align={screens.xs ? 'flex-start' : 'center'} vertical={screens.xs} gap={10} style={{ marginBottom: 18 }}>
          <div>
            <Title level={3} style={{ margin: 0, color: publicTheme.text }}>
              Flash sale picks
            </Title>
            <Paragraph style={{ margin: '6px 0 0', color: publicTheme.subtext }}>
              Denser, promotion-led cards inspired by major marketplace homepages.
            </Paragraph>
          </div>
          <Button
            type="link"
            onClick={() => navigate('/sourcing')}
            style={{ color: shopTheme.primary, fontWeight: 700, padding: 0 }}
          >
            Go to sourcing <RightOutlined />
          </Button>
        </Flex>

        <Row gutter={[16, 16]}>
          {hotProducts.map((product) => (
            <Col xs={12} md={8} xl={6} key={product.id}>
              <MarketplaceTile product={product} compact />
            </Col>
          ))}
        </Row>
      </Card>

      <Row gutter={[18, 18]} style={{ marginBottom: 24 }}>
        {categoryShowcase.map((category) => (
          <Col xs={24} md={12} xl={8} key={category.id}>
            <Card
              style={{
                borderRadius: 28,
                border: `1px solid ${shopTheme.border}`,
                background: '#ffffff',
                boxShadow: '0 10px 28px rgba(85, 33, 0, 0.06)',
                height: '100%',
              }}
              styles={{ body: { padding: 22 } }}
            >
              <Space direction="vertical" size={14} style={{ width: '100%' }}>
                <Flex justify="space-between" align="center">
                  <Space size={12}>
                    <Avatar
                      size={42}
                      style={{
                        background: 'linear-gradient(135deg, #ff6a1a 0%, #ff9f5f 100%)',
                        color: 'white',
                        fontWeight: 800,
                      }}
                    >
                      {category.icon}
                    </Avatar>
                    <div>
                      <Title level={4} style={{ margin: 0, color: publicTheme.text }}>
                        {category.name}
                      </Title>
                      <Text style={{ color: publicTheme.subtext }}>
                        {category.subcategories.map((item) => item.name).join(' • ')}
                      </Text>
                    </div>
                  </Space>
                </Flex>

                <Row gutter={[12, 12]}>
                  {products
                    .filter((product) => product.category === category.id)
                    .slice(0, 2)
                    .map((product) => (
                      <Col span={12} key={product.id}>
                        <div
                          style={{
                            borderRadius: 18,
                            overflow: 'hidden',
                            border: `1px solid ${shopTheme.border}`,
                            background: shopTheme.pale,
                          }}
                        >
                          <div style={{ aspectRatio: '1 / 1' }}>
                            <img
                              src={product.image}
                              alt={product.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </div>
                          <div style={{ padding: 10 }}>
                            <Text strong style={{ display: 'block', color: publicTheme.text, fontSize: 13 }}>
                              {product.name}
                            </Text>
                            <Text style={{ color: shopTheme.primary, fontWeight: 700 }}>
                              {formatCurrency(product.price)}
                            </Text>
                          </div>
                        </div>
                      </Col>
                    ))}
                </Row>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <Card
        style={{
          borderRadius: 30,
          border: `1px solid ${shopTheme.border}`,
          background: '#ffffff',
          boxShadow: shopTheme.shadow,
        }}
        styles={{ body: { padding: screens.xs ? 18 : 24 } }}
      >
        <Flex justify="space-between" align={screens.xs ? 'flex-start' : 'center'} vertical={screens.xs} gap={10} style={{ marginBottom: 18 }}>
          <div>
            <Title level={3} style={{ margin: 0, color: publicTheme.text }}>
              Guess you like
            </Title>
            <Paragraph style={{ margin: '6px 0 0', color: publicTheme.subtext }}>
              A larger recommendation grid for a more marketplace-style homepage finish.
            </Paragraph>
          </div>
          <Tag
            style={{
              margin: 0,
              borderRadius: 999,
              border: 'none',
              background: shopTheme.soft,
              color: shopTheme.primary,
              fontWeight: 700,
              padding: '6px 12px',
            }}
          >
            Responsive product wall
          </Tag>
        </Flex>

        <Row gutter={[16, 16]}>
          {trendProducts.map((product) => (
            <Col xs={24} sm={12} lg={8} xl={6} key={product.id}>
              <MarketplaceTile product={product} />
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  );
};

export default ShopHome;
