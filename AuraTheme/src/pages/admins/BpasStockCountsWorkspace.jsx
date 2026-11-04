import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Input,
  Select,
  Modal,
  Form,
  InputNumber,
  Radio,
  Row,
  Col,
  Statistic,
  message,
  Popconfirm,
  Tooltip,
  Divider,
  Alert,
  Tabs,
  Typography,
  Badge,
  Spin,
  Empty,
  Upload,
} from 'antd';
import {
  BarcodeOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  PrinterOutlined,
  DownloadOutlined,
  UploadOutlined,
  DeleteOutlined,
  FileTextOutlined,
  EyeOutlined,
  ScanOutlined,
  EditOutlined,
  SwapOutlined,
  ArrowRightOutlined,
  ApartmentOutlined,
  InboxOutlined,
  SoundOutlined,
  CameraOutlined,
  ThunderboltOutlined,
  SyncOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import jsQR from 'jsqr';
import TableActionDropdown from '../../components/common/TableActionDropdown';
import { useAdminTheme } from '../../hooks/useAdminTheme';

const { Option } = Select;
const { Text, Title } = Typography;

export default function BpasStockCountsWorkspace({ onNavigateAdjustment = null }) {
  const adminTheme = useAdminTheme();
  const isDark = adminTheme?.isDark;
  // Theme & State
  const [loading, setLoading] = useState(false);
  const [countsList, setCountsList] = useState([]);
  const [stats, setStats] = useState({
    total_audits: 0,
    draft_audits: 0,
    completed_audits: 0,
    total_differences: 0,
    total_matches: 0,
  });
  const [pagination, setPagination] = useState({ current_page: 1, limit: 15, total_records: 0 });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterWarehouse, setFilterWarehouse] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Metadata options
  const [metaOptions, setMetaOptions] = useState({
    warehouses: [],
    categories: [],
    brands: [],
    nextReferenceNo: '',
  });

  // Modal States
  // 1. Create Count Modal (count_stock.php)
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createForm] = Form.useForm();
  const [countTypeChoice, setCountTypeChoice] = useState('full');
  const [submittingCreate, setSubmittingCreate] = useState(false);

  // 2. View Count Modal (view_count.php)
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedCountDetails, setSelectedCountDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // 3. Live Count & Barcode Scanning Workspace (scan_count.php & update_stock_count_item)
  const [scanModalVisible, setScanModalVisible] = useState(false);
  const [activeAudit, setActiveAudit] = useState(null);
  const [auditItems, setAuditItems] = useState([]);
  const [scanFilter, setScanFilter] = useState('all'); // 'all' | 'diff' | 'uncounted' | 'matches'
  const [scanSearch, setScanSearch] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scanQuantityDelta, setScanQuantityDelta] = useState(1);
  const [recentScans, setRecentScans] = useState([]);
  const [savingProgress, setSavingProgress] = useState(false);
  const barcodeInputRef = useRef(null);

  // 4. Finalize Count & CSV Upload Modal (finalize_count.php)
  const [finalizeModalVisible, setFinalizeModalVisible] = useState(false);
  const [countToFinalize, setCountToFinalize] = useState(null);
  const [csvUploadText, setCsvUploadText] = useState('');
  const [submittingFinalize, setSubmittingFinalize] = useState(false);

  // 5. Device Camera Barcode & QR Scanner Modal
  const [cameraModalVisible, setCameraModalVisible] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [cameraDevices, setCameraDevices] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [continuousScan, setContinuousScan] = useState(true);
  const [lastScannedFeedback, setLastScannedFeedback] = useState(null);
  const [cameraRecentScans, setCameraRecentScans] = useState([]);

  const videoRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const barcodeDetectorRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const lastScannedCodeRef = useRef('');
  const lastScannedTimeRef = useRef(0);
  const isProcessingScanRef = useRef(false);

  // Stop camera stream safely
  const stopCameraStream = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (_) {}
      });
      cameraStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setTorchEnabled(false);
    setTorchSupported(false);
  };

  // Play Beep Sound on Barcode Scan
  const playScanBeep = (type = 'success') => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.08);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
      }
    } catch (_) {}
  };

  // Fetch Metadata
  const fetchMetadata = async () => {
    try {
      const res = await axios.get('/api/admin/products/stock-counts/meta/options');
      if (res.data?.success && res.data?.data) {
        setMetaOptions(res.data.data);
      }
    } catch (err) {
      console.error('[StockCounts] Failed to load metadata:', err);
    }
  };

  // Fetch Stock Counts List
  const fetchStockCounts = async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        search: searchTerm,
        warehouse_id: filterWarehouse,
        type: filterType,
        status: filterStatus,
        page,
        limit: pagination.limit || 15,
      };

      const res = await axios.get('/api/admin/products/stock-counts', { params });
      if (res.data?.success) {
        setCountsList(res.data.data || []);
        setStats(
          res.data.stats || {
            total_audits: 0,
            draft_audits: 0,
            completed_audits: 0,
            total_differences: 0,
            total_matches: 0,
          }
        );
        setPagination(res.data.pagination || { current_page: page, limit: 15, total_records: 0 });
      }
    } catch (err) {
      console.error('[StockCounts] Failed to load stock counts:', err);
      message.error('Failed to load stock count audits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetadata();
    fetchStockCounts(1);
  }, []);

  // Handle Search Trigger
  const handleApplyFilter = () => {
    fetchStockCounts(1);
  };

  // Open Details Modal
  const handleOpenDetails = async (record) => {
    setViewModalVisible(true);
    setLoadingDetails(true);
    try {
      const res = await axios.get(`/api/admin/products/stock-counts/${record.id}`);
      if (res.data?.success) {
        setSelectedCountDetails(res.data.data);
      }
    } catch (err) {
      message.error('Failed to retrieve count details');
    } finally {
      setLoadingDetails(false);
    }
  };

  // Open Live Count & Scan Workspace
  const handleOpenScanWorkspace = async (record) => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/admin/products/stock-counts/${record.id}`);
      if (res.data?.success) {
        setActiveAudit(res.data.data);
        setAuditItems(res.data.data.items || []);
        setRecentScans([]);
        setScanModalVisible(true);
        setTimeout(() => barcodeInputRef.current?.focus(), 300);
      }
    } catch (err) {
      message.error('Failed to load audit items');
    } finally {
      setLoading(false);
    }
  };

  // Handle Barcode Scan Entry (USB scanner gun or manual input)
  const handleScanBarcode = async (e, manualCode = null) => {
    e?.preventDefault?.();
    const barcode = (manualCode !== null ? manualCode : barcodeInput || '').trim();
    if (!barcode) return;

    try {
      const res = await axios.post(`/api/admin/products/stock-counts/${activeAudit.id}/scan`, {
        barcode,
        quantity_delta: scanQuantityDelta || 1,
      });

      if (res.data?.success) {
        playScanBeep('success');
        const scannedData = res.data.data;

        // Update local audit item
        let diff = 0;
        setAuditItems((prev) =>
          prev.map((it) => {
            if (it.id === scannedData.item_id) {
              diff = scannedData.counted - it.expected;
              return {
                ...it,
                counted: scannedData.counted,
                difference: diff,
                difference_cost: Math.round(diff * it.cost * 100) / 100,
                is_counted: true,
              };
            }
            return it;
          })
        );

        // Add to recent scans log
        const newScanEntry = {
          id: Date.now(),
          time: new Date().toLocaleTimeString(),
          code: scannedData.product_code || barcode,
          name: scannedData.product_name,
          delta: scanQuantityDelta || 1,
          totalCounted: scannedData.counted,
          diff,
        };
        setRecentScans((prev) => [newScanEntry, ...prev.slice(0, 19)]);

        message.success(`Counted: ${scannedData.product_name} (${scannedData.counted} pcs)`);
        if (manualCode === null) {
          setBarcodeInput('');
          barcodeInputRef.current?.focus();
        }
        return { success: true, data: scannedData, diff };
      }
    } catch (err) {
      playScanBeep('error');
      message.error(err.response?.data?.message || 'Barcode scan failed');
      if (manualCode === null) {
        setBarcodeInput('');
      }
      return { success: false, error: err };
    }
  };

  // Check device camera and launch Camera Scanner
  const handleStartCameraScan = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      message.warning('Camera is not supported on this browser or insecure connection. Please use a USB barcode scanner gun or enter code manually.');
      barcodeInputRef.current?.focus();
      return;
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === 'videoinput');
      if (videoInputs.length === 0) {
        message.warning('No camera device found on this computer. Please connect a webcam or use a mobile device.');
        barcodeInputRef.current?.focus();
        return;
      }
      setCameraModalVisible(true);
    } catch (err) {
      // If enumerateDevices needs permission first, still open modal to prompt
      setCameraModalVisible(true);
    }
  };

  // Button Click Handler for "Scan Count"
  const handleScanCountClick = async (e) => {
    e?.preventDefault?.();
    if (barcodeInput && barcodeInput.trim()) {
      await handleScanBarcode(e);
    } else {
      await handleStartCameraScan();
    }
  };

  // Camera Barcode Scanning lifecycle & detection loop
  useEffect(() => {
    if (!cameraModalVisible || !activeAudit) {
      stopCameraStream();
      return;
    }

    let isCancelled = false;

    const startCamera = async () => {
      setCameraLoading(true);
      setCameraError(null);
      setLastScannedFeedback(null);

      // Check BarcodeDetector support
      if ('BarcodeDetector' in window) {
        try {
          barcodeDetectorRef.current = new window.BarcodeDetector({
            formats: [
              'code_128',
              'code_39',
              'code_93',
              'codabar',
              'data_matrix',
              'ean_13',
              'ean_8',
              'itf',
              'pdf417',
              'qr_code',
              'upc_a',
              'upc_e',
            ],
          });
        } catch (_) {
          try {
            barcodeDetectorRef.current = new window.BarcodeDetector();
          } catch (e) {
            barcodeDetectorRef.current = null;
          }
        }
      }

      // Enumerate camera devices
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setCameraDevices(videoInputs);
      } catch (_) {}

      // Constraints (prefer environment/back camera on phones/tablets)
      const constraints = {
        video: selectedCameraId
          ? { deviceId: { exact: selectedCameraId } }
          : {
              facingMode: { ideal: 'environment' },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
      };

      let stream = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        // Fallback for laptops or webcams that don't support facingMode constraint
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        } catch (err2) {
          if (!isCancelled) {
            if (err2.name === 'NotAllowedError' || err2.name === 'PermissionDeniedError') {
              setCameraError('Camera access was denied. Please allow camera permissions in your browser address bar.');
            } else if (err2.name === 'NotFoundError' || err2.name === 'DevicesNotFoundError') {
              setCameraError('No camera detected on this device.');
            } else {
              setCameraError(err2.message || 'Unable to access device camera.');
            }
            setCameraLoading(false);
          }
          return;
        }
      }

      if (isCancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      cameraStreamRef.current = stream;

      // Check torch capability
      try {
        const track = stream.getVideoTracks()[0];
        const capabilities = track?.getCapabilities ? track.getCapabilities() : {};
        setTorchSupported(Boolean(capabilities?.torch));
      } catch (_) {
        setTorchSupported(false);
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        try {
          await videoRef.current.play();
        } catch (_) {}
      }

      setCameraLoading(false);

      // Detection Loop (BarcodeDetector + jsQR fallback)
      const offscreenCanvas = document.createElement('canvas');
      const decodeQR = typeof jsQR === 'function' ? jsQR : jsQR?.default || null;

      scanIntervalRef.current = setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) return;
        if (isProcessingScanRef.current) return;

        let detectedBarcode = null;

        // 1. Try native BarcodeDetector
        if (barcodeDetectorRef.current) {
          try {
            const detected = await barcodeDetectorRef.current.detect(videoRef.current);
            if (detected && detected.length > 0) {
              detectedBarcode = detected[0].rawValue;
            }
          } catch (_) {}
        }

        // 2. jsQR Fallback
        if (!detectedBarcode && decodeQR) {
          try {
            const v = videoRef.current;
            if (v.videoWidth && v.videoHeight) {
              if (offscreenCanvas.width !== v.videoWidth || offscreenCanvas.height !== v.videoHeight) {
                offscreenCanvas.width = v.videoWidth;
                offscreenCanvas.height = v.videoHeight;
              }
              const ctx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
              ctx.drawImage(v, 0, 0, offscreenCanvas.width, offscreenCanvas.height);
              const imgData = ctx.getImageData(0, 0, offscreenCanvas.width, offscreenCanvas.height);
              const qr = decodeQR(imgData.data, imgData.width, imgData.height);
              if (qr && qr.data) {
                detectedBarcode = qr.data;
              }
            }
          } catch (_) {}
        }

        if (detectedBarcode) {
          const now = Date.now();
          if (
            detectedBarcode === lastScannedCodeRef.current &&
            now - lastScannedTimeRef.current < 1500
          ) {
            return;
          }
          lastScannedCodeRef.current = detectedBarcode;
          lastScannedTimeRef.current = now;

          // Process the detected barcode
          isProcessingScanRef.current = true;
          try {
            const res = await axios.post(`/api/admin/products/stock-counts/${activeAudit.id}/scan`, {
              barcode: detectedBarcode,
              quantity_delta: scanQuantityDelta || 1,
            });

            if (res.data?.success) {
              playScanBeep('success');
              if (navigator.vibrate) navigator.vibrate(80);
              const scannedData = res.data.data;

              let diff = 0;
              setAuditItems((prev) =>
                prev.map((it) => {
                  if (it.id === scannedData.item_id) {
                    diff = scannedData.counted - it.expected;
                    return {
                      ...it,
                      counted: scannedData.counted,
                      difference: diff,
                      difference_cost: Math.round(diff * it.cost * 100) / 100,
                      is_counted: true,
                    };
                  }
                  return it;
                })
              );

              const newRecord = {
                id: Date.now(),
                time: new Date().toLocaleTimeString(),
                code: scannedData.product_code || detectedBarcode,
                name: scannedData.product_name,
                delta: scanQuantityDelta || 1,
                totalCounted: scannedData.counted,
                diff,
              };

              setRecentScans((prev) => [newRecord, ...prev.slice(0, 19)]);
              setCameraRecentScans((prev) => [newRecord, ...prev.slice(0, 9)]);

              setLastScannedFeedback({
                status: 'success',
                product_name: scannedData.product_name,
                product_code: scannedData.product_code || detectedBarcode,
                counted: scannedData.counted,
                delta: scanQuantityDelta || 1,
                diff,
              });

              if (!continuousScan) {
                setCameraModalVisible(false);
                message.success(`Counted: ${scannedData.product_name} (${scannedData.counted} pcs)`);
              }
            }
          } catch (err) {
            playScanBeep('error');
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
            setLastScannedFeedback({
              status: 'error',
              product_code: detectedBarcode,
              message: err.response?.data?.message || `Barcode "${detectedBarcode}" not found in this audit`,
            });
          } finally {
            setTimeout(() => {
              isProcessingScanRef.current = false;
            }, 800);
          }
        }
      }, 120);
    };

    startCamera();

    return () => {
      isCancelled = true;
      stopCameraStream();
    };
  }, [cameraModalVisible, activeAudit, selectedCameraId, scanQuantityDelta, continuousScan]);

  // Flashlight toggle
  const handleToggleTorch = async () => {
    if (!cameraStreamRef.current) return;
    try {
      const track = cameraStreamRef.current.getVideoTracks()[0];
      const next = !torchEnabled;
      await track.applyConstraints({
        advanced: [{ torch: next }],
      });
      setTorchEnabled(next);
    } catch (_) {
      message.error('Flashlight could not be toggled on this device');
    }
  };

  // Update item counted quantity in table editor
  const handleUpdateItemCount = (itemId, val) => {
    setAuditItems((prev) =>
      prev.map((it) => {
        if (it.id === itemId) {
          const countedVal = val !== null && val !== undefined && val !== '' ? parseFloat(val) : null;
          const diff = countedVal !== null ? countedVal - it.expected : null;
          return {
            ...it,
            counted: countedVal,
            difference: diff,
            difference_cost: diff !== null ? Math.round(diff * it.cost * 100) / 100 : 0,
            is_counted: countedVal !== null,
          };
        }
        return it;
      })
    );
  };

  // Save Progress (Draft update)
  const handleSaveCountProgress = async () => {
    if (!activeAudit) return;
    setSavingProgress(true);
    try {
      const payload = {
        items: auditItems.map((it) => ({
          id: it.id,
          counted: it.counted,
          expiry: it.expiry,
        })),
        status: 0,
      };

      const res = await axios.put(`/api/admin/products/stock-counts/${activeAudit.id}/items`, payload);
      if (res.data?.success) {
        message.success('Stock count progress saved successfully');
        fetchStockCounts(pagination.current_page);
      }
    } catch (err) {
      message.error('Failed to save count progress');
    } finally {
      setSavingProgress(false);
    }
  };

  // Initiate New Count Submission
  const handleCreateStockCount = async (values) => {
    if (countTypeChoice === 'partial') {
      const hasCats = Array.isArray(values.categories) && values.categories.length > 0;
      const hasBrands = Array.isArray(values.brands) && values.brands.length > 0;
      if (!hasCats && !hasBrands) {
        message.warning('Please select at least one Category or Brand for a Partial Audit, or switch to Full Warehouse Count.');
        return;
      }
    }
    setSubmittingCreate(true);
    try {
      const payload = {
        warehouse_id: values.warehouse_id,
        date: values.date ? values.date : new Date().toISOString(),
        reference_no: values.reference_no,
        type: countTypeChoice,
        categories: countTypeChoice === 'partial' ? values.categories : [],
        brands: countTypeChoice === 'partial' ? values.brands : [],
        note: values.note || '',
      };

      const res = await axios.post('/api/admin/products/stock-counts', payload);
      if (res.data?.success) {
        message.success(res.data.message || 'Stock count initiated successfully');
        setCreateModalVisible(false);
        createForm.resetFields();
        fetchStockCounts(1);

        // Open newly created count in scan/count editor immediately
        if (res.data.data?.id) {
          handleOpenScanWorkspace(res.data.data);
        }
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to initiate stock count';
      message.error(errorMsg);
    } finally {
      setSubmittingCreate(false);
    }
  };

  // Download Initial Count CSV
  const handleDownloadCsv = (countId, referenceNo) => {
    window.open(`/api/admin/products/stock-counts/${countId}/export-csv`, '_blank');
  };

  // Open Finalize Dialog
  const handleOpenFinalizeModal = (record) => {
    setCountToFinalize(record);
    setCsvUploadText('');
    setFinalizeModalVisible(true);
  };

  // Submit Finalize (Manual or via CSV upload)
  const handleConfirmFinalize = async () => {
    if (!countToFinalize) return;
    setSubmittingFinalize(true);
    try {
      if (csvUploadText && csvUploadText.trim()) {
        // Finalize via CSV import
        const res = await axios.post(`/api/admin/products/stock-counts/${countToFinalize.id}/import-csv`, {
          csv_text: csvUploadText,
          finalize: true,
        });
        if (res.data?.success) {
          message.success(res.data.message || 'Stock count finalized with imported CSV');
          setFinalizeModalVisible(false);
          fetchStockCounts(pagination.current_page);
        }
      } else {
        // Direct finalize
        const res = await axios.post(`/api/admin/products/stock-counts/${countToFinalize.id}/finalize`, {
          note: countToFinalize.note || 'Finalized stock count audit',
        });
        if (res.data?.success) {
          message.success('Stock count finalized successfully');
          setFinalizeModalVisible(false);
          fetchStockCounts(pagination.current_page);
        }
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to finalize stock count');
    } finally {
      setSubmittingFinalize(false);
    }
  };

  // Convert Count Discrepancies into Official Inventory Adjustment (add_adjustment($count_id))
  const handleConvertToAdjustment = async (countId) => {
    try {
      const res = await axios.post(`/api/admin/products/stock-counts/${countId}/create-adjustment`, {
        biller_id: 1,
        note: `Reconciled from Physical Stock Count audit #${countId}`,
      });

      if (res.data?.success) {
        message.success(res.data.message || 'Inventory adjustment created successfully!');
        setViewModalVisible(false);
        fetchStockCounts(pagination.current_page);

        if (onNavigateAdjustment) {
          onNavigateAdjustment(res.data.data?.adjustment_id);
        }
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to create adjustment from count');
    }
  };

  // Delete Count
  const handleDeleteStockCount = async (id) => {
    try {
      const res = await axios.delete(`/api/admin/products/stock-counts/${id}`);
      if (res.data?.success) {
        message.success('Stock count deleted successfully');
        fetchStockCounts(pagination.current_page);
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to delete stock count');
    }
  };

  // Filtered Items inside Live Count Editor
  const filteredAuditItems = useMemo(() => {
    return auditItems.filter((it) => {
      const matchesSearch =
        !scanSearch ||
        it.product_code.toLowerCase().includes(scanSearch.toLowerCase()) ||
        it.product_name.toLowerCase().includes(scanSearch.toLowerCase()) ||
        (it.product_variant && it.product_variant.toLowerCase().includes(scanSearch.toLowerCase()));

      let matchesFilter = true;
      if (scanFilter === 'diff') matchesFilter = it.is_counted && it.difference !== 0;
      else if (scanFilter === 'matches') matchesFilter = it.is_counted && it.difference === 0;
      else if (scanFilter === 'uncounted') matchesFilter = !it.is_counted;

      return matchesSearch && matchesFilter;
    });
  }, [auditItems, scanSearch, scanFilter]);

  // Statistics for Live Count Editor
  const auditSummaryStats = useMemo(() => {
    const total = auditItems.length;
    let counted = 0;
    let matches = 0;
    let over = 0;
    let shortage = 0;
    let varianceCost = 0;

    for (const it of auditItems) {
      if (it.is_counted) {
        counted++;
        if (it.difference === 0) matches++;
        else if (it.difference > 0) over++;
        else shortage++;
        varianceCost += (it.difference || 0) * (it.cost || 0);
      }
    }

    return {
      total,
      counted,
      uncounted: total - counted,
      matches,
      differences: over + shortage,
      over,
      shortage,
      varianceCost: Math.round(varianceCost * 100) / 100,
    };
  }, [auditItems]);

  // Columns for Main Stock Counts Table (stock_counts.php)
  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 140,
      render: (val) => (val ? new Date(val).toLocaleDateString() : '-'),
    },
    {
      title: 'Reference No',
      dataIndex: 'reference_no',
      key: 'reference_no',
      width: 150,
      render: (val, record) => (
        <span
          onClick={() => handleOpenDetails(record)}
          style={{ fontWeight: 800, color: '#2F6FED', cursor: 'pointer' }}
        >
          {val || `STC-${record.id}`}
        </span>
      ),
    },
    {
      title: 'Warehouse',
      dataIndex: 'warehouse_name',
      key: 'warehouse_name',
      width: 150,
      render: (val, record) => (
        <div>
          <span style={{ fontWeight: 700 }}>{val}</span>
          {record.warehouse_code && (
            <span style={{ fontSize: 11, color: '#64748b', marginLeft: 4 }}>({record.warehouse_code})</span>
          )}
        </div>
      ),
    },
    {
      title: 'Count Type',
      dataIndex: 'type',
      key: 'type',
      width: 110,
      render: (val) => (
        <Tag color={val === 'full' ? 'green' : 'blue'} style={{ borderRadius: 6, fontWeight: 800 }}>
          {val === 'full' ? 'Full Count' : 'Partial'}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (val, record) => {
        const isDraft = record.status === 'draft' || !record.finalized;
        return (
          <Tag
            color={isDraft ? 'orange' : 'success'}
            icon={isDraft ? <ClockCircleOutlined /> : <CheckCircleOutlined />}
            style={{ borderRadius: 6, fontWeight: 800 }}
          >
            {isDraft ? 'In Progress' : 'Finalized'}
          </Tag>
        );
      },
    },
    {
      title: 'Categories / Brands',
      key: 'scope',
      width: 180,
      render: (_, record) => {
        if (record.type === 'full') {
          return <span style={{ color: '#64748b', fontSize: 12 }}>All Inventory</span>;
        }
        return (
          <div style={{ fontSize: 11.5, color: '#334155' }}>
            {record.category_names && <div>📁 {record.category_names}</div>}
            {record.brand_names && <div>🏷️ {record.brand_names}</div>}
          </div>
        );
      },
    },
    {
      title: 'Products / Rows',
      key: 'counts',
      width: 130,
      render: (_, record) => (
        <span style={{ fontWeight: 700 }}>
          {record.products_count} prod ({record.rows_count} rows)
        </span>
      ),
    },
    {
      title: 'Discrepancies',
      key: 'differences',
      width: 140,
      render: (_, record) => {
        const diffs = record.differences || 0;
        return (
          <Space orientation="vertical" size={2}>
            {diffs > 0 ? (
              <Tag color="error" style={{ borderRadius: 6, fontWeight: 800 }}>
                ⚠️ {diffs} Differences
              </Tag>
            ) : (
              <Tag color="success" style={{ borderRadius: 6, fontWeight: 800 }}>
                ✓ {record.matches || 0} Matches
              </Tag>
            )}
            {record.missing > 0 && (
              <span style={{ fontSize: 10.5, color: '#94a3b8' }}>({record.missing} uncounted)</span>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Reconciliation',
      key: 'reconciliation',
      width: 160,
      render: (_, record) => {
        if (record.linked_adjustment_ref) {
          return (
            <Tooltip title={`Converted to Inventory Adjustment #${record.linked_adjustment_ref}`}>
              <Tag color="purple" style={{ borderRadius: 6, fontWeight: 800 }}>
                ⚡ Adj: {record.linked_adjustment_ref}
              </Tag>
            </Tooltip>
          );
        }
        if (record.finalized && record.differences > 0) {
          return (
            <Button
              size="small"
              type="primary"
              ghost
              icon={<SwapOutlined />}
              onClick={() => handleConvertToAdjustment(record.id)}
              style={{ fontSize: 11, borderRadius: 6, fontWeight: 700 }}
            >
              Reconcile Stock
            </Button>
          );
        }
        return <span style={{ color: '#94a3b8', fontSize: 12 }}>-</span>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      align: 'center',
      fixed: 'right',
      render: (_, record) => {
        const isDraft = !record.finalized;
        const actionItems = [
          {
            key: 'view',
            icon: <EyeOutlined style={{ color: '#2563eb' }} />,
            label: 'View Voucher & Summary',
            onClick: () => handleOpenDetails(record),
          },
        ];

        if (isDraft) {
          actionItems.push(
            {
              key: 'scan',
              icon: <ScanOutlined style={{ color: '#2F6FED' }} />,
              label: 'Scan & Count Barcodes',
              onClick: () => handleOpenScanWorkspace(record),
            },
            {
              key: 'finalize',
              icon: <CheckCircleOutlined style={{ color: '#16a34a' }} />,
              label: 'Finalize Count & Upload',
              onClick: () => handleOpenFinalizeModal(record),
            },
            {
              type: 'divider',
            },
            {
              key: 'delete',
              icon: <DeleteOutlined style={{ color: '#dc2626' }} />,
              danger: true,
              label: 'Delete Count Audit',
              onClick: () => {
                Modal.confirm({
                  title: 'Delete this stock count audit?',
                  content: 'Are you sure you want to delete this stock count audit? This action cannot be undone.',
                  okText: 'Yes, delete',
                  okType: 'danger',
                  cancelText: 'Cancel',
                  onOk: () => handleDeleteStockCount(record.id),
                });
              },
            }
          );
        } else {
          actionItems.push({
            key: 'download_csv',
            icon: <DownloadOutlined style={{ color: '#059669' }} />,
            label: 'Download Worksheet (.csv)',
            onClick: () => handleDownloadCsv(record.id, record.reference_no),
          });
        }

        return <TableActionDropdown items={actionItems} />;
      },
    },
  ];

  return (
    <div style={{ padding: '4px 0' }}>
      {/* 1. TOP HEADER & WORKSPACE BANNER */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2F6FED',
                fontSize: 20,
              }}
            >
              <BarcodeOutlined />
            </div>
            <div>
              <Title level={4} style={{ margin: 0, fontWeight: 900, color: '#0f172a' }}>
                Stock Counts & Physical Inventory Audits
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Cycle counting, barcode auditing, discrepancy analysis, and automatic adjustment reconciliation (AURA_v1 Concept)
              </Text>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <Space size={10}>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => fetchStockCounts(pagination.current_page)}
            loading={loading}
            style={{ borderRadius: 8, fontWeight: 700 }}
          >
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              createForm.resetFields();
              setCountTypeChoice('full');
              setCreateModalVisible(true);
            }}
            style={{
              borderRadius: 8,
              background: '#2F6FED',
              borderColor: '#2F6FED',
              fontWeight: 800,
              boxShadow: '0 4px 12px rgba(47, 111, 237, 0.25)',
            }}
          >
            + Initiate Stock Count
          </Button>
        </Space>
      </div>

      {/* 3. FILTER TOOLBAR */}
      <Card
        bordered={false}
        style={{
          borderRadius: 14,
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          marginBottom: 16,
          background: '#ffffff',
        }}
        bodyStyle={{ padding: '14px 18px' }}
      >
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="Search reference, warehouse, notes..."
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onPressEnter={handleApplyFilter}
              allowClear
              style={{ borderRadius: 8 }}
            />
          </Col>

          <Col xs={12} sm={6} md={5}>
            <Select
              placeholder="Warehouse"
              value={filterWarehouse}
              onChange={(v) => {
                setFilterWarehouse(v);
                setTimeout(() => fetchStockCounts(1), 50);
              }}
              style={{ width: '100%' }}
            >
              <Option value="all">All Warehouses</Option>
              {metaOptions.warehouses.map((w) => (
                <Option key={w.id} value={String(w.id)}>
                  {w.name} ({w.code})
                </Option>
              ))}
            </Select>
          </Col>

          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="Type"
              value={filterType}
              onChange={(v) => {
                setFilterType(v);
                setTimeout(() => fetchStockCounts(1), 50);
              }}
              style={{ width: '100%' }}
            >
              <Option value="all">All Types</Option>
              <Option value="full">Full Count</Option>
              <Option value="partial">Partial</Option>
            </Select>
          </Col>

          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="Status"
              value={filterStatus}
              onChange={(v) => {
                setFilterStatus(v);
                setTimeout(() => fetchStockCounts(1), 50);
              }}
              style={{ width: '100%' }}
            >
              <Option value="all">All Statuses</Option>
              <Option value="draft">In Progress (Draft)</Option>
              <Option value="completed">Finalized</Option>
            </Select>
          </Col>

          <Col xs={12} sm={6} md={5} style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button
              type="primary"
              onClick={handleApplyFilter}
              style={{ borderRadius: 8, fontWeight: 700, background: '#2F6FED', borderColor: '#2F6FED' }}
            >
              Apply Filter
            </Button>
            <Button
              onClick={() => {
                setSearchTerm('');
                setFilterWarehouse('all');
                setFilterType('all');
                setFilterStatus('all');
                setTimeout(() => fetchStockCounts(1), 50);
              }}
              style={{ borderRadius: 8 }}
            >
              Reset
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 4. MAIN STOCK COUNTS TABLE */}
      <Card
        bordered={false}
        style={{ borderRadius: 14, boxShadow: isDark ? '0 2px 10px rgba(0,0,0,0.3)' : '0 2px 10px rgba(0,0,0,0.03)', background: isDark ? '#1e293b' : '#ffffff', border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0' }}
        bodyStyle={{ padding: 0 }}
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={countsList}
          loading={loading}
          pagination={{
            current: pagination.current_page,
            pageSize: pagination.limit,
            total: pagination.total_records,
            showSizeChanger: true,
            onChange: (p) => fetchStockCounts(p),
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} audits`,
          }}
          scroll={{ x: 1300 }}
          size="middle"
        />
      </Card>

      {/* ========================================================================= */}
      {/* MODAL 1: INITIATE STOCK COUNT (count_stock.php) */}
      {/* ========================================================================= */}
      <Modal
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <PlusOutlined style={{ color: '#2F6FED' }} />
            <span style={{ fontWeight: 900 }}>Initiate New Physical Stock Count</span>
          </div>
        }
        footer={null}
        destroyOnClose
        centered
        width={680}
        style={{ borderRadius: 18, overflow: 'hidden' }}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateStockCount}
          initialValues={{
            reference_no: metaOptions.nextReferenceNo,
            warehouse_id: metaOptions.warehouses[0]?.id ? String(metaOptions.warehouses[0].id) : undefined,
          }}
        >
          <Row gutter={[14, 0]}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="warehouse_id"
                label={<span style={{ fontWeight: 700 }}>Warehouse Depot</span>}
                rules={[{ required: true, message: 'Please select warehouse' }]}
              >
                <Select size="large" placeholder="Select warehouse depot...">
                  {metaOptions.warehouses.map((w) => (
                    <Option key={w.id} value={String(w.id)}>
                      🏢 {w.name} ({w.code})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="reference_no"
                label={<span style={{ fontWeight: 700 }}>Reference No (Audit Voucher)</span>}
              >
                <Input size="large" placeholder={metaOptions.nextReferenceNo || 'e.g. STC26/0001'} />
              </Form.Item>
            </Col>
          </Row>

          {/* Count Scope Selection */}
          <div
            style={{
              background: isDark ? 'rgba(30, 41, 59, 0.7)' : '#f8fafc',
              padding: '14px',
              borderRadius: 12,
              border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0',
              marginBottom: 16,
            }}
          >
            <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: isDark ? '#f8fafc' : '#0f172a', marginBottom: 8 }}>
              Audit Count Scope:
            </label>
            <Radio.Group
              value={countTypeChoice}
              onChange={(e) => setCountTypeChoice(e.target.value)}
              style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}
            >
              <Radio.Button value="full" style={{ textAlign: 'center', height: 42, lineHeight: '40px', borderRadius: 8 }}>
                🟢 Full Warehouse Count (All Items)
              </Radio.Button>
              <Radio.Button value="partial" style={{ textAlign: 'center', height: 42, lineHeight: '40px', borderRadius: 8 }}>
                🔍 Partial Audit (Specific Categories/Brands)
              </Radio.Button>
            </Radio.Group>
          </div>

          {/* Conditional Category / Brand Filters for Partial Counts */}
          {countTypeChoice === 'partial' && (
            <Row gutter={[14, 0]} style={{ background: '#eff6ff', padding: '12px 14px 4px 14px', borderRadius: 12, marginBottom: 16 }}>
              <Col xs={24} sm={12}>
                <Form.Item name="categories" label={<span style={{ fontWeight: 700, color: '#1e40af' }}>Select Categories</span>}>
                  <Select mode="multiple" placeholder="Select categories..." style={{ width: '100%' }}>
                    {metaOptions.categories.map((c) => (
                      <Option key={c.id} value={String(c.id)}>
                        📁 {c.name} {c.product_count > 0 ? `(${c.product_count} items)` : '(0 items)'}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="brands" label={<span style={{ fontWeight: 700, color: '#1e40af' }}>Select Brands</span>}>
                  <Select mode="multiple" placeholder="Select brands..." style={{ width: '100%' }}>
                    {metaOptions.brands.map((b) => (
                      <Option key={b.id} value={String(b.id)}>
                        🏷️ {b.name} {b.product_count > 0 ? `(${b.product_count} items)` : '(0 items)'}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          )}

          <Form.Item name="note" label={<span style={{ fontWeight: 700 }}>Audit Notes / Reason</span>}>
            <Input.TextArea placeholder="e.g. End of Month Inventory Cycle Count, Annual Audit..." rows={2} />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <Button onClick={() => setCreateModalVisible(false)} size="large" style={{ borderRadius: 8 }}>
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={submittingCreate}
              size="large"
              style={{
                borderRadius: 8,
                background: '#2F6FED',
                borderColor: '#2F6FED',
                fontWeight: 800,
              }}
            >
              Initiate & Snapshot Inventory
            </Button>
          </div>
        </Form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: LIVE AUDIT COUNTING & BARCODE SCANNING WORKSPACE (scan_count.php) */}
      {/* ========================================================================= */}
      <Modal
        open={scanModalVisible}
        onCancel={() => {
          setScanModalVisible(false);
          fetchStockCounts(pagination.current_page);
        }}
        footer={null}
        width={1120}
        destroyOnClose
        centered
        style={{ borderRadius: 20, overflow: 'hidden' }}
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 30 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: '#2F6FED15',
                  color: '#2F6FED',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                }}
              >
                <ScanOutlined />
              </div>
              <div>
                <span style={{ fontSize: 16, fontWeight: 900, color: '#0f172a' }}>
                  Live Stock Counting & Barcode Audit • {activeAudit?.reference_no}
                </span>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  Warehouse: {activeAudit?.warehouse_name} • {activeAudit?.type === 'full' ? 'Full Count' : 'Partial Count'}
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <Space size={8}>
              <Button
                type="default"
                icon={<DownloadOutlined />}
                onClick={() => handleDownloadCsv(activeAudit?.id, activeAudit?.reference_no)}
                style={{ borderRadius: 8, fontWeight: 700 }}
              >
                Worksheet (.csv)
              </Button>
              <Button
                type="primary"
                onClick={handleSaveCountProgress}
                loading={savingProgress}
                style={{ borderRadius: 8, fontWeight: 800, background: '#2F6FED', borderColor: '#2F6FED' }}
              >
                Save Progress
              </Button>
              <Button
                type="primary"
                onClick={() => {
                  setScanModalVisible(false);
                  handleOpenFinalizeModal(activeAudit);
                }}
                style={{ borderRadius: 8, fontWeight: 800, background: '#16a34a', borderColor: '#16a34a' }}
              >
                Finalize Count
              </Button>
            </Space>
          </div>
        }
      >
        <div style={{ padding: '8px 0' }}>
          {/* Quick Metrics Bar inside Audit */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: 10,
              background: isDark ? 'rgba(30, 41, 59, 0.85)' : '#f8fafc',
              padding: '12px 16px',
              borderRadius: 12,
              border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0',
              marginBottom: 16,
              textAlign: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }}>Total Items</div>
              <div style={{ fontSize: 17, fontWeight: 900, color: isDark ? '#f8fafc' : '#0f172a' }}>{auditSummaryStats.total}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>Counted Items</div>
              <div style={{ fontSize: 17, fontWeight: 900, color: '#16a34a' }}>
                {auditSummaryStats.counted} / {auditSummaryStats.total}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#d97706', fontWeight: 600 }}>Uncounted</div>
              <div style={{ fontSize: 17, fontWeight: 900, color: '#d97706' }}>{auditSummaryStats.uncounted}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#2563eb', fontWeight: 600 }}>Accurate (0 Diff)</div>
              <div style={{ fontSize: 17, fontWeight: 900, color: '#2563eb' }}>{auditSummaryStats.matches}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 600 }}>Discrepancies</div>
              <div style={{ fontSize: 17, fontWeight: 900, color: '#dc2626' }}>
                {auditSummaryStats.differences} items
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#7c3aed', fontWeight: 700 }}>Net Variance Value</div>
              <div
                style={{
                  fontSize: 17,
                  fontWeight: 900,
                  color: auditSummaryStats.varianceCost < 0 ? '#dc2626' : auditSummaryStats.varianceCost > 0 ? '#16a34a' : (isDark ? '#f8fafc' : '#0f172a'),
                }}
              >
                ${auditSummaryStats.varianceCost.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Barcode Gun / Scanner Input Bar */}
          <div
            style={{
              background: isDark ? 'linear-gradient(135deg, rgba(30, 58, 138, 0.35) 0%, rgba(15, 23, 42, 0.8) 100%)' : '#eff6ff',
              borderRadius: 14,
              padding: '14px 18px',
              border: isDark ? '1.5px solid rgba(96, 165, 250, 0.35)' : '1.5px solid #bfdbfe',
              marginBottom: 16,
              display: 'flex',
              gap: 12,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: isDark ? '#93c5fd' : '#1e40af', fontWeight: 800 }}>
              <SoundOutlined />
              <span>Barcode Scanner Gun:</span>
            </div>

            <Input
              ref={barcodeInputRef}
              placeholder="Scan barcode, enter SKU or product code and press Enter..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onPressEnter={handleScanBarcode}
              style={{ flex: 1, minWidth: 260, borderRadius: 8, fontWeight: 700 }}
              size="large"
              autoFocus
              suffix={
                <Tooltip title="Scan using Device Camera">
                  <Button
                    type="text"
                    icon={<CameraOutlined style={{ color: '#7c3aed', fontSize: 18 }} />}
                    onClick={handleStartCameraScan}
                    style={{ padding: '0 4px', height: 'auto' }}
                  />
                </Tooltip>
              }
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>Step:</span>
              <InputNumber
                min={1}
                max={100}
                value={scanQuantityDelta}
                onChange={setScanQuantityDelta}
                size="large"
                style={{ width: 70, borderRadius: 8 }}
              />
            </div>

            <Button
              type="primary"
              icon={<ScanOutlined />}
              onClick={handleScanCountClick}
              size="large"
              style={{
                borderRadius: 8,
                fontWeight: 800,
                background: '#7c3aed',
                borderColor: '#7c3aed',
                boxShadow: '0 2px 8px rgba(124, 58, 237, 0.25)',
              }}
            >
              Scan Count
            </Button>
          </div>

          {/* Search & Filter Bar inside Audit Table */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            <Radio.Group value={scanFilter} onChange={(e) => setScanFilter(e.target.value)} size="small">
              <Radio.Button value="all">All Items ({auditItems.length})</Radio.Button>
              <Radio.Button value="diff">⚠️ Discrepancies ({auditSummaryStats.differences})</Radio.Button>
              <Radio.Button value="uncounted">⏳ Uncounted ({auditSummaryStats.uncounted})</Radio.Button>
              <Radio.Button value="matches">✓ Matches ({auditSummaryStats.matches})</Radio.Button>
            </Radio.Group>

            <Input
              placeholder="Filter item name, code, variant..."
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              value={scanSearch}
              onChange={(e) => setScanSearch(e.target.value)}
              allowClear
              style={{ width: 250, borderRadius: 8 }}
              size="small"
            />
          </div>

          {/* Table of Audit Items */}
          <Table
            rowKey="id"
            dataSource={filteredAuditItems}
            pagination={{ pageSize: 12, showSizeChanger: true, pageSizeOptions: ['12', '24', '50', '100'] }}
            size="small"
            scroll={{ y: 320 }}
            columns={[
              {
                title: 'Product Code',
                dataIndex: 'product_code',
                key: 'product_code',
                width: 140,
                render: (val) => <span style={{ fontWeight: 800, color: '#0f172a' }}>{val}</span>,
              },
              {
                title: 'Product Name & Variant',
                key: 'product',
                render: (_, r) => (
                  <div>
                    <div style={{ fontWeight: 700, color: '#334155' }}>{r.product_name}</div>
                    {r.product_variant && (
                      <Tag color="purple" style={{ borderRadius: 6, fontSize: 10, padding: '0 4px', margin: 0 }}>
                        {r.product_variant}
                      </Tag>
                    )}
                  </div>
                ),
              },
              {
                title: 'Expected QOH',
                dataIndex: 'expected',
                key: 'expected',
                width: 120,
                align: 'right',
                render: (val) => <span style={{ fontWeight: 700, color: '#64748b' }}>{Number(val).toFixed(2)}</span>,
              },
              {
                title: 'Physical Counted',
                key: 'counted',
                width: 140,
                align: 'center',
                render: (_, r) => (
                  <InputNumber
                    min={0}
                    value={r.counted}
                    onChange={(val) => handleUpdateItemCount(r.id, val)}
                    placeholder="Uncounted"
                    style={{
                      width: 110,
                      borderRadius: 6,
                      fontWeight: 800,
                      borderColor: r.is_counted ? (r.difference === 0 ? '#10b981' : '#f87171') : (isDark ? 'rgba(255,255,255,0.18)' : '#d1d5db'),
                      background: r.is_counted
                        ? (r.difference === 0 ? (isDark ? 'rgba(16, 185, 129, 0.2)' : '#f0fdf4') : (isDark ? 'rgba(239, 68, 68, 0.2)' : '#fef2f2'))
                        : (isDark ? 'rgba(30, 41, 59, 0.8)' : '#ffffff'),
                    }}
                  />
                ),
              },
              {
                title: 'Difference',
                key: 'difference',
                width: 120,
                align: 'right',
                render: (_, r) => {
                  if (!r.is_counted) {
                    return <span style={{ color: '#94a3b8', fontSize: 11 }}>Pending</span>;
                  }
                  const diff = r.difference;
                  if (diff === 0) {
                    return <Tag color="success" style={{ fontWeight: 800 }}>0</Tag>;
                  }
                  return (
                    <Tag color={diff > 0 ? 'blue' : 'error'} style={{ fontWeight: 900 }}>
                      {diff > 0 ? `+${diff}` : diff}
                    </Tag>
                  );
                },
              },
              {
                title: 'Cost Variance',
                key: 'variance_cost',
                width: 120,
                align: 'right',
                render: (_, r) => {
                  if (!r.is_counted) return '-';
                  const cost = r.difference_cost || 0;
                  return (
                    <span
                      style={{
                        fontWeight: 800,
                        color: cost > 0 ? '#16a34a' : cost < 0 ? '#dc2626' : '#64748b',
                      }}
                    >
                      ${cost.toFixed(2)}
                    </span>
                  );
                },
              },
            ]}
          />
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2B: LIVE DEVICE CAMERA BARCODE & QR SCANNER */}
      {/* ========================================================================= */}
      <Modal
        open={cameraModalVisible}
        onCancel={() => setCameraModalVisible(false)}
        footer={null}
        width={660}
        destroyOnClose
        centered
        style={{ borderRadius: 20, overflow: 'hidden' }}
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 30 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: '#ede9fe',
                  color: '#7c3aed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                }}
              >
                <CameraOutlined />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, color: '#0f172a' }}>Camera Barcode Scanner</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>Point camera at 1D Barcode (EAN, UPC, Code 128) or QR Code</div>
              </div>
            </div>
            <Tag color="purple" style={{ borderRadius: 6, fontWeight: 700, padding: '2px 8px' }}>
              Step: +{scanQuantityDelta || 1}
            </Tag>
          </div>
        }
      >
        <style>{`
          @keyframes scanLaserLine {
            0% { top: 8%; opacity: 0.8; }
            50% { top: 90%; opacity: 1; }
            100% { top: 8%; opacity: 0.8; }
          }
          .camera-scan-laser-line {
            position: absolute;
            left: 4%;
            right: 4%;
            height: 3px;
            background: linear-gradient(90deg, transparent 0%, #ec4899 20%, #a855f7 50%, #ec4899 80%, transparent 100%);
            box-shadow: 0 0 10px #ec4899, 0 0 20px #a855f7;
            border-radius: 2px;
            animation: scanLaserLine 2s infinite ease-in-out;
          }
          @keyframes scanFeedbackFade {
            0% { opacity: 0; transform: translateY(-8px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          .camera-feedback-card {
            animation: scanFeedbackFade 0.2s ease forwards;
          }
        `}</style>

        <div style={{ padding: '8px 0' }}>
          {/* Camera Viewport Container */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '350px',
              background: '#090d16',
              borderRadius: 14,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'inset 0 0 25px rgba(0,0,0,0.6)',
            }}
          >
            {cameraLoading && (
              <div style={{ position: 'absolute', zIndex: 10, textAlign: 'center', color: '#fff' }}>
                <Spin size="large" />
                <div style={{ marginTop: 12, fontSize: 13, color: '#cbd5e1' }}>Connecting to device camera...</div>
              </div>
            )}

            {cameraError ? (
              <div style={{ position: 'absolute', zIndex: 10, padding: 24, textAlign: 'center', maxWidth: '85%' }}>
                <Alert
                  type="error"
                  showIcon
                  message="Camera Access"
                  description={cameraError}
                  style={{ borderRadius: 10, textAlign: 'left' }}
                />
                <Button
                  type="primary"
                  icon={<SyncOutlined />}
                  onClick={() => {
                    setCameraError(null);
                    setSelectedCameraId(selectedCameraId ? '' : 'retry');
                  }}
                  style={{ marginTop: 14, borderRadius: 8, background: '#7c3aed', borderColor: '#7c3aed', fontWeight: 700 }}
                >
                  Retry Camera
                </Button>
              </div>
            ) : (
              <video
                ref={videoRef}
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            )}

            {/* Target Reticle Viewfinder & Laser */}
            {!cameraError && !cameraLoading && (
              <div
                style={{
                  position: 'absolute',
                  width: '270px',
                  height: '170px',
                  border: '2px dashed rgba(168, 85, 247, 0.7)',
                  borderRadius: 14,
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.42)',
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {/* 4 Corner Markers */}
                <div style={{ position: 'absolute', top: -3, left: -3, width: 20, height: 20, borderTop: '4px solid #a855f7', borderLeft: '4px solid #a855f7', borderTopLeftRadius: 10 }} />
                <div style={{ position: 'absolute', top: -3, right: -3, width: 20, height: 20, borderTop: '4px solid #a855f7', borderRight: '4px solid #a855f7', borderTopRightRadius: 10 }} />
                <div style={{ position: 'absolute', bottom: -3, left: -3, width: 20, height: 20, borderBottom: '4px solid #a855f7', borderLeft: '4px solid #a855f7', borderBottomLeftRadius: 10 }} />
                <div style={{ position: 'absolute', bottom: -3, right: -3, width: 20, height: 20, borderBottom: '4px solid #a855f7', borderRight: '4px solid #a855f7', borderBottomRightRadius: 10 }} />

                {/* Sweeping Laser Line */}
                <div className="camera-scan-laser-line" />

                <div
                  style={{
                    position: 'absolute',
                    bottom: -28,
                    fontSize: 11,
                    color: '#f8fafc',
                    fontWeight: 700,
                    textShadow: '0 1px 4px rgba(0,0,0,0.85)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Align barcode inside frame
                </div>
              </div>
            )}

            {/* Floating Live Scanned Feedback Card */}
            {lastScannedFeedback && (
              <div
                className="camera-feedback-card"
                style={{
                  position: 'absolute',
                  top: 14,
                  left: 14,
                  right: 14,
                  zIndex: 20,
                  pointerEvents: 'none',
                }}
              >
                {lastScannedFeedback.status === 'success' ? (
                  <div
                    style={{
                      background: 'rgba(22, 163, 74, 0.95)',
                      backdropFilter: 'blur(6px)',
                      color: '#fff',
                      padding: '10px 14px',
                      borderRadius: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 13 }}>
                        ✓ Counted: {lastScannedFeedback.product_name} (+{lastScannedFeedback.delta})
                      </div>
                      <div style={{ fontSize: 11, opacity: 0.9 }}>
                        Code: {lastScannedFeedback.product_code} | Total Counted: {lastScannedFeedback.counted}
                      </div>
                    </div>
                    <Tag color="gold" style={{ fontWeight: 800, margin: 0, fontSize: 12 }}>
                      Diff: {lastScannedFeedback.diff > 0 ? `+${lastScannedFeedback.diff}` : lastScannedFeedback.diff}
                    </Tag>
                  </div>
                ) : (
                  <div
                    style={{
                      background: 'rgba(220, 38, 38, 0.95)',
                      backdropFilter: 'blur(6px)',
                      color: '#fff',
                      padding: '10px 14px',
                      borderRadius: 10,
                      fontWeight: 700,
                      fontSize: 12,
                      boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
                    }}
                  >
                    ⚠️ {lastScannedFeedback.message}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Controls Bar Underneath Viewport */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 14,
              flexWrap: 'wrap',
              gap: 10,
              background: isDark ? 'rgba(30, 41, 59, 0.7)' : '#f8fafc',
              padding: '10px 14px',
              borderRadius: 10,
              border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0',
            }}
          >
            <Space wrap size={12}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: isDark ? '#e2e8f0' : '#334155' }}>Step:</span>
                <InputNumber
                  min={1}
                  max={100}
                  value={scanQuantityDelta}
                  onChange={setScanQuantityDelta}
                  size="small"
                  style={{ width: 65, borderRadius: 6 }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Continuous:</span>
                <Radio.Group
                  size="small"
                  value={continuousScan ? 'continuous' : 'single'}
                  onChange={(e) => setContinuousScan(e.target.value === 'continuous')}
                >
                  <Radio.Button value="continuous">Continuous</Radio.Button>
                  <Radio.Button value="single">Single Scan</Radio.Button>
                </Radio.Group>
              </div>

              {cameraDevices.length > 1 && (
                <Select
                  size="small"
                  style={{ width: 140 }}
                  value={selectedCameraId || undefined}
                  placeholder="Select Camera"
                  onChange={(val) => setSelectedCameraId(val)}
                >
                  {cameraDevices.map((dev, idx) => (
                    <Option key={dev.deviceId || idx} value={dev.deviceId}>
                      {dev.label || `Camera ${idx + 1}`}
                    </Option>
                  ))}
                </Select>
              )}

              {torchSupported && (
                <Button
                  size="small"
                  icon={<ThunderboltOutlined />}
                  type={torchEnabled ? 'primary' : 'default'}
                  onClick={handleToggleTorch}
                  style={torchEnabled ? { background: '#f59e0b', borderColor: '#f59e0b' } : {}}
                >
                  {torchEnabled ? 'Flash ON' : 'Flash OFF'}
                </Button>
              )}
            </Space>

            <Button
              onClick={() => setCameraModalVisible(false)}
              style={{ borderRadius: 8, fontWeight: 600 }}
            >
              Close Camera
            </Button>
          </div>

          {/* Recent Scans in this Camera Session */}
          {cameraRecentScans.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                Scanned in this Session ({cameraRecentScans.length}):
              </div>
              <div style={{ maxHeight: 110, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {cameraRecentScans.map((scan) => (
                  <div
                    key={scan.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: '#fff',
                      padding: '5px 10px',
                      borderRadius: 6,
                      border: '1px solid #f1f5f9',
                      fontSize: 12,
                    }}
                  >
                    <Space size={8}>
                      <span style={{ color: '#94a3b8', fontSize: 11 }}>{scan.time}</span>
                      <strong style={{ color: '#1e293b' }}>{scan.name}</strong>
                      <Tag color="blue" style={{ fontSize: 10, margin: 0 }}>{scan.code}</Tag>
                    </Space>
                    <Space size={8}>
                      <Tag color="green" style={{ margin: 0, fontWeight: 700 }}>+{scan.delta}</Tag>
                      <span style={{ fontWeight: 800, color: '#2563eb' }}>Total: {scan.totalCounted}</span>
                    </Space>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: VIEW COUNT DETAILS & RECONCILIATION SHEET (view_count.php) */}
      {/* ========================================================================= */}
      <Modal
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={null}
        width={920}
        destroyOnClose
        centered
        style={{ borderRadius: 20, overflow: 'hidden' }}
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 30 }}>
            <span style={{ fontSize: 16, fontWeight: 900 }}>
              Physical Stock Count Audit Voucher #{selectedCountDetails?.reference_no}
            </span>
            <Space size={8}>
              <Button icon={<PrinterOutlined />} onClick={() => window.print()} style={{ borderRadius: 8 }}>
                Print Voucher
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={() => handleDownloadCsv(selectedCountDetails?.id, selectedCountDetails?.reference_no)}
                style={{ borderRadius: 8 }}
              >
                Export CSV
              </Button>
            </Space>
          </div>
        }
      >
        {loadingDetails ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Spin size="large" />
          </div>
        ) : selectedCountDetails ? (
          <div id="print-count-voucher" style={{ padding: '8px 0' }}>
            {/* Header Details Table */}
            <div
              style={{
                background: isDark ? 'rgba(30, 41, 59, 0.7)' : '#f8fafc',
                padding: '14px 18px',
                borderRadius: 14,
                border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0',
                marginBottom: 16,
              }}
            >
              <Row gutter={[16, 10]}>
                <Col span={8}>
                  <div style={{ fontSize: 11, color: isDark ? '#94a3b8' : '#64748b' }}>Warehouse:</div>
                  <div style={{ fontWeight: 800, color: isDark ? '#f8fafc' : '#0f172a' }}>{selectedCountDetails.warehouse_name}</div>
                </Col>
                <Col span={8}>
                  <div style={{ fontSize: 11, color: '#64748b' }}>Audit Reference:</div>
                  <div style={{ fontWeight: 800, color: '#2F6FED' }}>{selectedCountDetails.reference_no}</div>
                </Col>
                <Col span={8}>
                  <div style={{ fontSize: 11, color: '#64748b' }}>Audit Date:</div>
                  <div style={{ fontWeight: 700 }}>
                    {selectedCountDetails.date ? new Date(selectedCountDetails.date).toLocaleString() : '-'}
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ fontSize: 11, color: '#64748b' }}>Count Type:</div>
                  <div>
                    <Tag color={selectedCountDetails.type === 'full' ? 'green' : 'blue'}>
                      {selectedCountDetails.type === 'full' ? 'Full Count' : 'Partial Audit'}
                    </Tag>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ fontSize: 11, color: '#64748b' }}>Audit Status:</div>
                  <div>
                    <Tag color={selectedCountDetails.finalized ? 'success' : 'orange'}>
                      {selectedCountDetails.finalized ? 'Finalized / Locked' : 'In Progress (Draft)'}
                    </Tag>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ fontSize: 11, color: '#64748b' }}>Created By:</div>
                  <div style={{ fontWeight: 700 }}>{selectedCountDetails.creator_name || 'Admin'}</div>
                </Col>
              </Row>
            </div>

            {/* Reconciliation KPI Overview */}
            <Row gutter={[10, 10]} style={{ marginBottom: 16 }}>
              <Col span={6}>
                <Card size="small" style={{ borderRadius: 10, textAlign: 'center', background: '#f0fdf4' }}>
                  <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 700 }}>Accurate Matches</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#16a34a' }}>
                    {selectedCountDetails.summary?.matches_count || 0}
                  </div>
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" style={{ borderRadius: 10, textAlign: 'center', background: '#eff6ff' }}>
                  <div style={{ fontSize: 11, color: '#2563eb', fontWeight: 700 }}>Over / Surplus (+)</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#2563eb' }}>
                    +{selectedCountDetails.summary?.over_count || 0}
                  </div>
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" style={{ borderRadius: 10, textAlign: 'center', background: '#fef2f2' }}>
                  <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 700 }}>Shortage / Loss (-)</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#dc2626' }}>
                    -{selectedCountDetails.summary?.shortage_count || 0}
                  </div>
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" style={{ borderRadius: 10, textAlign: 'center', background: '#faf5ff' }}>
                  <div style={{ fontSize: 11, color: '#7c3aed', fontWeight: 700 }}>Total Variance Value</div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 900,
                      color:
                        (selectedCountDetails.summary?.total_variance_cost || 0) < 0
                          ? '#dc2626'
                          : '#16a34a',
                    }}
                  >
                    ${(selectedCountDetails.summary?.total_variance_cost || 0).toFixed(2)}
                  </div>
                </Card>
              </Col>
            </Row>

            {/* Items Table */}
            <Table
              rowKey="id"
              dataSource={selectedCountDetails.items || []}
              pagination={{ pageSize: 10 }}
              size="small"
              columns={[
                { title: 'Code', dataIndex: 'product_code', key: 'product_code', width: 120 },
                { title: 'Product Name', dataIndex: 'product_name', key: 'product_name' },
                { title: 'Variant', dataIndex: 'product_variant', key: 'variant', width: 100, render: (v) => v || '-' },
                { title: 'Expected', dataIndex: 'expected', key: 'expected', width: 100, align: 'right' },
                { title: 'Counted', dataIndex: 'counted', key: 'counted', width: 100, align: 'right', render: (v) => v ?? 'Uncounted' },
                {
                  title: 'Difference',
                  key: 'difference',
                  width: 100,
                  align: 'right',
                  render: (_, r) => {
                    if (r.difference === null) return '-';
                    return (
                      <Tag color={r.difference === 0 ? 'success' : r.difference > 0 ? 'blue' : 'error'}>
                        {r.difference > 0 ? `+${r.difference}` : r.difference}
                      </Tag>
                    );
                  },
                },
                {
                  title: 'Variance ($)',
                  dataIndex: 'difference_cost',
                  key: 'difference_cost',
                  width: 110,
                  align: 'right',
                  render: (v) => `$${Number(v || 0).toFixed(2)}`,
                },
              ]}
            />

            {/* Reconciliation Callout */}
            {selectedCountDetails.linked_adjustment_ref ? (
              <Alert
                type="success"
                showIcon
                message={
                  <span>
                    This count has been converted to <strong>Inventory Adjustment #{selectedCountDetails.linked_adjustment_ref}</strong>.
                    Stock movement records and warehouse balances are reconciled.
                  </span>
                }
                style={{ marginTop: 14 }}
              />
            ) : selectedCountDetails.summary?.total_difference !== 0 ? (
              <div
                style={{
                  marginTop: 16,
                  padding: '12px 16px',
                  background: '#fef3c7',
                  borderRadius: 12,
                  border: '1px solid #fde68a',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <span style={{ fontWeight: 800, color: '#92400e' }}>
                    Reconciliation Required: Discrepancies detected between physical count and system records.
                  </span>
                  <div style={{ fontSize: 12, color: '#b45309' }}>
                    Click to automatically create an official Inventory Adjustment voucher to adjust ledger balances.
                  </div>
                </div>
                <Button
                  type="primary"
                  icon={<SwapOutlined />}
                  onClick={() => handleConvertToAdjustment(selectedCountDetails.id)}
                  style={{ background: '#d97706', borderColor: '#d97706', fontWeight: 800, borderRadius: 8 }}
                >
                  Create Inventory Adjustment
                </Button>
              </div>
            ) : null}
          </div>
        ) : (
          <Empty description="No count details found" />
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 4: FINALIZE COUNT & CSV WORKSHEET UPLOAD (finalize_count.php) */}
      {/* ========================================================================= */}
      <Modal
        open={finalizeModalVisible}
        onCancel={() => setFinalizeModalVisible(false)}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircleOutlined style={{ color: '#16a34a' }} />
            <span style={{ fontWeight: 900 }}>Finalize Stock Count Audit • {countToFinalize?.reference_no}</span>
          </div>
        }
        footer={null}
        destroyOnClose
        centered
        width={650}
        style={{ borderRadius: 18, overflow: 'hidden' }}
      >
        <div style={{ padding: '8px 0' }}>
          <Alert
            type="info"
            showIcon
            message="Finalizing locks this stock count audit. No further manual edits or barcode scans can be performed."
            style={{ marginBottom: 16 }}
          />

          <Tabs
            defaultActiveKey="manual"
            items={[
              {
                key: 'manual',
                label: 'Confirm Live Counts',
                children: (
                  <div style={{ padding: '10px 0' }}>
                    <div
                      style={{
                        background: '#f8fafc',
                        padding: '14px',
                        borderRadius: 12,
                        border: '1px solid #e2e8f0',
                        marginBottom: 16,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span>Total Items to Finalize:</span>
                        <strong style={{ color: '#0f172a' }}>{countToFinalize?.products_count || countToFinalize?.rows_count} items</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span>Warehouse:</span>
                        <strong>{countToFinalize?.warehouse_name}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Audit Reference:</span>
                        <strong style={{ color: '#2F6FED' }}>{countToFinalize?.reference_no}</strong>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                      <Button onClick={() => setFinalizeModalVisible(false)} size="large" style={{ borderRadius: 8 }}>
                        Cancel
                      </Button>
                      <Button
                        type="primary"
                        loading={submittingFinalize}
                        onClick={handleConfirmFinalize}
                        size="large"
                        style={{ borderRadius: 8, background: '#16a34a', borderColor: '#16a34a', fontWeight: 800 }}
                      >
                        Confirm & Lock Audit
                      </Button>
                    </div>
                  </div>
                ),
              },
              {
                key: 'csv',
                label: 'Upload Counted CSV File',
                children: (
                  <div style={{ padding: '10px 0' }}>
                    <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: '#64748b' }}>
                        Need template? Download initial count sheet:
                      </span>
                      <Button
                        size="small"
                        icon={<DownloadOutlined />}
                        onClick={() => handleDownloadCsv(countToFinalize?.id, countToFinalize?.reference_no)}
                      >
                        Download CSV Sheet
                      </Button>
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                        Paste CSV Data (or upload file):
                      </label>
                      <Input.TextArea
                        rows={6}
                        placeholder={`product_code,product_name,variant,expected,counted,expiry\nPROD001,"Test Item","",10,12,\nPROD002,"Other Item","",5,4,`}
                        value={csvUploadText}
                        onChange={(e) => setCsvUploadText(e.target.value)}
                        style={{ fontFamily: 'monospace', fontSize: 12, borderRadius: 8 }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                      <Button onClick={() => setFinalizeModalVisible(false)} size="large" style={{ borderRadius: 8 }}>
                        Cancel
                      </Button>
                      <Button
                        type="primary"
                        loading={submittingFinalize}
                        onClick={handleConfirmFinalize}
                        disabled={!csvUploadText.trim()}
                        size="large"
                        style={{ borderRadius: 8, background: '#16a34a', borderColor: '#16a34a', fontWeight: 800 }}
                      >
                        Import CSV & Finalize Audit
                      </Button>
                    </div>
                  </div>
                ),
              },
            ]}
          />
        </div>
      </Modal>
    </div>
  );
}
