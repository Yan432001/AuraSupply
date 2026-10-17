import React, { useState, useEffect } from 'react';
import { Button, Card, Col, Row, Space, Tag, Typography, message, Input, Spin } from 'antd';
import {
  BookOutlined,
  BulbOutlined,
  ReadOutlined,
  TeamOutlined,
  FilePdfOutlined,
  SafetyCertificateFilled,
  DownloadOutlined,
  SearchOutlined,
  CheckCircleFilled,
  ThunderboltFilled,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useTranslation } from '../../contexts/LanguageContext';
import { publicTheme } from '../../utils/webTheme';
import { fetchPosts } from '../../utils/apiconfig';

const { Title, Paragraph, Text } = Typography;

export default function Learn() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);

  const defaultAcademyTracks = [
    {
      id: 'procurement-101',
      title: t('track_procurement_101', 'B2B Procurement & Contract Sourcing'),
      icon: <BookOutlined style={{ fontSize: 24, color: publicTheme.primary }} />,
      text: t('track_procurement_101_desc', 'Master wholesale RFQs, volume tier pricing structures, payment escrow terms, and commercial dispute resolution.'),
      modules: `8 ${t('modules', 'Modules')} • 4 ${t('hours', 'Hours')}`,
      badge: t('core_program', 'Core Program'),
    },
    {
      id: 'store-onboarding',
      title: t('track_store_onboarding', 'Multi-Store Setup & Telegram E-Menu Dispatch'),
      icon: <BulbOutlined style={{ fontSize: 24, color: '#f59e0b' }} />,
      text: t('track_store_onboarding_desc', 'Step-by-step tutorial on @BotFather integration, table QR code setup, menu category tagging, and automated kitchen routing.'),
      modules: `6 ${t('modules', 'Modules')} • 2.5 ${t('hours', 'Hours')}`,
      badge: t('emenu_system', 'E-Menu System'),
    },
    {
      id: 'quality-compliance',
      title: t('track_quality_compliance', 'Factory Audits & ISO/HACCP Quality Compliance'),
      icon: <SafetyCertificateFilled style={{ fontSize: 24, color: '#10b981' }} />,
      text: t('track_quality_compliance_desc', 'Guidelines for food safety certifications, direct-trade farm lot traceability, electronics warranty standards, and packaging integrity.'),
      modules: `5 ${t('modules', 'Modules')} • 3 ${t('hours', 'Hours')}`,
      badge: t('compliance', 'Compliance'),
    },
    {
      id: 'cross-border-freight',
      title: t('track_cross_border_freight', 'Cross-Border Freight & Customs IncoTerms'),
      icon: <ThunderboltFilled style={{ fontSize: 24, color: publicTheme.accent }} />,
      text: t('track_cross_border_freight_desc', 'Understanding FOB vs CIF terms, overland transit between Cambodia and Thailand, port handling, and import tax clearance.'),
      modules: `7 ${t('modules', 'Modules')} • 3.5 ${t('hours', 'Hours')}`,
      badge: t('logistics', 'Logistics'),
    },
  ];

  const downloadableTemplates = [
    {
      title: t('tmpl_rfq_title', 'Standard B2B Request for Quote (RFQ) Template'),
      format: `Excel / Spreadsheet • 280 KB`,
      desc: t('tmpl_rfq_desc', 'Structured RFQ form for requesting bulk pricing, MOQ tiers, and freight terms from factories.'),
    },
    {
      title: t('tmpl_inspection_title', 'Factory Pre-Shipment Quality Inspection Checklist'),
      format: `PDF Guide • 1.4 MB`,
      desc: t('tmpl_inspection_desc', '25-point quality verification protocol covering dimensional tolerances, packaging, and certifications.'),
    },
    {
      title: t('tmpl_emenu_title', 'Telegram Mini App & E-Menu Launch Playbook'),
      format: `PDF Blueprint • 3.2 MB`,
      desc: t('tmpl_emenu_desc', 'Complete deployment guide with table QR print dimensions, staff group training, and promo code workflows.'),
    },
    {
      title: t('tmpl_contract_title', 'Commercial Wholesale Supply Agreement (Proforma Net-30)'),
      format: `DOCX / Legal • 450 KB`,
      desc: t('tmpl_contract_desc', 'Standardized buyer-seller contract with milestone escrow payment terms and warranty liabilities.'),
    },
  ];

  useEffect(() => {
    let isMounted = true;
    fetchPosts()
      .then((res) => {
        if (!isMounted) return;
        if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
          const mapped = res.data.map((p) => ({
            id: p.slug || p.id,
            title: p.title,
            text: p.summary || p.content,
            modules: p.duration || `6 ${t('modules', 'Modules')} • 3 ${t('hours', 'Hours')}`,
            badge: p.badge || p.category || t('academy_track', 'Academy Track'),
            icon: <BookOutlined style={{ fontSize: 24, color: publicTheme.primary }} />
          }));
          setTracks(mapped);
        } else {
          setTracks(defaultAcademyTracks);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Learn posts fetch error:', err);
        if (isMounted) {
          setTracks(defaultAcademyTracks);
          setLoading(false);
        }
      });
    return () => { isMounted = false; };
  }, []);

  const handleDownload = (title) => {
    message.success(`${t('downloading', 'Downloading')}: "${title}"`);
  };

  return (
    <div style={{ width: '100%', paddingBottom: 56 }}>
      {/* Academy Hero Banner */}
      <div
        className="b2b-grid-backdrop"
        style={{
          borderRadius: 28,
          background: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
          border: `1px solid ${publicTheme.border}`,
          boxShadow: publicTheme.shadow,
          padding: '36px 40px',
          marginBottom: 32,
        }}
      >
        <Row gutter={[32, 24]} align="middle">
          <Col xs={24} lg={16}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: 'rgba(47, 111, 237, 0.08)', marginBottom: 12 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: publicTheme.primary }} />
              <span style={{ fontSize: 11, fontWeight: 800, color: publicTheme.primary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {t('academy_tag', 'Aura Supply Academy & Knowledge Hub')}
              </span>
            </div>
            <Title level={1} style={{ margin: '0 0 10px', fontSize: 'clamp(26px, 3.5vw, 38px)', fontWeight: 850, color: publicTheme.text }}>
              {t('academy_title', 'B2B Procurement Playbooks & Operations Mastery')}
            </Title>
            <Paragraph style={{ color: publicTheme.subtext, fontSize: 14.5, maxWidth: 640, lineHeight: 1.6, margin: 0 }}>
              {t('academy_subtitle', 'Practical blueprints, compliance checklists, and guides for commercial procurement officers, restaurant operators, and regional supply chain managers.')}
            </Paragraph>
          </Col>

          <Col xs={24} lg={8} style={{ textAlign: 'right' }}>
            <div style={{ background: '#0f172a', borderRadius: 20, padding: '24px 22px', color: '#ffffff', textAlign: 'left', boxShadow: '0 12px 30px rgba(15, 23, 42, 0.2)' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', marginBottom: 6 }}>
                {t('certified_sourcing_program', 'Certified Sourcing Program')}
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>
                {t('free_access_verified_buyers', 'Free Access for Verified Business Buyers')}
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5, marginBottom: 16 }}>
                {t('unlocked_for_corporate_account', 'All templates, video tracks, and checklists are unlocked for your corporate account.')}
              </div>
              <Button
                type="primary"
                block
                style={{ borderRadius: 10, height: 40, fontWeight: 800, background: publicTheme.primary }}
              >
                {t('enroll_in_track', 'Enroll in Track')}
              </Button>
            </div>
          </Col>
        </Row>
      </div>

      {/* Structured Learning Modules */}
      <div style={{ marginBottom: 40 }}>
        <Title level={3} style={{ fontWeight: 850, color: publicTheme.text, marginBottom: 18 }}>
          {t('core_sourcing_tracks', 'Core Sourcing & Operations Tracks')}
        </Title>
        <Row gutter={[20, 20]}>
          {tracks.map((track) => (
            <Col xs={24} md={12} key={track.id}>
              <Card
                className="b2b-card"
                style={{
                  height: '100%',
                  borderRadius: 22,
                  border: `1px solid ${publicTheme.border}`,
                  boxShadow: publicTheme.lightShadow,
                  background: '#ffffff',
                }}
                styles={{ body: { padding: '24px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' } }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(240, 244, 255, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {track.icon}
                    </div>
                    <Tag color="blue" style={{ borderRadius: 6, fontWeight: 700, margin: 0, fontSize: 11 }}>
                      {track.badge}
                    </Tag>
                  </div>
                  <Title level={4} style={{ margin: '0 0 8px', color: publicTheme.text, fontWeight: 800 }}>
                    {track.title}
                  </Title>
                  <Paragraph style={{ color: publicTheme.subtext, fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
                    {track.text}
                  </Paragraph>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: 14 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: publicTheme.primary }}>
                    {track.modules}
                  </span>
                  <Button
                    type="link"
                    style={{ padding: 0, fontWeight: 800, color: publicTheme.primary }}
                    onClick={() => message.info(`${t('accessing', 'Accessing')} ${track.title}`)}
                  >
                    {t('start_track', 'Start Track')} &rarr;
                  </Button>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* Downloadable Procurement Templates */}
      <Card
        style={{
          borderRadius: 24,
          border: `1px solid ${publicTheme.border}`,
          boxShadow: publicTheme.shadow,
          background: '#ffffff',
        }}
        styles={{ body: { padding: '28px 32px' } }}
      >
        <div style={{ marginBottom: 20 }}>
          <Title level={3} style={{ fontWeight: 850, color: publicTheme.text, margin: '0 0 6px' }}>
            {t('downloadable_toolkits', 'Downloadable Procurement Toolkits & Contracts')}
          </Title>
          <Text style={{ color: publicTheme.subtext, fontSize: 13.5 }}>
            {t('downloadable_toolkits_desc', 'Production-ready documents to expedite contract negotiations and quality inspections.')}
          </Text>
        </div>

        <Row gutter={[16, 16]}>
          {downloadableTemplates.map((item, idx) => (
            <Col xs={24} md={12} key={idx}>
              <div
                style={{
                  borderRadius: 16,
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  padding: '16px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <FilePdfOutlined style={{ fontSize: 28, color: '#ef4444' }} />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 13.5, color: publicTheme.text }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: 11, color: publicTheme.subtext, marginTop: 2 }}>
                      {item.format}
                    </div>
                  </div>
                </div>

                <Button
                  icon={<DownloadOutlined />}
                  onClick={() => handleDownload(item.title)}
                  style={{ borderRadius: 10, fontWeight: 700, flexShrink: 0 }}
                >
                  {t('download', 'Download')}
                </Button>
              </div>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  );
}
