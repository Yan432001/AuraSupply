import React, { useState } from 'react';
import {
  Typography,
  Row,
  Col,
  Button,
  Grid,
  Collapse,
  message,
} from 'antd';
import {
  SendOutlined,
  CoffeeOutlined,
  ShopOutlined,
  ThunderboltOutlined,
  CheckCircleFilled,
  SafetyCertificateFilled,
  PhoneOutlined,
  FireOutlined,
  TeamOutlined,
  CustomerServiceOutlined,
  ClockCircleOutlined,
  AuditOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { publicTheme } from '../../utils/webTheme';

const { Title, Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;

// Core Hospitality Services Data
const servicesList = [
  {
    id: 'emenu-deployment',
    icon: <SendOutlined style={{ fontSize: 24, color: publicTheme.primary }} />,
    category: 'Digital Hospitality',
    badge: 'Flagship Solution',
    title: 'Telegram Mini App & E-Menu Deployment',
    tagline: 'Turnkey contactless dining, table QR ordering & automated kitchen group dispatch',
    description:
      'We configure, brand, and launch customized Telegram Mini Apps and web E-Menus for your café, bakery, or dining hub. Guests browse high-resolution dishes, specify dietary preferences, and place orders directly from their phones with sub-second kitchen ticket delivery.',
    deliverables: [
      'Custom Telegram Bot setup via @BotFather with deep-link ordering (/start shop_slug)',
      'Table QR code standees with table-specific fulfillment routing and instant bill splitting',
      'Instant kitchen group order notifications pushed directly to staff Telegram channels',
      'Integrated promo code engine (VIP codes, first-order vouchers, happy-hour specials)',
    ],
    highlight: 'Zero hardware overhead. Launch in less than 48 hours with guaranteed 99.9% uptime.',
    cta: 'Deploy E-Menu Bot',
    samplePreview: {
      title: '☕ Aura Coffee Kitchen Group',
      badge: 'Telegram Bot Live',
      orderId: 'TMA-918240',
      customer: 'Elena Rostova',
      table: 'Table #04 · Dine-In',
      items: [
        { name: '2x Spanish Iced Latte (Oat Milk)', price: '$8.50' },
        { name: '1x Golden Almond Croissant', price: '$3.75' },
      ],
      total: '$12.25',
    },
  },
  {
    id: 'coffee-wholesale',
    icon: <CoffeeOutlined style={{ fontSize: 24, color: publicTheme.accent }} />,
    category: 'Roastery & Sourcing',
    badge: 'Direct-Trade Certified',
    title: 'Specialty Coffee Wholesale & Custom Roasting',
    tagline: 'Ethically sourced highland beans with tailored roast curves and barista calibration',
    description:
      'Supply your business with single-origin Arabica and bold highland Robusta sourced directly from ethical smallholder farms in Mondulkiri and Da Lat. We develop bespoke roast profiles tailored to your signature espresso recipes and milk pairings.',
    deliverables: [
      'Weekly freshly roasted coffee bean shipments packed with one-way degassing valves',
      'Customized roast profiling (Filter, Medium Balanced, Dark Traditional French)',
      'Commercial espresso machine calibration, grinder burr servicing & water filtration testing',
      'Staff cupping sessions, extraction yield optimization & certified latte art training',
    ],
    highlight: 'Cupping score 84+ specialty grade with full farm-gate transparency and lot traceability.',
    cta: 'Request Cupping Samples',
    samplePreview: {
      title: '☕ Mondulkiri Peaberry Specialty Batch',
      badge: 'SCA 86.5 Pts',
      orderId: 'LOT-MD-2026',
      customer: 'Direct-Trade Partner',
      table: 'Elevation: 1,100 MASL · Natural Anaerobic',
      items: [
        { name: 'Tasting Notes: Wild Honey, Blood Orange, Jasmine', price: 'Light-Medium' },
        { name: 'Roaster: Giesen W15A Profile #08 (Agtron 64/78)', price: 'Ready' },
      ],
      total: 'Weekly Standing: 30 kg',
    },
  },
  {
    id: 'bakery-supply',
    icon: <FireOutlined style={{ fontSize: 24, color: publicTheme.accent }} />,
    category: 'Artisan Baking',
    badge: 'Fresh Daily Pre-Dawn',
    title: 'Wholesale Artisan Bakery & Viennoiserie',
    tagline: '72-hour naturally fermented sourdough & pure French butter viennoiserie',
    description:
      'Elevate your brunch or coffee menu with fresh artisan bakery goods handcrafted pre-dawn every morning. Rolled exclusively with pure 84% French butter, our viennoiserie provides golden crispness and airy honeycomb interiors.',
    deliverables: [
      'Daily morning deliveries in temperature-controlled bakery transport crates before 6:30 AM',
      'Rustic country sourdough boules, seeded sourdough batards, and French baguettes',
      'Flaky butter croissants, pain au chocolat, almond twists, and seasonal fruit danishes',
      'Wholesale tiered pricing with flexible standing schedules and seasonal rotation',
    ],
    highlight: 'Zero artificial preservatives or chemical dough conditioners. 100% real butter.',
    cta: 'View Bakery Wholesale Menu',
    samplePreview: {
      title: '🥐 Daily Viennoiserie Morning Route',
      badge: 'Pre-Dawn Dispatch',
      orderId: 'ROUTE-AM-04',
      customer: 'Aura Bistro & Partner Cafés',
      table: 'Temperature-Controlled Van #2 · 05:45 AM',
      items: [
        { name: '45x French Butter Croissant (Normandy 84%)', price: 'Freshly Baked' },
        { name: '20x Country Sourdough Loaves (72h Ferment)', price: 'Crispy Crust' },
      ],
      total: 'Total Batch: 65 Units',
    },
  },
  {
    id: 'kds-pos',
    icon: <ThunderboltOutlined style={{ fontSize: 24, color: publicTheme.primary }} />,
    category: 'Operations & Tech',
    badge: 'Real-Time Sync',
    title: 'Kitchen Display System & POS Integration',
    tagline: 'Streamline kitchen ticket pacing, inventory depletion & multi-station routing',
    description:
      'Replace lost paper slips with an intuitive digital Kitchen Display System (KDS). Kitchen and bar teams manage ticket pacing across distinct lifecycle stages with automatic audio chimes and status updates pushed back to guests.',
    deliverables: [
      'Multi-station ticket routing (Barista Bar, Bakery Prep, Kitchen Cook Line)',
      'Step-by-step order lifecycle: Pending → Confirmed → Preparing → Ready → Completed',
      'Offline resilience: orders queue locally and auto-sync when connection restores',
      'Thermal receipt printer integration, table QR billing, and digital cloud audit logs',
    ],
    highlight: 'Reduces ticket errors by up to 94% during peak rush hours with zero lost dockets.',
    cta: 'Inquire About KDS & POS',
    samplePreview: {
      title: '👨‍🍳 Live Kitchen Display System',
      badge: 'Station: Barista Bar',
      orderId: 'KDS-TICKET-304',
      customer: 'Dine-In Guest · Table #08',
      table: 'Ticket Age: 1m 45s (Target: < 4m)',
      items: [
        { name: '1x Flat White (Double Ristretto / Oat)', price: 'In Prep' },
        { name: '1x Cold Brew Tonic w/ Orange Slice', price: 'Ready' },
      ],
      total: 'Status: Preparing (92% SLA)',
    },
  },
  {
    id: 'catering-events',
    icon: <TeamOutlined style={{ fontSize: 24, color: publicTheme.secondary }} />,
    category: 'Events & Concierge',
    badge: 'Turnkey Experience',
    title: 'Private Catering & Mobile Espresso Bars',
    tagline: 'Full-service pop-up coffee bars and artisan pastry grazing tables for corporate summits',
    description:
      'Bring the complete Aura specialty coffee and bakery experience to corporate summits, product launches, diplomatic receptions, and private celebrations. Our certified baristas deliver craft espresso and curated pastry displays at event scale.',
    deliverables: [
      'Sleek mobile espresso carts equipped with commercial dual-boiler machines & grinders',
      'Artisan pastry grazing tables with customized wooden risers, florals, and rustic signage',
      'Custom branded cup sleeves, menu boards, and dedicated attendee Telegram order links',
      'Dedicated professional barista team and friendly hospitality service crew',
    ],
    highlight: 'Scalable service for VIP gatherings from 30 guests to large-scale conferences of 1,500+.',
    cta: 'Book Event Catering',
    samplePreview: {
      title: '🎪 Aura Mobile Espresso Cart #1',
      badge: 'Live Pop-Up Bar',
      orderId: 'EVENT-TECH-SUMMIT',
      customer: 'Enterprise Conference (500 pax)',
      table: 'Setup: Dual Carts · 4 Baristas',
      items: [
        { name: 'Custom Branded Espresso & Flat White Bar', price: 'Unlimited' },
        { name: 'Bespoke Mini Croissant & Danish Grazing Bar', price: '300 pcs' },
      ],
      total: 'Guest Rating: 5.0 ★',
    },
  },
  {
    id: 'franchise-support',
    icon: <ShopOutlined style={{ fontSize: 24, color: publicTheme.primary }} />,
    category: 'Franchise & Growth',
    badge: 'Enterprise SLA',
    title: 'Multi-Store Partner Onboarding & 24/7 SLA',
    tagline: 'End-to-end multi-store digital transformation, menu digitization & dedicated support',
    description:
      'For hospitality groups, hotel lounges, and multi-branch franchise operators, Aura Global provides comprehensive tenant onboarding, menu digitization, staff training, and dedicated enterprise support with guaranteed resolution SLAs.',
    deliverables: [
      'Complete menu digitization with high-definition styling and ingredient tags',
      'Role-based permissions (Cashier, Line Cook, Barista, Floor Manager, Auditor)',
      'Multi-branch consolidated sales reports and real-time inventory depletion tracking',
      'Dedicated 24/7 Telegram support channel and priority engineer escalation SLA',
    ],
    highlight: 'Dedicated account manager, regular cupping checks, and quarterly menu performance reviews.',
    cta: 'Partner With Aura Global',
    samplePreview: {
      title: '🏢 Multi-Branch Hospitality Network',
      badge: 'Enterprise SLA',
      orderId: 'SLA-ACTIVE-409',
      customer: 'Multi-Store Operator Hub',
      table: 'Branches: 4 Locations Active',
      items: [
        { name: 'Consolidated Daily Sales Sync', price: '$4,820.00' },
        { name: 'Technical Support Response SLA', price: '< 15 mins' },
      ],
      total: 'System Health: 100% Normal',
    },
  },
];

// FAQs Data
const faqItems = [
  {
    key: '1',
    label: (
      <span style={{ fontSize: 15, fontWeight: 700, color: publicTheme.text }}>
        How quickly can our restaurant or café launch with the Telegram E-Menu?
      </span>
    ),
    children: (
      <Paragraph style={{ color: publicTheme.subtext, margin: 0, lineHeight: 1.6 }}>
        Most partners are fully operational within 24 to 48 hours. Our technical team digitizes your menu,
        configures your Telegram bot credentials with @BotFather, connects your kitchen notification staff
        channel, and provides print-ready QR standees with table numbering.
      </Paragraph>
    ),
  },
  {
    key: '2',
    label: (
      <span style={{ fontSize: 15, fontWeight: 700, color: publicTheme.text }}>
        How do kitchen teams receive incoming orders from Telegram?
      </span>
    ),
    children: (
      <Paragraph style={{ color: publicTheme.subtext, margin: 0, lineHeight: 1.6 }}>
        Orders trigger formatted alerts directly into your private staff Telegram channel (complete with
        customer name, table number, order items, special preparation notes, and totals). Concurrently,
        orders appear in real time on your web Kitchen Display System (KDS) and trigger audio chimes.
      </Paragraph>
    ),
  },
  {
    key: '3',
    label: (
      <span style={{ fontSize: 15, fontWeight: 700, color: publicTheme.text }}>
        What is the minimum order quantity for wholesale coffee beans and bakery items?
      </span>
    ),
    children: (
      <Paragraph style={{ color: publicTheme.subtext, margin: 0, lineHeight: 1.6 }}>
        For specialty coffee beans, our minimum standing wholesale order is 5 kg per week with volume tiered
        discounts starting at 20 kg. For bakery items, our minimum daily standing order is 15 viennoiserie
        pieces or 5 sourdough loaves, delivered fresh pre-dawn before 6:30 AM.
      </Paragraph>
    ),
  },
  {
    key: '4',
    label: (
      <span style={{ fontSize: 15, fontWeight: 700, color: publicTheme.text }}>
        What happens if our internet connection drops during peak dining hours?
      </span>
    ),
    children: (
      <Paragraph style={{ color: publicTheme.subtext, margin: 0, lineHeight: 1.6 }}>
        The Aura hospitality portal features offline-tolerant caching. Floor staff and table menus continue
        functioning smoothly, and all completed tickets automatically sync with our cloud backend as soon as
        connectivity restores.
      </Paragraph>
    ),
  },
  {
    key: '5',
    label: (
      <span style={{ fontSize: 15, fontWeight: 700, color: publicTheme.text }}>
        Can we book a tasting session for wholesale beans and bakery products?
      </span>
    ),
    children: (
      <Paragraph style={{ color: publicTheme.subtext, margin: 0, lineHeight: 1.6 }}>
        Yes! We host weekly cupping sessions and pastry tastings at our Daun Penh Roastery &amp; Test Kitchen.
        You can request a complimentary sample tasting box or visit us by submitting the inquiry form below.
      </Paragraph>
    ),
  },
];

export default function Service() {
  const screens = useBreakpoint();
  const navigate = useNavigate();

  const [selectedService, setSelectedService] = useState('emenu-deployment');
  const [formService, setFormService] = useState('Telegram Mini App & E-Menu Deployment');
  const [businessName, setBusinessName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [branchCount, setBranchCount] = useState('1 Branch');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const activeServiceObj =
    servicesList.find((s) => s.id === selectedService) || servicesList[0];

  const handleSelectServiceForForm = (serviceTitle) => {
    setFormService(serviceTitle);
    const formEl = document.getElementById('inquiry-form-section');
    if (formEl) {
      formEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSubmitInquiry = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const messageContent = `[SERVICE INQUIRY: ${formService}]
Business: ${businessName}
Contact: ${contactName}
Phone: ${phone}
Branches: ${branchCount}
Details: ${details}`;

      const res = await axios.post('/api/cms/inquiries', {
        name: `${contactName} (${businessName})`,
        email,
        message: messageContent,
      });

      if (res.data?.status || res.status === 200) {
        setSubmitted(true);
        message.success('Thank you! Your service inquiry has been submitted to our team.');
        setBusinessName('');
        setContactName('');
        setEmail('');
        setPhone('');
        setDetails('');
      } else {
        message.error('Could not submit inquiry. Please try again.');
      }
    } catch (err) {
      message.error(err.response?.data?.error || err.message || 'Error sending inquiry');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ width: '100%', paddingBottom: 48 }}>
      
      {/* ======================================================== */}
      {/* 1. FULL-SCREEN HERO BANNER (100% WIDTH, HOME PAGE STYLE) */}
      {/* ======================================================== */}
      <div
        className="stagger-rise"
        style={{
          width: '100%',
          borderRadius: 28,
          background: publicTheme.heroBackground,
          border: `1px solid ${publicTheme.border}`,
          boxShadow: publicTheme.shadow,
          position: 'relative',
          overflow: 'hidden',
          padding: screens.xs ? '32px 18px' : screens.md ? '48px 36px' : '56px 44px',
          marginBottom: 36,
        }}
      >
        {/* Ambient background glows matching Home */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            width: 480,
            height: 480,
            top: -120,
            right: -100,
            background: publicTheme.primary,
            borderRadius: '50%',
            filter: 'blur(90px)',
            opacity: 0.12,
            pointerEvents: 'none',
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            width: 420,
            height: 420,
            bottom: -100,
            left: '20%',
            background: publicTheme.accent,
            borderRadius: '50%',
            filter: 'blur(90px)',
            opacity: 0.1,
            pointerEvents: 'none',
          }}
        />

        <Row gutter={[40, 36]} align="middle" style={{ position: 'relative', zIndex: 1 }}>
          {/* Left Hero Content */}
          <Col xs={24} lg={13}>
            {/* Header Kicker matching Home */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: publicTheme.primary,
                  boxShadow: `0 0 10px ${publicTheme.primary}`,
                }}
              />
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  color: publicTheme.primary,
                  textTransform: 'uppercase',
                }}
              >
                Enterprise Services Portfolio
              </span>
            </div>

            {/* Main Title */}
            <Title
              level={1}
              style={{
                color: publicTheme.text,
                fontSize: screens.xs ? 28 : screens.md ? 42 : 50,
                fontWeight: 800,
                lineHeight: 1.15,
                letterSpacing: '-0.02em',
                marginBottom: 16,
              }}
            >
              End-to-End <span style={{ color: publicTheme.primary }}>Hospitality</span> &amp;{' '}
              <span style={{ color: publicTheme.accent }}>Supply</span> Solutions
            </Title>

            {/* Subtitle Paragraph */}
            <Paragraph
              style={{
                color: publicTheme.subtext,
                fontSize: screens.xs ? 14 : 16,
                lineHeight: 1.6,
                maxWidth: 680,
                marginBottom: 24,
              }}
            >
              Select any service pillar below to view technical deliverables, turnaround times, and wholesale terms.
              From contactless Telegram Mini App E-Menus to specialty coffee roastery sourcing, daily wholesale viennoiserie, and turnkey event catering.
            </Paragraph>

            {/* Action Buttons matching Home */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 32 }}>
              <Button
                type="primary"
                size="large"
                icon={<SendOutlined />}
                onClick={() => handleSelectServiceForForm('General Hospitality Consultation')}
                style={{
                  height: 46,
                  width: screens.xs ? '100%' : 'auto',
                  borderRadius: 14,
                  background: publicTheme.primary,
                  borderColor: publicTheme.primary,
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: screens.xs ? 13 : 14,
                  paddingInline: 24,
                  boxShadow: '0 10px 24px rgba(47, 111, 237, 0.28)',
                }}
              >
                Request Service Proposal
              </Button>
              <Button
                size="large"
                icon={<ShopOutlined />}
                onClick={() => navigate('/shop/sbc-store')}
                style={{
                  height: 46,
                  width: screens.xs ? '100%' : 'auto',
                  borderRadius: 14,
                  background: '#ffffff',
                  borderColor: publicTheme.accent,
                  color: publicTheme.accent,
                  fontWeight: 700,
                  fontSize: screens.xs ? 13 : 14,
                  paddingInline: 24,
                }}
              >
                Explore Live E-Menu
              </Button>
            </div>

            {/* Quick Metrics Bar matching Home style */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: screens.xs ? 14 : 28,
                paddingTop: 22,
                borderTop: `1px solid ${publicTheme.softBorder}`,
              }}
            >
              <div>
                <div style={{ fontSize: screens.xs ? 18 : 22, fontWeight: 800, color: publicTheme.text }}>
                  48 Hours
                </div>
                <div style={{ fontSize: 11, color: publicTheme.subtext }}>Turnkey Setup</div>
              </div>
              <div style={{ width: 1, height: 28, background: publicTheme.softBorder }} />
              <div>
                <div style={{ fontSize: screens.xs ? 18 : 22, fontWeight: 800, color: publicTheme.primary }}>
                  84+ SCA
                </div>
                <div style={{ fontSize: 11, color: publicTheme.subtext }}>Specialty Cupping</div>
              </div>
              <div style={{ width: 1, height: 28, background: publicTheme.softBorder }} />
              <div>
                <div style={{ fontSize: screens.xs ? 18 : 22, fontWeight: 800, color: publicTheme.accent }}>
                  72 Hours
                </div>
                <div style={{ fontSize: 11, color: publicTheme.subtext }}>Cold Ferment Sourdough</div>
              </div>
              <div style={{ width: 1, height: 28, background: publicTheme.softBorder }} />
              <div>
                <div style={{ fontSize: screens.xs ? 18 : 22, fontWeight: 800, color: publicTheme.success }}>
                  99.9%
                </div>
                <div style={{ fontSize: 11, color: publicTheme.subtext }}>Ticket Dispatch SLA</div>
              </div>
            </div>
          </Col>

          {/* Right Hero Preview Card (Interactive Operations Terminal) */}
          <Col xs={24} lg={11}>
            <div
              style={{
                borderRadius: 24,
                background: 'rgba(255, 255, 255, 0.95)',
                border: `1px solid ${publicTheme.border}`,
                padding: screens.xs ? 20 : 26,
                backdropFilter: 'blur(20px)',
                boxShadow: publicTheme.lightShadow,
              }}
            >
              {/* Terminal Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: 14,
                  borderBottom: `1px solid ${publicTheme.softBorder}`,
                  marginBottom: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: 'rgba(47, 111, 237, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: `1px solid ${publicTheme.softBorder}`,
                    }}
                  >
                    {activeServiceObj.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: publicTheme.text }}>
                      {activeServiceObj.samplePreview.title}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: publicTheme.success,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: publicTheme.success,
                        }}
                      />
                      {activeServiceObj.samplePreview.badge}
                    </div>
                  </div>
                </div>

                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: 999,
                    background: 'rgba(47, 111, 237, 0.1)',
                    color: publicTheme.primary,
                  }}
                >
                  Live Feed
                </span>
              </div>

              {/* Operations Terminal Receipt / Card Body */}
              <div
                style={{
                  background: 'rgba(240, 244, 255, 0.85)',
                  borderRadius: 16,
                  padding: 18,
                  border: `1px solid ${publicTheme.softBorder}`,
                  fontFamily: 'monospace',
                  fontSize: 12,
                  lineHeight: 1.6,
                  color: publicTheme.text,
                }}
              >
                <div style={{ color: publicTheme.primary, fontWeight: 'bold', marginBottom: 6 }}>
                  🔔 LIVE RECORD #{activeServiceObj.samplePreview.orderId}
                </div>
                <div>👤 Recipient: {activeServiceObj.samplePreview.customer}</div>
                <div>📍 Destination: {activeServiceObj.samplePreview.table}</div>
                <div style={{ margin: '8px 0', borderTop: `1px dashed ${publicTheme.softBorder}` }} />
                {activeServiceObj.samplePreview.items.map((it, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '2px 0',
                    }}
                  >
                    <span>{it.name}</span>
                    <span style={{ fontWeight: 'bold' }}>{it.price}</span>
                  </div>
                ))}
                <div style={{ margin: '8px 0', borderTop: `1px solid ${publicTheme.softBorder}` }} />
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    color: publicTheme.primary,
                    fontWeight: 'bold',
                  }}
                >
                  <span>STATUS SUMMARY:</span>
                  <span>{activeServiceObj.samplePreview.total}</span>
                </div>
              </div>

              {/* Action */}
              <div style={{ marginTop: 16 }}>
                <Button
                  block
                  type="primary"
                  onClick={() => handleSelectServiceForForm(activeServiceObj.title)}
                  style={{
                    height: 42,
                    borderRadius: 12,
                    background: publicTheme.primary,
                    fontWeight: 700,
                    fontSize: 12,
                  }}
                >
                  Book Consultation for {activeServiceObj.category}
                </Button>
              </div>
            </div>
          </Col>
        </Row>
      </div>

      {/* ======================================================== */}
      {/* 2. FULL-SCREEN SERVICE PILLARS PORTFOLIO                 */}
      {/* ======================================================== */}
      <div style={{ width: '100%', marginBottom: 36 }}>
        
        {/* Section Heading */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: publicTheme.primary,
                }}
              />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: publicTheme.primary,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                Enterprise Services Portfolio
              </span>
            </div>
            <Title
              level={2}
              style={{
                fontSize: screens.xs ? 22 : 28,
                fontWeight: 800,
                color: publicTheme.text,
                margin: 0,
                letterSpacing: '-0.01em',
              }}
            >
              End-to-End Hospitality &amp; Supply Solutions
            </Title>
          </div>
          <Text style={{ color: publicTheme.subtext, fontSize: 13, maxWidth: 540 }}>
            Select any service pillar below to view technical deliverables, turnaround times, and wholesale terms.
          </Text>
        </div>

        {/* 6 Full-Width Service Selector Cards */}
        <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
          {servicesList.map((srv) => {
            const isSelected = selectedService === srv.id;
            return (
              <Col xs={12} sm={8} lg={4} key={srv.id}>
                <div
                  onClick={() => setSelectedService(srv.id)}
                  style={{
                    background: isSelected ? publicTheme.primary : '#ffffff',
                    border: `1px solid ${isSelected ? publicTheme.primary : publicTheme.border}`,
                    borderRadius: 18,
                    padding: '16px 14px',
                    height: '100%',
                    cursor: 'pointer',
                    boxShadow: isSelected
                      ? '0 10px 24px rgba(47, 111, 237, 0.28)'
                      : '0 4px 12px rgba(47, 111, 237, 0.05)',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: isSelected ? 'rgba(255,255,255,0.2)' : 'rgba(47, 111, 237, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 10,
                      }}
                    >
                      {React.cloneElement(srv.icon, {
                        style: {
                          fontSize: 18,
                          color: isSelected ? '#ffffff' : publicTheme.primary,
                        },
                      })}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: isSelected ? 'rgba(255,255,255,0.85)' : publicTheme.accent,
                        letterSpacing: '0.04em',
                      }}
                    >
                      {srv.category}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: isSelected ? '#ffffff' : publicTheme.text,
                        lineHeight: 1.3,
                        marginTop: 4,
                      }}
                    >
                      {srv.title.split('&')[0]}
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      marginTop: 12,
                      color: isSelected ? 'rgba(255,255,255,0.9)' : publicTheme.subtext,
                    }}
                  >
                    {srv.badge}
                  </div>
                </div>
              </Col>
            );
          })}
        </Row>

        {/* Selected Service Detailed Showcase Card (100% Full-Width) */}
        <div
          style={{
            width: '100%',
            background: publicTheme.cardBackground,
            borderRadius: 24,
            border: `1px solid ${publicTheme.border}`,
            padding: screens.xs ? 20 : screens.md ? 32 : 40,
            backdropFilter: 'blur(20px)',
            boxShadow: publicTheme.shadow,
          }}
        >
          {/* Card Top Title Row */}
          <div
            style={{
              display: 'flex',
              flexDirection: screens.xs ? 'column' : 'row',
              justifyContent: 'space-between',
              alignItems: screens.xs ? 'flex-start' : 'center',
              gap: 16,
              paddingBottom: 20,
              borderBottom: `1px solid ${publicTheme.softBorder}`,
              marginBottom: 24,
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    padding: '3px 10px',
                    borderRadius: 999,
                    background: publicTheme.pill,
                    color: publicTheme.primary,
                  }}
                >
                  {activeServiceObj.category}
                </span>
                <span style={{ fontSize: 12, color: publicTheme.subtext, fontWeight: 600 }}>
                  • {activeServiceObj.badge}
                </span>
              </div>
              <Title level={3} style={{ color: publicTheme.text, margin: 0, fontWeight: 800 }}>
                {activeServiceObj.title}
              </Title>
              <Text style={{ color: publicTheme.subtext, fontSize: 14 }}>
                {activeServiceObj.tagline}
              </Text>
            </div>

            <Button
              type="primary"
              onClick={() => handleSelectServiceForForm(activeServiceObj.title)}
              style={{
                height: 44,
                borderRadius: 14,
                background: publicTheme.primary,
                borderColor: publicTheme.primary,
                fontWeight: 700,
                paddingInline: 22,
                boxShadow: '0 8px 20px rgba(47, 111, 237, 0.24)',
              }}
            >
              {activeServiceObj.cta} →
            </Button>
          </div>

          {/* Card Inner Columns */}
          <Row gutter={[36, 24]}>
            <Col xs={24} lg={15}>
              <Paragraph style={{ color: publicTheme.text, fontSize: 15, lineHeight: 1.65 }}>
                {activeServiceObj.description}
              </Paragraph>

              <div style={{ marginTop: 20 }}>
                <Text
                  strong
                  style={{
                    display: 'block',
                    fontSize: 12,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: publicTheme.primary,
                    marginBottom: 12,
                  }}
                >
                  Key Scope &amp; Deliverables:
                </Text>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {activeServiceObj.deliverables.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                        fontSize: 13.5,
                        color: publicTheme.text,
                      }}
                    >
                      <CheckCircleFilled style={{ color: publicTheme.primary, marginTop: 3, flexShrink: 0 }} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Col>

            <Col xs={24} lg={9}>
              <div
                style={{
                  background: publicTheme.cardMuted,
                  borderRadius: 20,
                  border: `1px solid ${publicTheme.softBorder}`,
                  padding: 24,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <SafetyCertificateFilled style={{ color: publicTheme.accent, fontSize: 18 }} />
                    <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: publicTheme.text }}>
                      Service Guarantee
                    </span>
                  </div>

                  <p style={{ fontSize: 13, color: publicTheme.subtext, lineHeight: 1.55, margin: 0 }}>
                    {activeServiceObj.highlight}
                  </p>

                  <div
                    style={{
                      marginTop: 18,
                      paddingTop: 16,
                      borderTop: `1px solid ${publicTheme.softBorder}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                      fontSize: 12,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: publicTheme.subtext }}>Response SLA:</span>
                      <span style={{ fontWeight: 700, color: publicTheme.text }}>Under 2 Hours</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: publicTheme.subtext }}>Initial Audit:</span>
                      <span style={{ fontWeight: 700, color: publicTheme.success }}>Complimentary</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: publicTheme.subtext }}>Support Channels:</span>
                      <span style={{ fontWeight: 700, color: publicTheme.primary }}>Telegram Bot &amp; On-Site</span>
                    </div>
                  </div>
                </div>

                <Button
                  block
                  type="default"
                  onClick={() => handleSelectServiceForForm(activeServiceObj.title)}
                  style={{
                    marginTop: 20,
                    height: 42,
                    borderRadius: 12,
                    borderColor: publicTheme.primary,
                    color: publicTheme.primary,
                    fontWeight: 700,
                  }}
                >
                  Book Initial Consultation
                </Button>
              </div>
            </Col>
          </Row>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. FULL-SCREEN INQUIRY & COLLABORATION PROPOSAL FORM     */}
      {/* ======================================================== */}
      <div
        id="inquiry-form-section"
        style={{
          width: '100%',
          background: publicTheme.cardBackground,
          borderRadius: 24,
          border: `1px solid ${publicTheme.border}`,
          padding: screens.xs ? 20 : screens.md ? 32 : 40,
          backdropFilter: 'blur(20px)',
          boxShadow: publicTheme.shadow,
          marginBottom: 36,
        }}
      >
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '5px 14px',
              borderRadius: 999,
              background: publicTheme.pill,
              marginBottom: 10,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: publicTheme.accent,
              }}
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: publicTheme.accent,
                textTransform: 'uppercase',
              }}
            >
              Start Collaboration
            </span>
          </div>
          <Title level={2} style={{ fontSize: screens.xs ? 22 : 30, fontWeight: 800, color: publicTheme.text, margin: 0 }}>
            Request a Hospitality Service Proposal
          </Title>
          <Paragraph style={{ color: publicTheme.subtext, fontSize: 14, marginTop: 6, margin: 0 }}>
            Tell us about your café, bakery, or dining establishment. Our team will prepare a tailored proposal within one business day.
          </Paragraph>
        </div>

        {submitted ? (
          <div
            style={{
              background: 'rgba(34, 197, 94, 0.08)',
              border: '1px solid rgba(34, 197, 94, 0.25)',
              borderRadius: 20,
              padding: 36,
              textAlign: 'center',
            }}
          >
            <CheckCircleFilled style={{ color: publicTheme.success, fontSize: 44, marginBottom: 12 }} />
            <Title level={4} style={{ color: publicTheme.text, margin: 0 }}>
              Inquiry Successfully Received!
            </Title>
            <Paragraph style={{ color: publicTheme.subtext, fontSize: 14, margin: '8px auto 20px', maxWidth: 540 }}>
              Our solutions manager has received your submission. We will reach out via email or Telegram shortly.
            </Paragraph>
            <Button
              type="primary"
              onClick={() => setSubmitted(false)}
              style={{
                borderRadius: 12,
                background: publicTheme.primary,
                fontWeight: 700,
              }}
            >
              Submit Another Request
            </Button>
          </div>
        ) : (
          <Row gutter={[36, 28]}>
            {/* Form Fields (Full Left Column) */}
            <Col xs={24} lg={15}>
              <form onSubmit={handleSubmitInquiry} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                
                {/* Desired Service Selection */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: publicTheme.text, marginBottom: 6 }}>
                    Primary Service of Interest *
                  </label>
                  <select
                    value={formService}
                    onChange={(e) => setFormService(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(240, 244, 255, 0.6)',
                      border: `1px solid ${publicTheme.softBorder}`,
                      borderRadius: 14,
                      padding: '12px 16px',
                      fontSize: 13,
                      color: publicTheme.text,
                      outline: 'none',
                    }}
                  >
                    {servicesList.map((s) => (
                      <option key={s.id} value={s.title}>
                        {s.title} ({s.category})
                      </option>
                    ))}
                    <option value="General Hospitality Operations">
                      General Hospitality Operations Consultation
                    </option>
                  </select>
                </div>

                {/* 2-Column Inputs Grid */}
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: publicTheme.text, marginBottom: 6 }}>
                      Business / Brand Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Luminary Specialty Coffee"
                      style={{
                        width: '100%',
                        background: 'rgba(240, 244, 255, 0.6)',
                        border: `1px solid ${publicTheme.softBorder}`,
                        borderRadius: 14,
                        padding: '12px 16px',
                        fontSize: 13,
                        color: publicTheme.text,
                        outline: 'none',
                      }}
                    />
                  </Col>

                  <Col xs={24} sm={12}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: publicTheme.text, marginBottom: 6 }}>
                      Contact Person Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="e.g. Sokha Chan"
                      style={{
                        width: '100%',
                        background: 'rgba(240, 244, 255, 0.6)',
                        border: `1px solid ${publicTheme.softBorder}`,
                        borderRadius: 14,
                        padding: '12px 16px',
                        fontSize: 13,
                        color: publicTheme.text,
                        outline: 'none',
                      }}
                    />
                  </Col>

                  <Col xs={24} sm={12}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: publicTheme.text, marginBottom: 6 }}>
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@yourdomain.com"
                      style={{
                        width: '100%',
                        background: 'rgba(240, 244, 255, 0.6)',
                        border: `1px solid ${publicTheme.softBorder}`,
                        borderRadius: 14,
                        padding: '12px 16px',
                        fontSize: 13,
                        color: publicTheme.text,
                        outline: 'none',
                      }}
                    />
                  </Col>

                  <Col xs={24} sm={12}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: publicTheme.text, marginBottom: 6 }}>
                      Phone / Telegram Handle
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+855 12 345 678 or @username"
                      style={{
                        width: '100%',
                        background: 'rgba(240, 244, 255, 0.6)',
                        border: `1px solid ${publicTheme.softBorder}`,
                        borderRadius: 14,
                        padding: '12px 16px',
                        fontSize: 13,
                        color: publicTheme.text,
                        outline: 'none',
                      }}
                    />
                  </Col>
                </Row>

                {/* Branch Count Selector */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: publicTheme.text, marginBottom: 6 }}>
                    Number of Branches / Event Scale
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    {['1 Branch', '2 - 4 Branches', '5+ Branches', 'Single Event'].map((cnt) => {
                      const isCntActive = branchCount === cnt;
                      return (
                        <button
                          key={cnt}
                          type="button"
                          onClick={() => setBranchCount(cnt)}
                          style={{
                            padding: '10px 8px',
                            borderRadius: 12,
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            border: `1px solid ${isCntActive ? publicTheme.primary : publicTheme.softBorder}`,
                            background: isCntActive ? publicTheme.primary : 'rgba(240, 244, 255, 0.6)',
                            color: isCntActive ? '#ffffff' : publicTheme.text,
                          }}
                        >
                          {cnt}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Requirements */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: publicTheme.text, marginBottom: 6 }}>
                    Project Requirements &amp; Specific Goals
                  </label>
                  <textarea
                    rows={3}
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Share details on your current setup, timeline, menu size, or specific roastery/bakery supply requirements..."
                    style={{
                      width: '100%',
                      background: 'rgba(240, 244, 255, 0.6)',
                      border: `1px solid ${publicTheme.softBorder}`,
                      borderRadius: 14,
                      padding: '12px 16px',
                      fontSize: 13,
                      color: publicTheme.text,
                      outline: 'none',
                      resize: 'vertical',
                    }}
                  />
                </div>

                <Button
                  type="primary"
                  htmlType="submit"
                  loading={submitting}
                  size="large"
                  icon={<SendOutlined />}
                  style={{
                    height: 48,
                    borderRadius: 14,
                    background: publicTheme.primary,
                    borderColor: publicTheme.primary,
                    fontWeight: 700,
                    fontSize: 14,
                    boxShadow: '0 10px 24px rgba(47, 111, 237, 0.28)',
                    marginTop: 4,
                  }}
                >
                  {submitting ? 'Submitting Request...' : 'Submit Service Proposal Request'}
                </Button>
              </form>
            </Col>

            {/* Right Information & Timeline Guide */}
            <Col xs={24} lg={9}>
              <div
                style={{
                  background: publicTheme.cardMuted,
                  borderRadius: 20,
                  border: `1px solid ${publicTheme.softBorder}`,
                  padding: 24,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 20,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <AuditOutlined style={{ color: publicTheme.primary, fontSize: 18 }} />
                    <span style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', color: publicTheme.text }}>
                      What Happens Next?
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          background: publicTheme.primary,
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          fontSize: 12,
                          flexShrink: 0,
                        }}
                      >
                        1
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: publicTheme.text }}>
                          Discovery &amp; Menu Audit (&lt; 2 Hours)
                        </div>
                        <div style={{ fontSize: 12, color: publicTheme.subtext, marginTop: 2 }}>
                          A dedicated hospitality solutions architect contacts you to review menu specs, volume targets, and bot credentials.
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 12 }}>
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          background: publicTheme.accent,
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          fontSize: 12,
                          flexShrink: 0,
                        }}
                      >
                        2
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: publicTheme.text }}>
                          Tasting Box &amp; Staging Demo
                        </div>
                        <div style={{ fontSize: 12, color: publicTheme.subtext, marginTop: 2 }}>
                          We ship complimentary roast samples or provide an interactive private test kitchen URL for your team to review.
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 12 }}>
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          background: publicTheme.success,
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          fontSize: 12,
                          flexShrink: 0,
                        }}
                      >
                        3
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: publicTheme.text }}>
                          Turnkey Go-Live (Within 48h)
                        </div>
                        <div style={{ fontSize: 12, color: publicTheme.subtext, marginTop: 2 }}>
                          Full Telegram Mini App launch, table QR print standees delivered, and recurring wholesale roast/bakery standing routes active.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    background: '#ffffff',
                    borderRadius: 14,
                    padding: 16,
                    border: `1px solid ${publicTheme.softBorder}`,
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, color: publicTheme.text, marginBottom: 4 }}>
                    Need urgent same-day support?
                  </div>
                  <div style={{ fontSize: 12, color: publicTheme.subtext, marginBottom: 10 }}>
                    Speak with our hospitality desk directly:
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <a
                      href="https://t.me/aura_emenu_order_bot"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: publicTheme.primary,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <SendOutlined /> Telegram Bot
                    </a>
                    <span style={{ color: publicTheme.softBorder }}>•</span>
                    <a
                      href="tel:+85512345678"
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: publicTheme.accent,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <PhoneOutlined /> +855 12 345 678
                    </a>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        )}
      </div>

      {/* ======================================================== */}
      {/* 4. FULL-SCREEN FREQUENTLY ASKED QUESTIONS (FAQ)          */}
      {/* ======================================================== */}
      <div
        style={{
          width: '100%',
          background: publicTheme.cardBackground,
          borderRadius: 24,
          border: `1px solid ${publicTheme.border}`,
          padding: screens.xs ? 20 : screens.md ? 32 : 40,
          backdropFilter: 'blur(20px)',
          boxShadow: publicTheme.shadow,
          marginBottom: 36,
        }}
      >
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '5px 14px',
              borderRadius: 999,
              background: publicTheme.pill,
              marginBottom: 10,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: publicTheme.primary,
              }}
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: publicTheme.primary,
                textTransform: 'uppercase',
              }}
            >
              Clarity &amp; Answers
            </span>
          </div>
          <Title level={2} style={{ fontSize: screens.xs ? 22 : 28, fontWeight: 800, color: publicTheme.text, margin: 0 }}>
            Frequently Asked Questions
          </Title>
          <Paragraph style={{ color: publicTheme.subtext, fontSize: 14, marginTop: 6, margin: 0 }}>
            Common inquiries regarding deployment timelines, delivery radius, and standing orders.
          </Paragraph>
        </div>

        <Collapse
          items={faqItems}
          bordered={false}
          defaultActiveKey={['1']}
          style={{ background: 'transparent' }}
        />
      </div>

      {/* ======================================================== */}
      {/* 5. FULL-SCREEN CALL TO ACTION BANNER                     */}
      {/* ======================================================== */}
      <div
        style={{
          width: '100%',
          borderRadius: 28,
          background: 'linear-gradient(135deg, #1c2333 0%, #2f6fed 100%)',
          padding: screens.xs ? '32px 20px' : '44px 44px',
          color: '#ffffff',
          boxShadow: '0 20px 50px rgba(47, 111, 237, 0.25)',
          display: 'flex',
          flexDirection: screens.xs ? 'column' : 'row',
          alignItems: screens.xs ? 'flex-start' : 'center',
          justifyContent: 'space-between',
          gap: 24,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Ambient light inside banner */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            width: 320,
            height: 320,
            top: -60,
            right: -60,
            background: '#ff7a3d',
            borderRadius: '50%',
            filter: 'blur(70px)',
            opacity: 0.22,
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 720 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 12px',
              borderRadius: 999,
              background: 'rgba(255, 255, 255, 0.15)',
              marginBottom: 12,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: publicTheme.success,
              }}
            />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#b7efe3' }}>
              Hospitality Concierge Available
            </span>
          </div>

          <Title level={3} style={{ color: '#ffffff', margin: '0 0 8px', fontWeight: 800 }}>
            Ready to Upgrade Your Dining or Supply Operations?
          </Title>
          <Paragraph style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 14, margin: 0, lineHeight: 1.55 }}>
            Chat directly with our solutions team on Telegram or visit our Daun Penh roastery and bakery test kitchen.
          </Paragraph>
        </div>

        <div
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            width: screens.xs ? '100%' : 'auto',
          }}
        >
          <a
            href="https://t.me/aura_emenu_order_bot"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 22px',
              borderRadius: 14,
              background: publicTheme.accent,
              color: '#ffffff',
              fontWeight: 700,
              fontSize: 13,
              boxShadow: '0 8px 20px rgba(255, 122, 61, 0.35)',
              textDecoration: 'none',
              width: screens.xs ? '100%' : 'auto',
              justifyContent: 'center',
            }}
          >
            <SendOutlined />
            <span>Open Telegram Bot Desk</span>
          </a>

          <a
            href="tel:+85512345678"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 20px',
              borderRadius: 14,
              background: 'rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: 13,
              border: '1px solid rgba(255, 255, 255, 0.25)',
              textDecoration: 'none',
              width: screens.xs ? '100%' : 'auto',
              justifyContent: 'center',
            }}
          >
            <PhoneOutlined />
            <span>Call +855 12 345 678</span>
          </a>
        </div>
      </div>

    </div>
  );
}
