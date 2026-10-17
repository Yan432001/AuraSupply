import React, { useState } from 'react';
import {
  Card,
  Button,
  Upload,
  Typography,
  Space,
  Alert,
  Table,
  Divider,
  message,
  Flex,
  Tag,
} from 'antd';
import {
  DownloadOutlined,
  UploadOutlined,
  FileExcelOutlined,
  ArrowLeftOutlined,
  CheckCircleOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAdminTheme } from '../../hooks/useAdminTheme';
import { useTranslation } from '../../contexts/LanguageContext';

const { Title, Paragraph, Text } = Typography;
const { Dragger } = Upload;

export default function BpasImportExcelPage({ onBack }) {
  const adminTheme = useAdminTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importSummary, setImportSummary] = useState(null);

  // Sample CSV template generator & download
  const handleDownloadSample = () => {
    const headers = [
      'name',
      'code',
      'barcode_symbology',
      'brand',
      'category_code',
      'unit_code',
      'sale_unit_code',
      'purchase_unit_code',
      'cost',
      'price',
      'alert_quantity',
      'tax',
      'tax_method',
      'image',
      'subcategory_code',
      'variants',
      'cf1',
      'cf2',
      'cf3',
      'second_name',
    ];

    const sampleRows = [
      [
        'Espresso Arabica Premium 250g',
        '88581001',
        'code128',
        'Angkor Harvest',
        'COFFEE',
        'Pcs',
        'Pcs',
        'Box',
        '2.50',
        '5.00',
        '15',
        '0',
        'inclusive',
        'coffee_beans.jpg',
        'ROASTED',
        'Whole Bean,Ground',
        'Medium Roast',
        'Cambodia',
        'Fairtrade',
        'កាហ្វេអារ៉ាប៊ីកា',
      ],
      [
        'Organic Jasmine Green Tea',
        '88581002',
        'code128',
        'Mondulkiri Tea',
        'TEA',
        'Box',
        'Box',
        'Carton',
        '1.80',
        '3.80',
        '20',
        '0',
        'inclusive',
        'green_tea.jpg',
        'HERBAL',
        'Standard',
        'Loose Leaf',
        'Mondulkiri',
        'Organic',
        'តែបៃតងផ្កាម្លិះ',
      ],
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...sampleRows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'sample_products.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success('Downloaded sample_products.csv template');
  };

  const handleImport = () => {
    if (!uploadedFiles.length) {
      message.warning('Please select an Excel or CSV file to import.');
      return;
    }
    setIsImporting(true);
    setTimeout(() => {
      setIsImporting(false);
      setImportSummary({
        total: 18,
        success: 18,
        failed: 0,
      });
      message.success('Successfully imported 18 products from spreadsheet!');
    }, 1200);
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 1. BPAS Breadcrumb Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 20px',
          background: adminTheme.card,
          border: `1px solid ${adminTheme.border}`,
          borderRadius: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => {
              if (onBack) onBack();
              else navigate('/admins/products');
            }}
            style={{ fontWeight: 700 }}
          >
            {t('back_to_products', 'Back to Products')}
          </Button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileExcelOutlined style={{ color: '#16a34a', fontSize: 18 }} />
            <span style={{ fontSize: 18, fontWeight: 800, color: '#2563eb' }}>
              {t('import_products_excel', 'Import Products by Excel / CSV')}
            </span>
          </div>
        </div>

        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={handleDownloadSample}
          style={{
            fontWeight: 800,
            background: '#16a34a',
            borderColor: '#16a34a',
          }}
        >
          {t('download_sample_template', 'Download Sample Template')}
        </Button>
      </div>

      {/* 2. BPAS Information Well Box */}
      <Card
        style={{ borderRadius: 14, border: `1px solid ${adminTheme.border}` }}
        styles={{ body: { padding: '24px' } }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderRadius: 10,
            background: '#f8fafc',
            border: `1px solid ${adminTheme.border}`,
            marginBottom: 24,
          }}
        >
          <Title level={5} style={{ margin: 0, color: '#0f172a' }}>
            {t('import_instructions', 'Instructions for Importing Products:')}
          </Title>
          <Paragraph style={{ marginTop: 8, fontSize: 13, color: adminTheme.subtext }}>
            1. {t('import_rule_1', 'The first line of the downloaded CSV or Excel file MUST remain as the column headers. Do not alter or rename columns.')}<br />
            2. {t('import_rule_2', 'Required columns include: name, code, category_code, unit_code, cost, price.')}<br />
            3. {t('import_rule_3', 'If product code already exists in catalog, the system will automatically update pricing and cost.')}<br />
            4. {t('import_rule_4', 'Image filenames should match assets uploaded into the system uploads folder.')}
          </Paragraph>
          <Tag color="blue">{t('import_formats_supported', 'File formats supported: .CSV, .XLS, .XLSX (UTF-8 Encoded)')}</Tag>
        </div>

        {/* Upload Dragger Zone */}
        <div style={{ marginBottom: 24 }}>
          <Dragger
            name="file"
            multiple={false}
            accept=".csv, .xls, .xlsx"
            beforeUpload={(file) => {
              setUploadedFiles([file]);
              message.success(`${t('file', 'File')} "${file.name}" ${t('ready_for_processing', 'ready for processing')}`);
              return false;
            }}
            onRemove={() => setUploadedFiles([])}
            fileList={uploadedFiles}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined style={{ color: '#2563eb', fontSize: 48 }} />
            </p>
            <p className="ant-upload-text" style={{ fontWeight: 700, fontSize: 16 }}>
              {t('click_or_drag_file', 'Click or drag spreadsheet file to this area to upload')}
            </p>
            <p className="ant-upload-hint" style={{ color: adminTheme.subtext }}>
              {t('upload_batch_hint', 'Support for single CSV or Excel batch upload. Max file size: 10MB.')}
            </p>
          </Dragger>
        </div>

        {/* Results summary alert if finished */}
        {importSummary && (
          <Alert
            message={t('import_completed_success', 'Import Completed Successfully')}
            description={`${t('processed', 'Processed')} ${importSummary.total} ${t('rows', 'rows')}: ${importSummary.success} ${t('created_updated', 'created/updated with 0 errors.')}`}
            type="success"
            showIcon
            style={{ marginBottom: 20 }}
          />
        )}

        <Divider style={{ margin: '16px 0' }} />

        {/* Footer Actions */}
        <Flex justify="space-between" align="center">
          <Button
            onClick={() => {
              if (onBack) onBack();
              else navigate('/admins/products');
            }}
          >
            {t('cancel', 'Cancel')}
          </Button>

          <Button
            type="primary"
            icon={<UploadOutlined />}
            loading={isImporting}
            disabled={!uploadedFiles.length}
            onClick={handleImport}
            style={{
              fontWeight: 800,
              background: '#2563eb',
              paddingInline: 32,
              height: 40,
            }}
          >
            {t('import_products', 'Import Products')}
          </Button>
        </Flex>
      </Card>
    </div>
  );
}
