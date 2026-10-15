import React, { useMemo } from 'react';
import { Button, Card, Col, Divider, Flex, Progress, Row, Space, Switch, Tag, Typography } from 'antd';
import {
  AppstoreOutlined,
  BankOutlined,
  BarChartOutlined,
  BuildOutlined,
  ControlOutlined,
  CreditCardOutlined,
  GlobalOutlined,
  MedicineBoxOutlined,
  MoneyCollectOutlined,
  ReadOutlined,
  ReconciliationOutlined,
  SettingOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  UsergroupAddOutlined,
} from '@ant-design/icons';
import { useAdminTheme } from '../../../hooks/useAdminTheme';
import { countLeafMenus, erpModules, flattenMenuItems, moduleHealthLabel } from '../../data/erpModules';

const { Text, Title, Paragraph } = Typography;

const moduleIconMap = {
  inventory: AppstoreOutlined,
  procurement: ReconciliationOutlined,
  sales: ShoppingCartOutlined,
  pos: CreditCardOutlined,
  loans: MoneyCollectOutlined,
  asset: BuildOutlined,
  accounting: BankOutlined,
  hr: TeamOutlined,
  payroll: BarChartOutlined,
  crm: UsergroupAddOutlined,
  clinic: MedicineBoxOutlined,
  property: BuildOutlined,
  school: ReadOutlined,
  manufacturing: ControlOutlined,
  reports: BarChartOutlined,
  settings: SettingOutlined,
  frontEnd: GlobalOutlined,
};

const healthColorMap = {
  stable: 'green',
  watch: 'orange',
  paused: 'default',
};

const getIconNode = (iconKey) => {
  const IconComponent = moduleIconMap[iconKey] || AppstoreOutlined;
  return <IconComponent />;
};

