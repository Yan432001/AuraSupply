import React, { useState, useMemo } from 'react';
import {
  Table,
  Input,
  Button,
  Space,
  Tag,
  Popconfirm,
  Tooltip,
  Dropdown,
  Checkbox,
  Popover,
  Alert,
  Empty,
  Typography,
  Card,
  Row,
  Col,
  Modal,
  Descriptions,
  Badge,
  App,
  Select,
  Divider,
  Upload,
} from 'antd';
import {
  SearchOutlined,
  DownloadOutlined,
  UploadOutlined,
  PlusOutlined,
  ReloadOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  SettingOutlined,
  FilterOutlined,
  ClearOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  CheckSquareOutlined,
  InboxOutlined,
  FileExcelOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useAdminTheme } from '../../hooks/useAdminTheme';

const { Text, Title, Paragraph } = Typography;
const { Dragger } = Upload;

/**
 * Helper to extract raw text/value from column renderers or records for CSV export
 */
const extractCellValue = (record, col) => {
  if (!col) return '';
  const dataIndex = col.dataIndex;
  let val = '';

  if (Array.isArray(dataIndex)) {
    val = dataIndex.reduce((acc, curr) => (acc ? acc[curr] : ''), record);
  } else if (dataIndex) {
    val = record[dataIndex];
  } else if (col.key) {
    val = record[col.key];
  }

  if (val === null || val === undefined) return '';
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  if (typeof val === 'object') {
    try {
      return JSON.stringify(val);
    } catch {
      return '';
    }
  }
  return String(val);
};

/**
 * Converts dataset to CSV string with UTF-8 BOM
 */
export const convertToCsv = (columns, data) => {
  if (!data || !data.length) return '';

  const exportableCols = columns.filter(
    (c) => c.title && c.key !== 'actions' && c.dataIndex !== 'actions' && c.export !== false
  );

  const headers = exportableCols.map((col) => {
    const title = typeof col.title === 'string' ? col.title : col.key || 'Column';
    return `"${title.replace(/"/g, '""')}"`;
  });

  const rows = data.map((record) => {
    return exportableCols
      .map((col) => {
        const val = extractCellValue(record, col);
        return `"${val.replace(/"/g, '""')}"`;
      })
      .join(',');
  });

  return '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
};

/**
 * Triggers browser download of CSV string
 */
