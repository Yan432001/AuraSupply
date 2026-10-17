import React from 'react';
import { Button, Card, Space, Table, Typography } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { useAdminTheme } from '../../../hooks/useAdminTheme';
import { useTranslation } from '../../../contexts/LanguageContext';

const { Text, Title } = Typography;

const GenericReportPage = ({ title, subtitle, accent, columns, rows = [], extra }) => {
  const adminTheme = useAdminTheme();
  const { t } = useTranslation();

  return (
    <Space direction="vertical" size={18} style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Title level={4} style={{ margin: 0, color: adminTheme.text }}>{title}</Title>
          <Text style={{ color: adminTheme.subtext, fontSize: 12.5 }}>{subtitle}</Text>
        </div>
        {extra}
      </div>

      <Card style={{ borderRadius: 18, border: `1px solid ${adminTheme.border}`, background: adminTheme.card }} styles={{ body: { padding: 20 } }}>
        <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 14 }}>
          <Text style={{ color: adminTheme.subtext, fontSize: 12.5 }}>
            {t('rows_in_report_period', '{count} rows in this report period').replace('{count}', rows.length)}
          </Text>
          <Button icon={<DownloadOutlined />} style={{ borderRadius: 10, borderColor: adminTheme.border, color: accent }}>
            {t('export', 'Export')}
          </Button>
        </Space>
        <Table columns={columns} dataSource={rows} pagination={{ pageSize: 8, size: 'small' }} size="small" scroll={{ x: 640 }} />
      </Card>
    </Space>
  );
};

export default GenericReportPage;