const ModuleControllerPanel = ({
  activeModule,
  activeMenu,
  moduleState,
  onToggleModule,
  onSelectModule,
  onSelectMenu,
}) => {
  const adminTheme = useAdminTheme();
  const enabledCount = useMemo(
    () => erpModules.filter((module) => moduleState[module.key]).length,
    [moduleState]
  );

  const totalMenus = useMemo(
    () => erpModules.reduce((sum, module) => sum + countLeafMenus(module.menus), 0),
    []
  );
  const activeMenuItems = useMemo(() => flattenMenuItems(activeModule.menus), [activeModule.menus]);

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Card
        style={{
          borderRadius: 30,
          border: `1px solid ${adminTheme.border}`,
          background: adminTheme.isDark
            ? 'linear-gradient(140deg, #161f30 0%, #1e293b 100%)'
            : 'linear-gradient(140deg, rgba(255,255,255,0.98), rgba(235,244,255,0.98))',
        }}
        styles={{ body: { padding: 24 } }}
      >
        <Row gutter={[18, 18]} align="middle">
          <Col xs={24} xl={14}>
            <Tag
              style={{
                borderRadius: 999,
                border: 'none',
                background: adminTheme.isDark ? 'rgba(47, 111, 237, 0.2)' : '#eaf5ff',
                color: adminTheme.primary,
                padding: '6px 12px',
                fontWeight: 700,
                marginBottom: 12,
              }}
            >
              ERP module controller
            </Tag>
            <Title level={2} style={{ marginTop: 0, marginBottom: 8, color: adminTheme.text }}>
              Enable, disable, and inspect every ERP module from one shared control surface.
            </Title>
            <Paragraph style={{ marginBottom: 0, color: adminTheme.subtext, fontSize: 16 }}>
              This follows the same idea as your PHP menu and module settings page: all modules are visible in the slide bar, every module can be opened or closed, and each module exposes detailed actions.
            </Paragraph>
          </Col>
          <Col xs={24} xl={10}>
            <Row gutter={[12, 12]}>
              <Col span={12}>
                <Card style={{ borderRadius: 22, background: adminTheme.cardMuted, border: `1px solid ${adminTheme.border}` }} styles={{ body: { padding: 16 } }}>
                  <Text style={{ color: adminTheme.subtext }}>Enabled modules</Text>
                  <Title level={3} style={{ margin: '6px 0 0', color: adminTheme.text }}>
                    {enabledCount}/{erpModules.length}
                  </Title>
                </Card>
              </Col>
              <Col span={12}>
                <Card style={{ borderRadius: 22, background: adminTheme.cardMuted, border: `1px solid ${adminTheme.border}` }} styles={{ body: { padding: 16 } }}>
                  <Text style={{ color: adminTheme.subtext }}>Total menus</Text>
                  <Title level={3} style={{ margin: '6px 0 0', color: adminTheme.text }}>
                    {totalMenus}
                  </Title>
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      <Row gutter={[18, 18]}>
        <Col xs={24} xl={10}>
          <Card style={{ borderRadius: 28, border: `1px solid ${adminTheme.border}`, background: adminTheme.card }} styles={{ body: { padding: 22 } }}>
            <Flex justify="space-between" align="center" style={{ marginBottom: 18 }}>
              <div>
                <Title level={4} style={{ margin: 0, color: adminTheme.text }}>
                  Module switches
                </Title>
                <Text style={{ color: adminTheme.subtext }}>
                  Open or close ERP modules like the original settings controller.
                </Text>
              </div>
            </Flex>

            <Space direction="vertical" size={14} style={{ width: '100%' }}>
              {erpModules.map((module) => {
                const isEnabled = moduleState[module.key];
                const isActive = module.key === activeModule.key;
                const menuCount = countLeafMenus(module.menus);
                const readiness = Math.min(100, Math.round((menuCount / 12) * 100));

                return (
                  <button
                    key={module.key}
                    type="button"
                    onClick={() => onSelectModule(module.key)}
                    style={{
                      border: isActive ? `1px solid ${module.accent}` : `1px solid ${adminTheme.border}`,
                      background: isActive ? `${module.accent}12` : adminTheme.cardMuted,
                      borderRadius: 22,
                      padding: 16,
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                    }}
                  >
                    <Flex justify="space-between" align="start" gap={12}>
                      <Space align="start" size={12}>
                        <div
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: 16,
                            background: `${module.accent}20`,
                            color: module.accent,
                            display: 'grid',
                            placeItems: 'center',
                            fontSize: 18,
                          }}
                        >
                          {getIconNode(module.iconKey)}
                        </div>
                        <div>
                          <Flex align="center" gap={8} wrap="wrap">
                            <Text strong style={{ color: adminTheme.text }}>
                              {module.label}
                            </Text>
                            <Tag color={isEnabled ? healthColorMap[module.health] : 'default'} style={{ borderRadius: 999, margin: 0 }}>
                              {isEnabled ? moduleHealthLabel[module.health] : 'Disabled'}
                            </Tag>
                          </Flex>
                          <Text style={{ color: adminTheme.subtext, display: 'block', marginTop: 6 }}>
                            {module.description}
                          </Text>
                        </div>
                      </Space>

                      <Switch
                        checked={isEnabled}
                        onClick={(checked, event) => {
                          event?.stopPropagation();
                          onToggleModule(module.key, checked);
                        }}
                        style={{ background: isEnabled ? module.accent : undefined }}
                      />
                    </Flex>

                    <div style={{ marginTop: 12 }}>
                      <Flex justify="space-between" align="center">
                        <Text style={{ color: adminTheme.subtext, fontSize: 12 }}>Menu coverage</Text>
                        <Text style={{ color: adminTheme.subtext, fontSize: 12 }}>{menuCount} menus</Text>
                      </Flex>
                      <Progress percent={readiness} showInfo={false} strokeColor={module.accent} trailColor="rgba(18,35,59,0.08)" />
                    </div>
                  </button>
                );
              })}
            </Space>
          </Card>
        </Col>

        <Col xs={24} xl={14}>
          <Card style={{ borderRadius: 28, border: `1px solid ${adminTheme.border}`, background: adminTheme.card }} styles={{ body: { padding: 22 } }}>
            <Flex justify="space-between" align="start" gap={16} wrap="wrap">
              <Space align="start" size={14}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 20,
                    background: `${activeModule.accent}20`,
                    color: activeModule.accent,
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 22,
                  }}
                >
                  {getIconNode(activeModule.iconKey)}
                </div>
                <div>
                  <Flex align="center" gap={10} wrap="wrap">
                    <Title level={3} style={{ margin: 0, color: adminTheme.text }}>
                      {activeModule.label}
                    </Title>
                    <Tag color={moduleState[activeModule.key] ? healthColorMap[activeModule.health] : 'default'} style={{ borderRadius: 999, margin: 0 }}>
                      {moduleState[activeModule.key] ? moduleHealthLabel[activeModule.health] : 'Disabled'}
                    </Tag>
                  </Flex>
                  <Text style={{ color: adminTheme.subtext, display: 'block', marginTop: 6 }}>
                    {activeModule.description}
                  </Text>
                </div>
              </Space>

              <div style={{ minWidth: 180 }}>
                <Text style={{ color: adminTheme.subtext, display: 'block' }}>{activeModule.kpiLabel}</Text>
                <Title level={3} style={{ margin: '6px 0 0', color: activeModule.accent }}>
                  {activeModule.kpiValue}
                </Title>
              </div>
            </Flex>

            <Divider style={{ margin: '18px 0' }} />

            <Row gutter={[16, 16]} style={{ marginBottom: 18 }}>
              <Col xs={24} md={12}>
                <Card style={{ borderRadius: 20, background: adminTheme.cardMuted, border: `1px solid ${adminTheme.border}` }} styles={{ body: { padding: 16 } }}>
                  <Text style={{ color: adminTheme.subtext, display: 'block', marginBottom: 8 }}>What this module does</Text>
                  <Space direction="vertical" size={8} style={{ width: '100%' }}>
                    {activeModule.detailBullets.map((bullet) => (
                      <Text key={bullet} style={{ color: adminTheme.text }}>
                        - {bullet}
                      </Text>
                    ))}
                  </Space>
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card style={{ borderRadius: 20, background: adminTheme.cardMuted, border: `1px solid ${adminTheme.border}` }} styles={{ body: { padding: 16 } }}>
                  <Text style={{ color: adminTheme.subtext, display: 'block', marginBottom: 8 }}>Controller note</Text>
                  <Paragraph style={{ marginBottom: 12, color: adminTheme.text }}>
                    {activeModule.statusNote}
                  </Paragraph>
                  <Flex justify="space-between" align="center">
                    <Text style={{ color: adminTheme.subtext }}>Module enabled</Text>
                    <Switch
                      checked={moduleState[activeModule.key]}
                      onChange={(checked) => onToggleModule(activeModule.key, checked)}
                      style={{ background: moduleState[activeModule.key] ? activeModule.accent : undefined }}
                    />
                  </Flex>
                </Card>
              </Col>
            </Row>

            <div style={{ marginBottom: 18 }}>
              <Title level={4} style={{ marginTop: 0, marginBottom: 12, color: adminTheme.text }}>
                Menu detail
              </Title>
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                {activeMenuItems.map((menu) => {
                  const isActiveMenu = menu.key === activeMenu.key;

                  return (
                    <button
                      key={menu.key}
                      type="button"
                      onClick={() => onSelectMenu(activeModule.key, menu.key)}
                      style={{
                        width: '100%',
                        borderRadius: 20,
                        border: isActiveMenu ? `1px solid ${activeModule.accent}` : `1px solid ${adminTheme.border}`,
                        background: isActiveMenu ? `${activeModule.accent}10` : adminTheme.cardMuted,
                        padding: 16,
                        textAlign: 'left',
                        cursor: 'pointer',
                      }}
                    >
                      <Flex justify="space-between" align="start" gap={12}>
                        <div>
                          <Text strong style={{ color: adminTheme.text, display: 'block', marginBottom: 6 }}>
                            {menu.label}
                          </Text>
                          {!!menu.groupPath?.length && (
                            <Space wrap size={[6, 6]} style={{ marginBottom: 8 }}>
                              {menu.groupPath.map((groupLabel) => (
                                <Tag key={`${menu.key}-${groupLabel}`} style={{ margin: 0, borderRadius: 999 }}>
                                  {groupLabel}
                                </Tag>
                              ))}
                            </Space>
                          )}
                          <Text style={{ color: adminTheme.subtext, display: 'block', marginBottom: 10 }}>
                            {menu.description}
                          </Text>
                          <Space wrap size={[8, 8]}>
                            {(menu.playbook || []).map((item) => (
                              <Tag key={item} style={{ margin: 0, borderRadius: 999, background: adminTheme.isDark ? 'rgba(255,255,255,0.06)' : '#ffffff', border: `1px solid ${adminTheme.border}`, color: adminTheme.text }}>
                                {item}
                              </Tag>
                            ))}
                          </Space>
                        </div>
                        {isActiveMenu && (
                          <Button
                            type="primary"
                            style={{
                              background: activeModule.accent,
                              border: 'none',
                              borderRadius: 14,
                              fontWeight: 700,
                            }}
                          >
                            Active
                          </Button>
                        )}
                      </Flex>
                    </button>
                  );
                })}
              </Space>
            </div>

            <div>
              <Title level={4} style={{ marginTop: 0, marginBottom: 12, color: adminTheme.text }}>
                Sub-module settings
              </Title>
              <Row gutter={[12, 12]}>
                {activeModule.submodules.map((item) => (
                  <Col xs={24} md={12} key={item.key}>
                    <Card style={{ borderRadius: 20, background: adminTheme.cardMuted, border: `1px solid ${adminTheme.border}` }} styles={{ body: { padding: 16 } }}>
                      <Flex justify="space-between" align="start" gap={12}>
                        <div>
                          <Text strong style={{ color: adminTheme.text, display: 'block', marginBottom: 6 }}>
                            {item.label}
                          </Text>
                          <Text style={{ color: adminTheme.subtext }}>
                            {item.description}
                          </Text>
                        </div>
                        <Switch checked={item.enabled} disabled />
                      </Flex>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          </Card>
        </Col>
      </Row>
    </Space>
  );
};

export default ModuleControllerPanel;