export const downloadCsvFile = (csvString, filename = 'export') => {
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename.replace(/[^a-zA-Z0-9_-]/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Parses raw CSV text into headers and row objects
 */
export const parseCsvText = (csvText) => {
  if (!csvText || typeof csvText !== 'string') return { headers: [], rows: [] };

  // Remove UTF-8 BOM if present
  let cleanText = csvText;
  if (cleanText.charCodeAt(0) === 0xfeff) {
    cleanText = cleanText.slice(1);
  }

  const lines = [];
  let currentRow = [];
  let currentToken = '';
  let insideQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentToken += '"';
        i++; // skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentToken.trim());
      currentToken = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentToken.trim());
      currentToken = '';
      if (currentRow.some((c) => c !== '')) {
        lines.push(currentRow);
      }
      currentRow = [];
    } else {
      currentToken += char;
    }
  }

  if (currentToken.length > 0 || currentRow.length > 0) {
    currentRow.push(currentToken.trim());
    if (currentRow.some((c) => c !== '')) {
      lines.push(currentRow);
    }
  }

  if (lines.length < 2) {
    return { headers: lines[0] || [], rows: [] };
  }

  const headers = lines[0].map((h) => h.replace(/^["']|["']$/g, '').trim());
  const rows = lines.slice(1).map((line) => {
    const rowObj = {};
    headers.forEach((h, idx) => {
      rowObj[h] = line[idx] !== undefined ? line[idx].replace(/^["']|["']$/g, '').trim() : '';
    });
    return rowObj;
  });

  return { headers, rows };
};

/**
 * Maps raw parsed CSV row objects to target table column keys
 */
export const mapCsvRowsToColumns = (headers, rows, columns, defaultStatus = 'active') => {
  const targetCols = columns.filter((c) => c.key !== 'actions' && c.dataIndex !== 'actions');
  const normalize = (str) => String(str || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  const headerMap = {};
  headers.forEach((hdr) => {
    const normHdr = normalize(hdr);
    const matchedCol = targetCols.find((col) => {
      const normTitle = normalize(typeof col.title === 'string' ? col.title : '');
      const normKey = normalize(col.key);
      const normDataIndex = normalize(Array.isArray(col.dataIndex) ? col.dataIndex.join('_') : col.dataIndex);
      return (
        normHdr === normTitle ||
        normHdr === normKey ||
        normHdr === normDataIndex ||
        normTitle.includes(normHdr) ||
        normHdr.includes(normTitle)
      );
    });

    if (matchedCol) {
      const fieldKey = matchedCol.dataIndex || matchedCol.key;
      headerMap[hdr] = Array.isArray(fieldKey) ? fieldKey[0] : fieldKey;
    } else {
      headerMap[hdr] = hdr.toLowerCase().replace(/\s+/g, '_');
    }
  });

  const now = new Date().toISOString().slice(0, 10);

  return rows.map((rawRow, index) => {
    const record = { id: Date.now() + index };
    Object.entries(rawRow).forEach(([hdr, val]) => {
      const targetKey = headerMap[hdr] || hdr;
      let finalVal = val;
      if (val === 'true' || val === 'Yes') finalVal = true;
      else if (val === 'false' || val === 'No') finalVal = false;
      else if (!isNaN(val) && val !== '' && !val.startsWith('0') && !val.startsWith('+')) {
        const num = Number(val);
        if (Number.isFinite(num)) finalVal = num;
      }
      record[targetKey] = finalVal;
    });

    if (!record.status) {
      record.status = defaultStatus;
    }
    if (!record.created_at) {
      record.created_at = now;
    }

    return record;
  });
};

/**
 * Generates sample CSV template string
 */
export const generateCsvTemplate = (columns, sampleRecord = null) => {
  const exportableCols = columns.filter(
    (c) => c.title && c.key !== 'actions' && c.dataIndex !== 'actions' && c.export !== false
  );

  const headers = exportableCols.map((c) => {
    const title = typeof c.title === 'string' ? c.title : c.key || 'Column';
    return `"${title.replace(/"/g, '""')}"`;
  });

  const sample1 = exportableCols.map((c) => {
    const key = String(c.dataIndex || c.key || '').toLowerCase();

    if (sampleRecord && (sampleRecord[c.dataIndex] || sampleRecord[c.key])) {
      return `"${String(sampleRecord[c.dataIndex] || sampleRecord[c.key]).replace(/"/g, '""')}"`;
    }
    if (key.includes('email')) return '"sample@aura.com"';
    if (key.includes('phone')) return '"+855 12 345 678"';
    if (key.includes('name')) return '"Sample Full Name"';
    if (key.includes('title')) return '"Sample Article or Item Title"';
    if (key.includes('role')) return '"Member"';
    if (key.includes('status')) return '"active"';
    if (key.includes('category')) return '"General"';
    if (key.includes('author')) return '"Admin Aura"';
    if (key.includes('view') || key.includes('count')) return '"120"';
    if (key.includes('image') || key.includes('url') || key.includes('avatar') || key.includes('media')) {
      return '"/assets/uploads/sample.jpg"';
    }
    if (key.includes('date') || key.includes('created')) return `"${new Date().toISOString().slice(0, 10)}"`;
    if (key.includes('excerpt') || key.includes('description') || key.includes('content') || key.includes('note')) {
      return '"Sample description text for bulk import."';
    }
    return '"Sample Value"';
  });

  return '\uFEFF' + [headers.join(','), sample1.join(',')].join('\r\n');
};

/**
 * Reusable Admin Data Table Component
 */
export default function AdminDataTable({
  title,
  description,
  columns = [],
  dataSource = [],
  loading = false,
  error = null,
  rowKey = 'id',
  searchable = true,
  searchPlaceholder = 'Search records...',
  searchKeys = [],
  filterable = true,
  filters = [],
  onRefresh,
  onAdd,
  addLabel = 'Add Record',
  onBulkImport,
  enableBulkImport = true,
  onEdit,
  onDelete,
  onBulkDelete,
  onBulkStatusChange,
  onView,
  extraHeaderActions,
  exportFileName = 'data_export',
  pageSize = 10,
  pageSizeOptions = ['10', '20', '50', '100'],
  enableRowSelection = true,
  enableBulkExport = true,
  viewDetailTitle = 'Record Details',
  renderCustomViewDetails,
}) {
  const adminTheme = useAdminTheme();

  let antdApp = null;
  try {
    antdApp = App.useApp();
  } catch {
    antdApp = null;
  }
  const showMessage = {
    success: (content) => (antdApp?.message ? antdApp.message.success(content) : console.log(content)),
    warning: (content) => (antdApp?.message ? antdApp.message.warning(content) : console.warn(content)),
    error: (content) => (antdApp?.message ? antdApp.message.error(content) : console.error(content)),
  };

  // State
  const [searchText, setSearchText] = useState('');
  const [selectedFilterValues, setSelectedFilterValues] = useState({});
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [visibleColumnKeys, setVisibleColumnKeys] = useState(() =>
    columns.map((c) => c.key || c.dataIndex || c.title)
  );

  // View Details Modal State
  const [viewRecord, setViewRecord] = useState(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);

  // Bulk Import Modal State
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [parsedPreviewData, setParsedPreviewData] = useState([]);
  const [parsedRawHeaders, setParsedRawHeaders] = useState([]);
  const [importDefaultStatus, setImportDefaultStatus] = useState('active');

  // Column visibility map
  const toggleColumnVisibility = (key) => {
    setVisibleColumnKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const resetColumnVisibility = () => {
    setVisibleColumnKeys(columns.map((c) => c.key || c.dataIndex || c.title));
  };

  // Filter & Search Logic
  const filteredData = useMemo(() => {
    if (!dataSource || !Array.isArray(dataSource)) return [];

    return dataSource.filter((item) => {
      // 1. Text Search Filter
      if (searchText.trim()) {
        const query = searchText.toLowerCase().trim();
        const matchesSearch =
          searchKeys.length > 0
            ? searchKeys.some((k) => String(item[k] || '').toLowerCase().includes(query))
            : Object.values(item).some((v) => {
                if (v === null || v === undefined) return false;
                if (typeof v === 'string' || typeof v === 'number') {
                  return String(v).toLowerCase().includes(query);
                }
                return false;
              });

        if (!matchesSearch) return false;
      }

      // 2. Custom Filter Dropdowns
      for (const [filterKey, filterValue] of Object.entries(selectedFilterValues)) {
        if (filterValue !== undefined && filterValue !== null && filterValue !== 'ALL') {
          if (String(item[filterKey]) !== String(filterValue)) {
            return false;
          }
        }
      }

      return true;
    });
  }, [dataSource, searchText, selectedFilterValues, searchKeys]);

  // Bulk Export Handlers
  const handleBulkExportDisplayed = () => {
    if (!filteredData.length) {
      showMessage.warning('No records available to export.');
      return;
    }
    const csv = convertToCsv(columns, filteredData);
    downloadCsvFile(csv, `${exportFileName}_displayed`);
    showMessage.success(`Successfully exported ${filteredData.length} records to CSV!`);
  };

  const handleBulkExportSelected = () => {
    if (!selectedRows.length) {
      showMessage.warning('Please select at least one row to export.');
      return;
    }
    const csv = convertToCsv(columns, selectedRows);
    downloadCsvFile(csv, `${exportFileName}_selected_${selectedRows.length}_rows`);
    showMessage.success(`Successfully exported ${selectedRows.length} selected records to CSV!`);
  };

  const handleBulkExportAll = () => {
    if (!dataSource.length) {
      showMessage.warning('Table has no data to export.');
      return;
    }
    const csv = convertToCsv(columns, dataSource);
    downloadCsvFile(csv, `${exportFileName}_all_${dataSource.length}_records`);
    showMessage.success(`Successfully exported all ${dataSource.length} records to CSV!`);
  };

  // Bulk Import Handlers
  const handleDownloadTemplate = () => {
    const csv = generateCsvTemplate(columns, dataSource[0]);
    downloadCsvFile(csv, `${exportFileName}_import_template`);
    showMessage.success('Sample CSV template downloaded!');
  };

  const handleFileSelect = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const { headers, rows } = parseCsvText(text);

        if (!headers.length || !rows.length) {
          showMessage.error('The selected CSV file appears to be empty or missing data rows.');
          return;
        }

        const mapped = mapCsvRowsToColumns(headers, rows, columns, importDefaultStatus);
        setImportFile(file);
        setParsedRawHeaders(headers);
        setParsedPreviewData(mapped);
        showMessage.success(`Successfully parsed ${mapped.length} records from ${file.name}!`);
      } catch (err) {
        console.error('Error parsing CSV:', err);
        showMessage.error('Failed to parse CSV file: ' + err.message);
      }
    };
    reader.onerror = () => {
      showMessage.error('Failed to read file from disk.');
    };
    reader.readAsText(file);
    return false; // prevent upload
  };

  const handleExecuteBulkImport = () => {
    if (!parsedPreviewData.length) {
      showMessage.warning('Please select and parse a valid CSV file first.');
      return;
    }

    setImporting(true);
    try {
      if (onBulkImport) {
        onBulkImport(parsedPreviewData);
      }
      showMessage.success(`Bulk import completed: ${parsedPreviewData.length} records added to the database!`);
      // Reset import state
      setImportModalVisible(false);
      setImportFile(null);
      setParsedPreviewData([]);
      setParsedRawHeaders([]);
    } catch (err) {
      console.error(err);
      showMessage.error('Error executing bulk import: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  const handleClearImportFile = () => {
    setImportFile(null);
    setParsedPreviewData([]);
    setParsedRawHeaders([]);
  };

  // Bulk Actions
  const handleClearSelection = () => {
    setSelectedRowKeys([]);
    setSelectedRows([]);
  };

  const handleConfirmBulkDelete = () => {
    if (onBulkDelete && selectedRowKeys.length > 0) {
      onBulkDelete(selectedRowKeys, selectedRows);
      handleClearSelection();
    }
  };

  // View Row Action
  const handleViewItem = (record) => {
    if (onView) {
      onView(record);
    } else {
      setViewRecord(record);
      setViewModalVisible(true);
    }
  };

  // Compute Active Table Columns
  const activeTableColumns = useMemo(() => {
    const filteredCols = columns.filter((col) => {
      const colId = col.key || col.dataIndex || col.title;
      return visibleColumnKeys.includes(colId);
    });

    const hasActions = filteredCols.some((c) => c.key === 'actions' || c.dataIndex === 'actions');
    if (!hasActions && (onView || onEdit || onDelete)) {
      filteredCols.push({
        title: 'Actions',
        key: 'actions',
        fixed: 'right',
        width: 130,
        render: (_, record) => (
          <Space size="small">
            <Tooltip title="View details">
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined style={{ color: '#2563eb' }} />}
                onClick={() => handleViewItem(record)}
              />
            </Tooltip>
            {onEdit && (
              <Tooltip title="Edit record">
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined style={{ color: '#d97706' }} />}
                  onClick={() => onEdit(record)}
                />
              </Tooltip>
            )}
            {onDelete && (
              <Popconfirm
                title="Delete Record"
                description="Are you sure you want to delete this record? This action cannot be undone."
                okText="Delete"
                cancelText="Cancel"
                okButtonProps={{ danger: true }}
                onConfirm={() => onDelete(record)}
              >
                <Tooltip title="Delete record">
                  <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                </Tooltip>
              </Popconfirm>
            )}
          </Space>
        ),
      });
    }

    return filteredCols;
  }, [columns, visibleColumnKeys, onView, onEdit, onDelete]);

  // Row selection configuration
  const rowSelectionConfig = enableRowSelection
    ? {
        selectedRowKeys,
        onChange: (keys, rows) => {
          setSelectedRowKeys(keys);
          setSelectedRows(rows);
        },
      }
    : null;

  // Export Menu Items
  const exportMenuItems = [
    {
      key: 'displayed',
      icon: <DownloadOutlined />,
      label: `Export Displayed Table Data (${filteredData.length} records)`,
      onClick: handleBulkExportDisplayed,
    },
    {
      key: 'selected',
      icon: <CheckSquareOutlined />,
      label: `Export Selected Rows (${selectedRowKeys.length} selected)`,
      disabled: selectedRowKeys.length === 0,
      onClick: handleBulkExportSelected,
    },
    {
      key: 'all',
      icon: <FileTextOutlined />,
      label: `Export All Database Records (${dataSource.length} total)`,
      onClick: handleBulkExportAll,
    },
  ];

  // Column Visibility Popover Content
  const columnVisibilityContent = (
    <div style={{ width: 220, maxHeight: 320, overflowY: 'auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 8,
          paddingBottom: 6,
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <Text strong style={{ fontSize: 13 }}>
          Columns
        </Text>
        <Button type="link" size="small" style={{ padding: 0 }} onClick={resetColumnVisibility}>
          Show All
        </Button>
      </div>
      <Space direction="vertical" style={{ width: '100%' }}>
        {columns
          .filter((c) => c.title && c.key !== 'actions' && c.dataIndex !== 'actions')
          .map((col) => {
            const colId = col.key || col.dataIndex || col.title;
            const isChecked = visibleColumnKeys.includes(colId);
            return (
              <Checkbox key={colId} checked={isChecked} onChange={() => toggleColumnVisibility(colId)}>
                {typeof col.title === 'string' ? col.title : colId}
              </Checkbox>
            );
          })}
      </Space>
    </div>
  );

  return (
    <Card
      variant="outlined"
      style={{
        borderRadius: 12,
        background: adminTheme.card,
        borderColor: adminTheme.border,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        marginBottom: 24,
      }}
      styles={{ body: { padding: '20px 24px' } }}
    >
      {/* Title & Top Bar */}
      <Row justify="space-between" align="middle" gutter={[16, 16]} style={{ marginBottom: 18 }}>
        <Col xs={24} md={10}>
          {title && (
            <Title
              level={4}
              style={{ margin: 0, color: adminTheme.text, display: 'flex', alignItems: 'center', gap: 8 }}
            >
              {title}
              <Tag color="blue" style={{ borderRadius: 12, padding: '1px 8px', fontSize: 12 }}>
                {filteredData.length} records
              </Tag>
            </Title>
          )}
          {description && (
            <Text type="secondary" style={{ fontSize: 13, display: 'block', marginTop: 4 }}>
              {description}
            </Text>
          )}
        </Col>

        {/* Top Header Actions */}
        <Col xs={24} md={14} style={{ textAlign: 'right' }}>
          <Space wrap size="middle" style={{ justifyContent: 'flex-end', width: '100%' }}>
            {extraHeaderActions}

            {/* Bulk Import Button */}
            {enableBulkImport && (
              <Button
                icon={<UploadOutlined />}
                onClick={() => setImportModalVisible(true)}
                style={{
                  borderRadius: 8,
                  fontWeight: 500,
                  borderColor: adminTheme.isDark ? 'rgba(16, 185, 129, 0.4)' : '#10b981',
                  color: adminTheme.isDark ? '#34d399' : '#059669',
                  background: adminTheme.isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5',
                }}
              >
                Bulk Import CSV
              </Button>
            )}

            {/* Bulk Export Dropdown */}
            {enableBulkExport && (
              <Dropdown menu={{ items: exportMenuItems }} placement="bottomRight">
                <Button
                  icon={<DownloadOutlined />}
                  style={{
                    borderRadius: 8,
                    fontWeight: 500,
                    borderColor: adminTheme.isDark ? 'rgba(37, 99, 235, 0.45)' : '#2563eb',
                    color: adminTheme.isDark ? '#60a5fa' : '#2563eb',
                    background: adminTheme.isDark ? 'rgba(37, 99, 235, 0.12)' : 'transparent',
                  }}
                >
                  Export CSV {selectedRowKeys.length > 0 ? `(${selectedRowKeys.length})` : ''}
                </Button>
              </Dropdown>
            )}

            {/* Refresh Data */}
            {onRefresh && (
              <Tooltip title="Refresh Table Data">
                <Button
                  icon={<ReloadOutlined spin={loading} />}
                  onClick={onRefresh}
                  style={{ borderRadius: 8 }}
                />
              </Tooltip>
            )}

            {/* Add Record Button */}
            {onAdd && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={onAdd}
                style={{
                  borderRadius: 8,
                  fontWeight: 500,
                  background: '#2563eb',
                  boxShadow: '0 2px 4px rgba(37,99,235,0.2)',
                }}
              >
                {addLabel}
              </Button>
            )}
          </Space>
        </Col>
      </Row>

      {/* Error Alert State */}
      {error && (
        <Alert
          type="error"
          showIcon
          message="Failed to load table data"
          description={error}
          action={
            onRefresh && (
              <Button size="small" type="primary" danger onClick={onRefresh}>
                Retry
              </Button>
            )
          }
          style={{ marginBottom: 16, borderRadius: 8 }}
        />
      )}

      {/* Search, Filters, and Column Visibility Bar */}
      <Row gutter={[12, 12]} align="middle" style={{ marginBottom: 16 }}>
        {/* Search Input */}
        {searchable && (
          <Col xs={24} sm={12} md={8}>
            <Input
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              placeholder={searchPlaceholder}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              style={{ borderRadius: 8 }}
            />
          </Col>
        )}

        {/* Custom Filter Selects */}
        {filterable &&
          filters.map((filter) => (
            <Col xs={12} sm={6} md={4} key={filter.key}>
              <Select
                placeholder={filter.label}
                value={selectedFilterValues[filter.key] ?? 'ALL'}
                onChange={(val) =>
                  setSelectedFilterValues((prev) => ({
                    ...prev,
                    [filter.key]: val,
                  }))
                }
                style={{ width: '100%' }}
                options={[{ label: `All ${filter.label}`, value: 'ALL' }, ...filter.options]}
              />
            </Col>
          ))}

        {/* Clear Filters Button */}
        {(searchText || Object.values(selectedFilterValues).some((v) => v && v !== 'ALL')) && (
          <Col xs={12} sm={6} md={3}>
            <Button
              type="dashed"
              icon={<ClearOutlined />}
              onClick={() => {
                setSearchText('');
                setSelectedFilterValues({});
              }}
              style={{ borderRadius: 8, width: '100%' }}
            >
              Clear
            </Button>
          </Col>
        )}

        {/* Spacer */}
        <Col flex="auto" />

        {/* Columns Visibility Popover */}
        <Col>
          <Popover content={columnVisibilityContent} trigger="click" placement="bottomRight">
            <Tooltip title="Customize Columns">
              <Button icon={<SettingOutlined />} style={{ borderRadius: 8 }}>
                Columns
              </Button>
            </Tooltip>
          </Popover>
        </Col>
      </Row>

      {/* Floating Bulk Action Bar (when rows are selected) */}
      {selectedRowKeys.length > 0 && (
        <Alert
          type="info"
          showIcon
          icon={<CheckSquareOutlined style={{ color: adminTheme.primary }} />}
          style={{
            marginBottom: 16,
            borderRadius: 8,
            backgroundColor: adminTheme.isDark ? 'rgba(37, 99, 235, 0.18)' : '#eff6ff',
            borderColor: adminTheme.isDark ? 'rgba(37, 99, 235, 0.35)' : '#bfdbfe',
          }}
          message={
            <Row justify="space-between" align="middle" style={{ width: '100%' }}>
              <Col>
                <Text strong style={{ color: adminTheme.isDark ? '#93c5fd' : '#1e40af' }}>
                  {selectedRowKeys.length} {selectedRowKeys.length === 1 ? 'record' : 'records'} selected
                </Text>
              </Col>
              <Col>
                <Space size="middle">
                  {/* Bulk Export Selected to CSV */}
                  {enableBulkExport && (
                    <Button
                      size="small"
                      type="primary"
                      icon={<DownloadOutlined />}
                      onClick={handleBulkExportSelected}
                      style={{ background: '#2563eb', borderRadius: 6 }}
                    >
                      Export CSV ({selectedRowKeys.length})
                    </Button>
                  )}

                  {/* Bulk Status Change */}
                  {onBulkStatusChange && (
                    <Dropdown
                      menu={{
                        items: [
                          {
                            key: 'active',
                            label: 'Set as Active / Published',
                            onClick: () => onBulkStatusChange(selectedRowKeys, 'active'),
                          },
                          {
                            key: 'inactive',
                            label: 'Set as Inactive / Draft',
                            onClick: () => onBulkStatusChange(selectedRowKeys, 'inactive'),
                          },
                        ],
                      }}
                    >
                      <Button size="small" style={{ borderRadius: 6 }}>
                        Bulk Status
                      </Button>
                    </Dropdown>
                  )}

                  {/* Bulk Delete */}
                  {onBulkDelete && (
                    <Popconfirm
                      title="Bulk Delete"
                      description={`Are you sure you want to permanently delete these ${selectedRowKeys.length} records?`}
                      okText="Yes, Delete All"
                      cancelText="Cancel"
                      okButtonProps={{ danger: true }}
                      onConfirm={handleConfirmBulkDelete}
                    >
                      <Button size="small" danger icon={<DeleteOutlined />} style={{ borderRadius: 6 }}>
                        Delete Selected
                      </Button>
                    </Popconfirm>
                  )}

                  <Button
                    size="small"
                    type="link"
                    onClick={handleClearSelection}
                    style={{ color: adminTheme.subtext }}
                  >
                    Deselect All
                  </Button>
                </Space>
              </Col>
            </Row>
          }
        />
      )}

      {/* Main Ant Design Table */}
      <Table
        rowKey={rowKey}
        columns={activeTableColumns}
        dataSource={filteredData}
        loading={loading}
        rowSelection={rowSelectionConfig}
        pagination={{
          defaultPageSize: pageSize,
          pageSizeOptions: pageSizeOptions,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => (
            <span style={{ color: adminTheme.subtext, fontSize: 13 }}>
              Showing {range[0]}-{range[1]} of {total} records
            </span>
          ),
        }}
        scroll={{ x: 'max-content' }}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span>
                  {searchText ? 'No matching records found' : 'No data records available yet'}
                </span>
              }
            >
              {onAdd && !searchText && (
                <Button
                  type="primary"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={onAdd}
                  style={{ background: '#2563eb' }}
                >
                  {addLabel}
                </Button>
              )}
            </Empty>
          ),
        }}
      />

      {/* Standard View Details Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileTextOutlined style={{ color: '#2563eb' }} />
            <span>{viewDetailTitle}</span>
          </div>
        }
        open={viewModalVisible}
        onCancel={() => {
          setViewModalVisible(false);
          setViewRecord(null);
        }}
        footer={[
          <Button key="close" type="primary" onClick={() => setViewModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={720}
        destroyOnHidden
      >
        {viewRecord &&
          (renderCustomViewDetails ? (
            renderCustomViewDetails(viewRecord)
          ) : (
            <Descriptions bordered column={2} size="middle" style={{ marginTop: 12 }}>
              {Object.entries(viewRecord).map(([key, val]) => {
                const isImage =
                  typeof val === 'string' &&
                  (val.startsWith('http') || val.startsWith('/')) &&
                  val.match(/\.(jpeg|jpg|gif|png|webp|svg)/i);
                let displayVal = val;

                if (val === null || val === undefined) displayVal = <Text type="secondary">N/A</Text>;
                else if (typeof val === 'boolean')
                  displayVal = <Tag color={val ? 'green' : 'red'}>{val ? 'Active' : 'Inactive'}</Tag>;
                else if (isImage) {
                  displayVal = (
                    <div>
                      <img
                        src={val}
                        alt={key}
                        style={{
                          maxHeight: 90,
                          borderRadius: 6,
                          border: '1px solid #e2e8f0',
                          objectFit: 'cover',
                        }}
                      />
                      <div
                        style={{
                          fontSize: 11,
                          color: '#94a3b8',
                          marginTop: 4,
                          wordBreak: 'break-all',
                        }}
                      >
                        {val}
                      </div>
                    </div>
                  );
                } else if (typeof val === 'object') {
                  displayVal = (
                    <pre
                      style={{
                        fontSize: 11,
                        maxHeight: 120,
                        overflow: 'auto',
                        background: adminTheme.isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc',
                        color: adminTheme.text,
                        border: `1px solid ${adminTheme.border}`,
                        padding: 6,
                        borderRadius: 4,
                      }}
                    >
                      {JSON.stringify(val, null, 2)}
                    </pre>
                  );
                } else if (key === 'status') {
                  displayVal = (
                    <Tag
                      color={
                        String(val).toLowerCase() === 'active' ||
                        String(val).toLowerCase() === 'published'
                          ? 'green'
                          : 'orange'
                      }
                    >
                      {String(val)}
                    </Tag>
                  );
                }

                return (
                  <Descriptions.Item
                    key={key}
                    label={<strong style={{ textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</strong>}
                    span={isImage || typeof val === 'object' || String(val).length > 50 ? 2 : 1}
                  >
                    {displayVal}
                  </Descriptions.Item>
                );
              })}
            </Descriptions>
          ))}
      </Modal>

      {/* Bulk Import Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <UploadOutlined style={{ color: '#059669', fontSize: 18 }} />
            <span>Bulk Import Records via CSV</span>
          </div>
        }
        open={importModalVisible}
        onCancel={() => {
          setImportModalVisible(false);
          handleClearImportFile();
        }}
        width={780}
        destroyOnHidden
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setImportModalVisible(false);
              handleClearImportFile();
            }}
          >
            Cancel
          </Button>,
          importFile && (
            <Button key="clear" onClick={handleClearImportFile} style={{ marginRight: 8 }}>
              Choose Different File
            </Button>
          ),
          <Button
            key="submit"
            type="primary"
            icon={<CheckCircleOutlined />}
            disabled={!parsedPreviewData.length}
            loading={importing}
            onClick={handleExecuteBulkImport}
            style={{
              background: '#059669',
              borderColor: '#059669',
              fontWeight: 600,
            }}
          >
            {parsedPreviewData.length > 0
              ? `Import ${parsedPreviewData.length} Records to Database`
              : 'Import Records'}
          </Button>,
        ]}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%', marginTop: 8 }}>
          {/* Instructions and Template Download */}
          <Alert
            type="info"
            showIcon
            icon={<InfoCircleOutlined style={{ color: '#2563eb' }} />}
            message="Instructions for Bulk CSV Import"
            description={
              <div>
                <p style={{ margin: '4px 0 8px 0' }}>
                  Upload a standard CSV file with column headers matching the table fields. New records will be automatically validated, mapped, and added to the database.
                </p>
                <Button
                  size="small"
                  icon={<DownloadOutlined />}
                  onClick={handleDownloadTemplate}
                  style={{ borderRadius: 6, fontWeight: 500 }}
                >
                  Download Sample CSV Template
                </Button>
              </div>
            }
            style={{ borderRadius: 8 }}
          />

          {/* Dragger Upload Zone */}
          {!importFile ? (
            <Dragger
              name="file"
              accept=".csv,text/csv,application/vnd.ms-excel"
              multiple={false}
              beforeUpload={handleFileSelect}
              showUploadList={false}
              style={{
                padding: '24px 16px',
                borderRadius: 12,
                border: adminTheme.isDark ? '2px dashed rgba(59, 130, 246, 0.4)' : '2px dashed #93c5fd',
                background: adminTheme.cardMuted,
              }}
            >
              <p className="ant-upload-drag-icon" style={{ marginBottom: 12 }}>
                <InboxOutlined style={{ fontSize: 44, color: adminTheme.primary }} />
              </p>
              <p className="ant-upload-text" style={{ fontSize: 15, fontWeight: 600, color: adminTheme.text }}>
                Click or drag a CSV file to this area to bulk import
              </p>
              <p className="ant-upload-hint" style={{ color: adminTheme.subtext, fontSize: 13 }}>
                Supports standard comma-separated (.csv) files formatted in UTF-8
              </p>
            </Dragger>
          ) : (
            <Card
              size="small"
              style={{ borderRadius: 8, background: '#f0fdf4', borderColor: '#bbf7d0' }}
            >
              <Row justify="space-between" align="middle">
                <Col>
                  <Space>
                    <FileExcelOutlined style={{ fontSize: 24, color: '#16a34a' }} />
                    <div>
                      <Text strong style={{ fontSize: 14 }}>{importFile.name}</Text>
                      <div style={{ fontSize: 12, color: '#166534' }}>
                        Size: {(importFile.size / 1024).toFixed(1)} KB • {parsedPreviewData.length} valid records parsed
                      </div>
                    </div>
                  </Space>
                </Col>
                <Col>
                  <Space>
                    <Text style={{ fontSize: 13 }}>Default Status:</Text>
                    <Select
                      size="small"
                      value={importDefaultStatus}
                      onChange={(val) => {
                        setImportDefaultStatus(val);
                        // Re-map with new default status
                        const mapped = mapCsvRowsToColumns(parsedRawHeaders, parsedPreviewData, columns, val);
                        setParsedPreviewData(mapped);
                      }}
                      options={[
                        { label: 'Active / Published', value: 'active' },
                        { label: 'Draft / Inactive', value: 'draft' },
                        { label: 'Pending Moderation', value: 'pending' },
                      ]}
                      style={{ width: 160 }}
                    />
                  </Space>
                </Col>
              </Row>
            </Card>
          )}

          {/* Live Preview Table */}
          {parsedPreviewData.length > 0 && (
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
                }}
              >
                <Text strong style={{ fontSize: 13, color: '#334155' }}>
                  Previewing First 5 Records (of {parsedPreviewData.length} total):
                </Text>
                <Tag color="green">Ready to import</Tag>
              </div>

              <Table
                size="small"
                rowKey="id"
                dataSource={parsedPreviewData.slice(0, 5)}
                pagination={false}
                bordered
                scroll={{ x: 'max-content' }}
                columns={columns
                  .filter((c) => c.key !== 'actions' && c.dataIndex !== 'actions')
                  .slice(0, 6)
                  .map((col) => ({
                    title: col.title,
                    dataIndex: col.dataIndex || col.key,
                    key: col.key || col.dataIndex,
                    render: (text, record) => {
                      if (col.render) {
                        try {
                          return col.render(text, record);
                        } catch {
                          return String(text ?? '');
                        }
                      }
                      return String(text ?? '');
                    },
                  }))}
              />
            </div>
          )}
        </Space>
      </Modal>
    </Card>
  );
}
