import React, { useState, useEffect } from 'react';
import {
  Modal,
  Button,
  Tag,
  Input,
  Tabs,
  Badge,
  Tooltip,
  Popconfirm,
  Select,
  Form,
  InputNumber,
  Radio,
  Checkbox,
  message,
  Empty,
  Spin,
  Card,
  Divider,
} from 'antd';
import {
  CoffeeOutlined,
  PlusOutlined,
  SwapOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  SearchOutlined,
  ReloadOutlined,
  CloseCircleOutlined,
  ClearOutlined,
  AppstoreOutlined,
  TeamOutlined,
  DollarCircleOutlined,
  ShoppingCartOutlined,
  RightOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;

export default function PosTableModal({
  visible,
  onClose,
  currentTable,
  currentTableId,
  activeSubBillId,
  onSelectTable,
  onLoadTableOrder,
  onStartNewSubBill,
  onOpenCheckout,
  activeBillerColor = '#2F6FED',
  khrExchangeRate = 4200,
  t = (k, d) => d,
}) {
  const [loading, setLoading] = useState(false);
  const [tables, setTables] = useState([]);
  const [floors, setFloors] = useState([]);
  const [counts, setCounts] = useState({ total: 0, available: 0, occupied: 0, shared: 0 });
  const [activeFloor, setActiveFloor] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Add Table Modal State
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [addForm] = Form.useForm();
  const [submittingAdd, setSubmittingAdd] = useState(false);

  // 2. Transfer Table Modal State (AURA_v1 r_change Concept + Merge / Separate Sub-Bills)
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [sourceTable, setSourceTable] = useState(null);
  const [selectedSubBillId, setSelectedSubBillId] = useState('all');
  const [targetTableId, setTargetTableId] = useState(null);
  const [mergeMode, setMergeMode] = useState('separate'); // 'move' | 'merge' | 'separate'
  const [moveChairs, setMoveChairs] = useState(false);
  const [moveChairsCount, setMoveChairsCount] = useState(1);
  const [transferring, setTransferring] = useState(false);

  // 3. Dynamic Chair Allocation Modal State
  const [chairModalVisible, setChairModalVisible] = useState(false);
  const [selectedChairTable, setSelectedChairTable] = useState(null);
  const [chairAction, setChairAction] = useState('borrow'); // 'borrow' | 'add' | 'return' | 'reset'
  const [chairCount, setChairCount] = useState(1);
  const [donorTableId, setDonorTableId] = useState(null);
  const [chairNote, setChairNote] = useState('');
  const [submittingChairs, setSubmittingChairs] = useState(false);

  // 4. Shared Table & Multi-Group Sub-Bill Selection Modal
  const [sharedModalVisible, setSharedModalVisible] = useState(false);
  const [selectedSharedTable, setSelectedSharedTable] = useState(null);
  const [newGroupNameInput, setNewGroupNameInput] = useState('');
  const [isAddingNewGroup, setIsAddingNewGroup] = useState(false);

  // Fetch Tables & Floor Plan
  const fetchTables = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/pos/tables');
      if (res.data?.success) {
        setTables(res.data.tables || []);
        setFloors(res.data.floors || []);
        setCounts(res.data.counts || { total: 0, available: 0, occupied: 0, shared: 0 });

        // Update selectedSharedTable reference if open
        if (selectedSharedTable) {
          const updated = (res.data.tables || []).find((t) => t.id === selectedSharedTable.id);
          if (updated) setSelectedSharedTable(updated);
        }
      }
    } catch (err) {
      console.error('[POS] Failed to fetch tables:', err);
      message.error(t('failed_fetch_tables', 'Failed to load restaurant floor plan'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchTables();
    }
  }, [visible]);

  // Filter Tables by Floor & Search Term
  const filteredTables = tables.filter((tItem) => {
    const matchesFloor =
      activeFloor === 'all' ||
      String(tItem.floor) === String(activeFloor) ||
      String(tItem.floor_name).toLowerCase() === String(activeFloor).toLowerCase();

    const matchesSearch =
      !searchTerm ||
      tItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tItem.floor_name && tItem.floor_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (tItem.bill_customer && tItem.bill_customer.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (tItem.bills && tItem.bills.some((b) => b.sub_bill_name?.toLowerCase().includes(searchTerm.toLowerCase()) || b.customer?.toLowerCase().includes(searchTerm.toLowerCase())));

    return matchesFloor && matchesSearch;
  });

  // Calculate elapsed time formatted string
  const formatElapsedTime = (startDate) => {
    if (!startDate) return '';
    const diffMs = Date.now() - new Date(startDate).getTime();
    if (diffMs < 0) return 'Just now';
    const mins = Math.floor(diffMs / 60000);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hours}h ${remMins}m`;
  };

  // Handle Table Click in Main Floor Grid
  const handleTableClick = (tbl) => {
    if (tbl.is_occupied) {
      setSelectedSharedTable(tbl);
      setSharedModalVisible(true);
    } else {
      onSelectTable(tbl);
      onClose();
    }
  };

  // Open Shared Table Sub-Bills Modal
  const openSharedGroupsModal = (e, tbl) => {
    e.stopPropagation();
    setSelectedSharedTable(tbl);
    setSharedModalVisible(true);
  };

  // Load a specific sub-bill into the POS Cart
  const handleOpenSubBillInCart = (tbl, subBill) => {
    if (onLoadTableOrder) {
      onLoadTableOrder(tbl, subBill);
    } else {
      onSelectTable(tbl, subBill);
    }
    setSharedModalVisible(false);
    onClose();
  };

  // Add a new independent group to a table (Shared Table)
  const handleAddNewGroupToTable = (tbl) => {
    const existingCount = tbl.bills?.length || 1;
    const nextGroupLetter = String.fromCharCode(65 + existingCount);
    const groupName = newGroupNameInput.trim() || `Group ${nextGroupLetter}`;

    if (onStartNewSubBill) {
      onStartNewSubBill(tbl, groupName);
    } else {
      onSelectTable(tbl, { sub_bill_name: groupName, id: null });
    }
    setNewGroupNameInput('');
    setIsAddingNewGroup(false);
    setSharedModalVisible(false);
    onClose();
  };

  // Open Chair Management Modal
  const openChairModal = (e, tbl) => {
    e.stopPropagation();
    setSelectedChairTable(tbl);
    setChairAction('borrow');
    setChairCount(1);
    setDonorTableId(null);
    setChairNote('');
    setChairModalVisible(true);
  };

  // Submit Chair Adjustment
  const handleConfirmChairAdjust = async () => {
    if (!selectedChairTable) return;
    setSubmittingChairs(true);
    try {
      const res = await axios.post(`/api/admin/pos/tables/${selectedChairTable.id}/adjust-chairs`, {
        action: chairAction,
        count: chairCount,
        donor_table_id: donorTableId,
        note: chairNote,
      });

      if (res.data?.success) {
        message.success(res.data.message || 'Chairs adjusted successfully');
        setChairModalVisible(false);
        fetchTables();
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to adjust chairs');
    } finally {
      setSubmittingChairs(false);
    }
  };

  // Open Transfer Modal
  const openTransferModal = (e, tbl, specificBillId = 'all') => {
    e.stopPropagation();
    setSourceTable(tbl);
    setSelectedSubBillId(specificBillId);
    setTargetTableId(null);
    setMergeMode('separate');
    setMoveChairs(false);
    setMoveChairsCount(tbl.borrowed_chairs > 0 ? tbl.borrowed_chairs : 1);
    setTransferModalVisible(true);
  };

  // Target table object selected in transfer modal
  const selectedTargetTable = tables.find((t) => t.id === targetTableId);

  // Confirm Transfer
  const handleConfirmTransfer = async () => {
    if (!sourceTable || !targetTableId) {
      message.warning('Please select destination table');
      return;
    }

    setTransferring(true);
    try {
      const payload = {
        from_table_id: sourceTable.id,
        to_table_id: targetTableId,
        bill_id: selectedSubBillId !== 'all' ? selectedSubBillId : null,
        merge_mode: selectedTargetTable?.is_occupied ? mergeMode : 'move',
        move_chairs: moveChairs,
        chairs_count: moveChairs ? moveChairsCount : 0,
      };

      const res = await axios.post('/api/admin/pos/tables/transfer', payload);
      if (res.data?.success) {
        message.success(res.data.message || 'Table transferred successfully');
        setTransferModalVisible(false);
        if (sharedModalVisible) setSharedModalVisible(false);
        fetchTables();
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to transfer table');
    } finally {
      setTransferring(false);
    }
  };

  // Release Table Handler
  const handleReleaseTable = async (e, tbl) => {
    if (e && e.stopPropagation) e.stopPropagation();
    try {
      const res = await axios.post(`/api/admin/pos/tables/${tbl.id}/release`);
      if (res.data?.success) {
        message.success(t('table_released', `Table "${tbl.name}" released`));
        if (sharedModalVisible) setSharedModalVisible(false);
        fetchTables();
      }
    } catch (err) {
      message.error(t('failed_release_table', 'Failed to release table'));
    }
  };

  // Add Table Handler
  const handleCreateNewTable = async (values) => {
    setSubmittingAdd(true);
    try {
      const res = await axios.post('/api/admin/pos/tables', values);
      if (res.data?.success) {
        message.success(t('table_added', `Table "${values.name}" created successfully`));
        setAddModalVisible(false);
        addForm.resetFields();
        fetchTables();
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to add table');
    } finally {
      setSubmittingAdd(false);
    }
  };

  return (
    <>
      <Modal
        open={visible}
        onCancel={onClose}
        footer={null}
        width={1040}
        centered
        destroyOnClose
        className="pos-modal pos-table-modal"
        style={{ borderRadius: 20, overflow: 'hidden' }}
        styles={{
          content: { background: '#ffffff', borderRadius: 20 },
          body: { padding: '20px 24px', background: '#f8fafc' },
        }}
      >
        {/* Modal Top Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: `${activeBillerColor}15`,
                border: `1.5px solid ${activeBillerColor}30`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: activeBillerColor,
                fontSize: 22,
              }}
            >
              <CoffeeOutlined />
            </div>
            <div>
              <div style={{ fontSize: 19, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{t('restaurant_floor_plan', 'Restaurant Floor Plan & Dynamic Dining')}</span>
                <Tag color="cyan" style={{ borderRadius: 8, fontWeight: 800, fontSize: 11, margin: 0 }}>
                  AURA 2.0 Smart POS
                </Tag>
              </div>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                {t('floor_plan_sub', 'Live seat capacities, shared tables with multi-group billing, and table transfers')}
              </div>
            </div>
          </div>

          {/* Quick Counter / Takeaway Option */}
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              type="default"
              icon={<ReloadOutlined />}
              onClick={fetchTables}
              loading={loading}
              style={{ borderRadius: 10, fontWeight: 700 }}
            >
              {t('refresh', 'Refresh')}
            </Button>
            <Button
              type="dashed"
              icon={<ClearOutlined />}
              onClick={() => {
                onSelectTable({ id: null, name: 'Takeaway / Walk-in' });
                onClose();
              }}
              style={{ borderRadius: 10, fontWeight: 700 }}
            >
              {t('takeaway_walkin', 'Takeaway / Walk-in')}
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setAddModalVisible(true)}
              style={{
                borderRadius: 10,
                background: activeBillerColor,
                borderColor: activeBillerColor,
                fontWeight: 800,
              }}
            >
              {t('add_table', 'Add Table')}
            </Button>
          </div>
        </div>

        {/* Stats Summary Bar & Search */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#ffffff',
            padding: '12px 18px',
            borderRadius: 14,
            border: '1px solid #e2e8f0',
            marginBottom: 14,
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          {/* Quick Filter Counters */}
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
              <AppstoreOutlined style={{ color: activeBillerColor }} />
              <span>{t('total_tables', 'Total')}:</span>
              <Tag color="blue" style={{ borderRadius: 6, fontWeight: 800, margin: 0 }}>
                {counts.total}
              </Tag>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#10b981' }}>
              <CheckCircleOutlined />
              <span>{t('available', 'Available')}:</span>
              <Tag color="success" style={{ borderRadius: 6, fontWeight: 800, margin: 0 }}>
                {counts.available}
              </Tag>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#ef4444' }}>
              <ClockCircleOutlined />
              <span>{t('occupied', 'Occupied')}:</span>
              <Tag color="error" style={{ borderRadius: 6, fontWeight: 800, margin: 0 }}>
                {counts.occupied}
              </Tag>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#7c3aed' }}>
              <TeamOutlined />
              <span>{t('shared_tables', 'Shared Tables')}:</span>
              <Tag color="purple" style={{ borderRadius: 6, fontWeight: 800, margin: 0 }}>
                {counts.shared || tables.filter((t) => t.is_shared).length}
              </Tag>
            </div>
          </div>

          {/* Search Table */}
          <Input
            placeholder={t('search_table_placeholder', 'Search table, floor, group, guest...')}
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            allowClear
            style={{ width: 270, borderRadius: 10 }}
          />
        </div>

        {/* Floor Tabs */}
        <div style={{ marginBottom: 14 }}>
          <Tabs
            activeKey={String(activeFloor)}
            onChange={(key) => setActiveFloor(key)}
            type="card"
            style={{ fontWeight: 700 }}
            items={[
              {
                key: 'all',
                label: `🏢 ${t('all_floors', 'All Floors')} (${tables.length})`,
              },
              ...floors.map((f) => {
                const countOnFloor = tables.filter(
                  (tbl) => String(tbl.floor) === String(f.id) || tbl.floor_name === f.name
                ).length;
                return {
                  key: String(f.id),
                  label: `📍 ${f.name} (${countOnFloor})`,
                };
              }),
            ]}
          />
        </div>

        {/* Table Cards Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 12, color: '#64748b', fontWeight: 600 }}>
              {t('loading_tables', 'Loading restaurant floor plan...')}
            </div>
          </div>
        ) : filteredTables.length === 0 ? (
          <div style={{ background: '#ffffff', borderRadius: 16, padding: '48px 0', border: '1px dashed #cbd5e1' }}>
            <Empty description={t('no_tables_found', 'No tables found in this floor / area')} />
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(235px, 1fr))',
              gap: 14,
              maxHeight: 480,
              overflowY: 'auto',
              paddingRight: 4,
            }}
          >
            {filteredTables.map((tbl) => {
              const isSelected = currentTableId === tbl.id || currentTable === tbl.name;
              const isOccupied = tbl.is_occupied;
              const isShared = tbl.is_shared;
              const borrowedChairs = tbl.borrowed_chairs || 0;
              const effectiveSeats = tbl.seats || tbl.effective_seats || 4;

              return (
                <div
                  key={tbl.id}
                  onClick={() => handleTableClick(tbl)}
                  style={{
                    background: isSelected
                      ? `${activeBillerColor}08`
                      : '#ffffff',
                    borderRadius: 16,
                    padding: '14px 14px 12px 14px',
                    border: isSelected
                      ? `2.5px solid ${activeBillerColor}`
                      : isShared
                      ? '1.8px solid #c084fc'
                      : isOccupied
                      ? '1.5px solid #fecaca'
                      : '1.5px solid #e2e8f0',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: isSelected
                      ? `0 6px 20px ${activeBillerColor}25`
                      : isShared
                      ? '0 3px 12px rgba(147, 51, 234, 0.08)'
                      : '0 2px 8px rgba(0,0,0,0.03)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = isSelected
                      ? `0 6px 20px ${activeBillerColor}25`
                      : isShared
                      ? '0 3px 12px rgba(147, 51, 234, 0.08)'
                      : '0 2px 8px rgba(0,0,0,0.03)';
                  }}
                >
                  {/* Card Header: Table Name + Status Tag */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div>
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 900,
                          color: isSelected ? activeBillerColor : '#0f172a',
                          letterSpacing: '-0.2px',
                        }}
                      >
                        {tbl.name}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
                        📍 {tbl.floor_name || 'Ground Floor'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                      {isShared ? (
                        <Tag
                          color="purple"
                          style={{
                            borderRadius: 8,
                            fontWeight: 800,
                            fontSize: 10.5,
                            padding: '1px 7px',
                            margin: 0,
                          }}
                        >
                          👥 {tbl.total_bills || tbl.bills?.length} Groups
                        </Tag>
                      ) : (
                        <Tag
                          color={isOccupied ? 'error' : 'success'}
                          style={{
                            borderRadius: 8,
                            fontWeight: 800,
                            fontSize: 11,
                            padding: '1px 7px',
                            margin: 0,
                          }}
                        >
                          {isOccupied ? t('occupied', 'Occupied') : t('available', 'Available')}
                        </Tag>
                      )}
                    </div>
                  </div>

                  {/* Card Body: Details & Bill Summary */}
                  {isOccupied ? (
                    <div
                      style={{
                        background: isShared ? '#faf5ff' : '#fef2f2',
                        borderRadius: 10,
                        padding: '8px 10px',
                        border: isShared ? '1px solid #f3e8ff' : '1px solid #fee2e2',
                        margin: '8px 0',
                      }}
                    >
                      {/* Total & Items Count */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: isShared ? '#6b21a8' : '#991b1b' }}>
                          📦 {tbl.bill_items_count} {t('items', 'items')}
                        </span>
                        <span style={{ fontSize: 13.5, fontWeight: 900, color: isShared ? '#7e22ce' : '#dc2626' }}>
                          ${(tbl.bill_total || 0).toFixed(2)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: isShared ? '#9333ea' : '#b91c1c', marginTop: 2 }}>
                        <span>៛{Math.round((tbl.bill_total || 0) * khrExchangeRate).toLocaleString()}</span>
                        {tbl.bill_start_date && (
                          <span>⏱️ {formatElapsedTime(tbl.bill_start_date)}</span>
                        )}
                      </div>

                      {/* Sub-Bills Pills Preview if Shared Table */}
                      {isShared && tbl.bills && tbl.bills.length > 0 ? (
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6, paddingTop: 4, borderTop: '1px dashed #e9d5ff' }}>
                          {tbl.bills.map((b) => (
                            <span
                              key={b.id}
                              style={{
                                background: '#f3e8ff',
                                color: '#6b21a8',
                                padding: '1px 6px',
                                borderRadius: 6,
                                fontSize: 9.5,
                                fontWeight: 800,
                              }}
                            >
                              {b.sub_bill_name}: ${b.total.toFixed(2)}
                            </span>
                          ))}
                        </div>
                      ) : tbl.bill_customer ? (
                        <div style={{ fontSize: 10, color: '#7f1d1d', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          👤 {tbl.bill_customer}
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div
                      style={{
                        background: '#f0fdf4',
                        borderRadius: 10,
                        padding: '12px 10px',
                        border: '1px solid #dcfce7',
                        margin: '8px 0',
                        textAlign: 'center',
                        color: '#15803d',
                        fontSize: 11.5,
                        fontWeight: 700,
                      }}
                    >
                      ✨ {t('table_ready', 'Ready for Dine-In Guests')}
                    </div>
                  )}

                  {/* Dynamic Seat Capacity & Chair Badge */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: 11,
                      color: '#475569',
                      marginBottom: 6,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <UserOutlined />
                      <span style={{ fontWeight: 700 }}>
                        {effectiveSeats} {t('seats', 'Seats')}
                      </span>
                      {borrowedChairs !== 0 && (
                        <Tooltip title={tbl.chair_notes || (borrowedChairs > 0 ? `+${borrowedChairs} chairs borrowed` : `${borrowedChairs} chairs lent`)}>
                          <Tag
                            color={borrowedChairs > 0 ? 'orange' : 'default'}
                            style={{
                              borderRadius: 6,
                              fontWeight: 800,
                              fontSize: 9.5,
                              padding: '0 4px',
                              margin: 0,
                            }}
                          >
                            🪑 {borrowedChairs > 0 ? `+${borrowedChairs}` : borrowedChairs}
                          </Tag>
                        </Tooltip>
                      )}
                    </div>

                    {/* Quick Chair Adjustment Button */}
                    <Tooltip title={t('adjust_chairs_tooltip', 'Move chairs / Adjust live seats for this table')}>
                      <Button
                        type="text"
                        size="small"
                        onClick={(e) => openChairModal(e, tbl)}
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#d97706',
                          padding: '0 6px',
                          height: 22,
                          background: '#fef3c7',
                          borderRadius: 6,
                        }}
                      >
                        🪑 Seats
                      </Button>
                    </Tooltip>
                  </div>

                  {/* Card Footer: Action Tools */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: 6,
                      borderTop: '1px solid #f1f5f9',
                      fontSize: 11,
                    }}
                  >
                    {isOccupied ? (
                      <>
                        <Button
                          type="link"
                          size="small"
                          onClick={(e) => openSharedGroupsModal(e, tbl)}
                          style={{
                            padding: 0,
                            fontSize: 11,
                            fontWeight: 800,
                            color: isShared ? '#7e22ce' : activeBillerColor,
                            height: 24,
                          }}
                        >
                          {isShared ? `👥 Manage Groups` : `View Order`} <RightOutlined style={{ fontSize: 9 }} />
                        </Button>

                        <div style={{ display: 'flex', gap: 4 }}>
                          <Tooltip title={t('transfer_table', 'Transfer guests / order to another table (Move, Merge, or Join)')}>
                            <Button
                              type="text"
                              size="small"
                              icon={<SwapOutlined />}
                              onClick={(e) => openTransferModal(e, tbl)}
                              style={{ color: '#0284c7', padding: '0 4px', height: 24 }}
                            />
                          </Tooltip>

                          <Popconfirm
                            title={t('confirm_release_table', `Release table "${tbl.name}" and clear open bill?`)}
                            onConfirm={(e) => handleReleaseTable(e, tbl)}
                            okText={t('yes', 'Yes')}
                            cancelText={t('no', 'No')}
                          >
                            <Button
                              type="text"
                              size="small"
                              icon={<CloseCircleOutlined />}
                              onClick={(e) => e.stopPropagation()}
                              style={{ color: '#dc2626', padding: '0 4px', height: 24 }}
                            />
                          </Popconfirm>
                        </div>
                      </>
                    ) : (
                      <span style={{ color: '#16a34a', fontWeight: 600, fontSize: 11 }}>
                        Click to seat guests ➔
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* 1. SHARED TABLE & MULTI-GROUP SUB-BILL SELECTION MODAL */}
      {/* ========================================================================= */}
      <Modal
        open={sharedModalVisible}
        onCancel={() => {
          setSharedModalVisible(false);
          setIsAddingNewGroup(false);
        }}
        footer={null}
        width={720}
        destroyOnClose
        centered
        style={{ borderRadius: 20, overflow: 'hidden' }}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: '#faf5ff',
                color: '#7e22ce',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
              }}
            >
              <TeamOutlined />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#0f172a' }}>
                {selectedSharedTable?.name} • {t('shared_table_orders', 'Dine-In Orders & Groups')}
              </div>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                {selectedSharedTable?.floor_name || 'Main Area'} • {selectedSharedTable?.seats} Seats ({selectedSharedTable?.bills?.length || 1} Independent Groups)
              </div>
            </div>
          </div>
        }
      >
        <div style={{ padding: '8px 0' }}>
          {/* Table Combined Summary Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f8fafc',
              padding: '10px 14px',
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              marginBottom: 16,
            }}
          >
            <div>
              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Combined Table Total: </span>
              <span style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', marginLeft: 6 }}>
                ${(selectedSharedTable?.bill_total || 0).toFixed(2)}
              </span>
              <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 6 }}>
                (៛{Math.round((selectedSharedTable?.bill_total || 0) * khrExchangeRate).toLocaleString()})
              </span>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <Button
                size="small"
                icon={<SwapOutlined />}
                onClick={(e) => openTransferModal(e, selectedSharedTable)}
                style={{ borderRadius: 8, fontWeight: 700, color: '#0284c7' }}
              >
                Transfer Table
              </Button>
              <Button
                size="small"
                icon={<PlusOutlined />}
                type="primary"
                onClick={() => setIsAddingNewGroup(true)}
                style={{ borderRadius: 8, fontWeight: 800, background: '#7e22ce', borderColor: '#7e22ce' }}
              >
                + Add New Group
              </Button>
            </div>
          </div>

          {/* Quick Add New Group Input Form if triggered */}
          {isAddingNewGroup && (
            <div
              style={{
                background: '#faf5ff',
                padding: '12px 14px',
                borderRadius: 12,
                border: '1.5px dashed #c084fc',
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 800, color: '#6b21a8', marginBottom: 6 }}>
                Seat Another Group on this Table (Shared Dining):
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Input
                  placeholder={`e.g. Group ${String.fromCharCode(65 + (selectedSharedTable?.bills?.length || 1))} or Alice's Party`}
                  value={newGroupNameInput}
                  onChange={(e) => setNewGroupNameInput(e.target.value)}
                  style={{ borderRadius: 8 }}
                  autoFocus
                />
                <Button
                  type="primary"
                  onClick={() => handleAddNewGroupToTable(selectedSharedTable)}
                  style={{ borderRadius: 8, fontWeight: 800, background: '#7e22ce', borderColor: '#7e22ce' }}
                >
                  Create & Open
                </Button>
                <Button onClick={() => setIsAddingNewGroup(false)} style={{ borderRadius: 8 }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* List of Sub-Bills (Groups) on Table */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 380, overflowY: 'auto' }}>
            {selectedSharedTable?.bills && selectedSharedTable.bills.length > 0 ? (
              selectedSharedTable.bills.map((b, idx) => (
                <div
                  key={b.id || idx}
                  style={{
                    background: activeSubBillId === b.id ? '#f0fdf4' : '#ffffff',
                    border: activeSubBillId === b.id ? '2px solid #16a34a' : '1px solid #e2e8f0',
                    borderRadius: 14,
                    padding: '12px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                  }}
                >
                  {/* Left: Group Identifier & Summary */}
                  <div style={{ flex: 1, marginRight: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <Tag color="purple" style={{ borderRadius: 6, fontWeight: 800, fontSize: 12, padding: '2px 8px', margin: 0 }}>
                        👥 {b.sub_bill_name || `Group ${String.fromCharCode(65 + idx)}`}
                      </Tag>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>
                        👤 {b.customer || 'General Guest'}
                      </span>
                      {b.start_date && (
                        <span style={{ fontSize: 11, color: '#64748b' }}>
                          ⏱️ {formatElapsedTime(b.start_date)} ago
                        </span>
                      )}
                    </div>

                    {/* Items count & preview */}
                    <div style={{ fontSize: 11.5, color: '#64748b' }}>
                      <span style={{ fontWeight: 700, color: '#334155' }}>{b.items?.length || b.count || 0} items: </span>
                      {b.items && b.items.length > 0
                        ? b.items.map((it) => `${it.quantity}x ${it.product_name}`).slice(0, 3).join(', ') +
                          (b.items.length > 3 ? '...' : '')
                        : 'No items yet'}
                    </div>
                  </div>

                  {/* Middle: Amount */}
                  <div style={{ textAlign: 'right', marginRight: 16 }}>
                    <div style={{ fontSize: 17, fontWeight: 900, color: '#0f172a' }}>
                      ${(b.total || 0).toFixed(2)}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>
                      ៛{Math.round((b.total || 0) * khrExchangeRate).toLocaleString()}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Tooltip title="Transfer only this sub-bill to another table">
                      <Button
                        size="middle"
                        icon={<SwapOutlined />}
                        onClick={(e) => openTransferModal(e, selectedSharedTable, b.id)}
                        style={{ borderRadius: 8, color: '#0284c7' }}
                      />
                    </Tooltip>
                    <Button
                      type="primary"
                      icon={<ShoppingCartOutlined />}
                      onClick={() => handleOpenSubBillInCart(selectedSharedTable, b)}
                      style={{
                        borderRadius: 8,
                        fontWeight: 800,
                        background: activeBillerColor,
                        borderColor: activeBillerColor,
                      }}
                    >
                      Open in Cart
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#64748b' }}>
                No active orders on this table.
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* 2. DYNAMIC CHAIR ALLOCATION & SEAT MANAGEMENT MODAL */}
      {/* ========================================================================= */}
      <Modal
        open={chairModalVisible}
        onCancel={() => setChairModalVisible(false)}
        footer={null}
        width={540}
        destroyOnClose
        centered
        style={{ borderRadius: 18, overflow: 'hidden' }}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: '#fef3c7',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
              }}
            >
              🪑
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#0f172a' }}>
                {t('manage_table_chairs', 'Move Chairs & Dynamic Seating')}
              </div>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                {selectedChairTable?.name} ({selectedChairTable?.floor_name || 'Ground Floor'})
              </div>
            </div>
          </div>
        }
      >
        <div style={{ padding: '8px 0' }}>
          {/* Current Seat Overview */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 10,
              background: '#f8fafc',
              padding: '12px',
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              marginBottom: 16,
              textAlign: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Base Capacity</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#0f172a' }}>
                {selectedChairTable?.customer_qty || 4}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Extra / Borrowed</div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 900,
                  color: (selectedChairTable?.borrowed_chairs || 0) > 0 ? '#d97706' : '#64748b',
                }}
              >
                {(selectedChairTable?.borrowed_chairs || 0) > 0
                  ? `+${selectedChairTable?.borrowed_chairs}`
                  : selectedChairTable?.borrowed_chairs || 0}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 700 }}>Live Effective Seats</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#16a34a' }}>
                {selectedChairTable?.seats || 4}
              </div>
            </div>
          </div>

          {/* Action Choice: Borrow, Add Extra, Return, Reset */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
              Select Chair Adjustment Action:
            </label>
            <Radio.Group
              value={chairAction}
              onChange={(e) => setChairAction(e.target.value)}
              style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}
            >
              <Radio.Button value="borrow" style={{ textAlign: 'center', borderRadius: 8 }}>
                🪑 Borrow from Table
              </Radio.Button>
              <Radio.Button value="add" style={{ textAlign: 'center', borderRadius: 8 }}>
                ➕ Add from Storage
              </Radio.Button>
              <Radio.Button
                value="return"
                disabled={!(selectedChairTable?.borrowed_chairs > 0)}
                style={{ textAlign: 'center', borderRadius: 8 }}
              >
                ↩️ Return Chairs
              </Radio.Button>
              <Radio.Button value="reset" style={{ textAlign: 'center', borderRadius: 8 }}>
                🔄 Reset to Default
              </Radio.Button>
            </Radio.Group>
          </div>

          {/* If Action === 'borrow', select Donor Table */}
          {chairAction === 'borrow' && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Borrow chairs from which table?
              </label>
              <Select
                placeholder="Select donor table..."
                style={{ width: '100%' }}
                size="large"
                value={donorTableId}
                onChange={setDonorTableId}
              >
                {tables
                  .filter((t) => t.id !== selectedChairTable?.id)
                  .map((t) => (
                    <Option key={t.id} value={t.id}>
                      {t.is_occupied ? '🔴' : '🟢'} {t.name} ({t.floor_name}) - {t.seats} seats ({t.is_occupied ? 'Occupied' : 'Empty'})
                    </Option>
                  ))}
              </Select>
            </div>
          )}

          {/* Count Stepper */}
          {chairAction !== 'reset' && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Number of Chairs:
              </label>
              <InputNumber
                min={1}
                max={20}
                value={chairCount}
                onChange={setChairCount}
                size="large"
                style={{ width: '100%', borderRadius: 8 }}
              />
            </div>
          )}

          {/* Optional Note */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
              Notes / Reason (Optional):
            </label>
            <Input
              placeholder="e.g. Birthday party, added baby chair, lent 2 to Table 4..."
              value={chairNote}
              onChange={(e) => setChairNote(e.target.value)}
              style={{ borderRadius: 8 }}
            />
          </div>

          {/* Dialog Action Buttons */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button onClick={() => setChairModalVisible(false)} size="large" style={{ borderRadius: 10 }}>
              Cancel
            </Button>
            <Button
              type="primary"
              loading={submittingChairs}
              onClick={handleConfirmChairAdjust}
              size="large"
              style={{
                borderRadius: 10,
                background: '#d97706',
                borderColor: '#d97706',
                fontWeight: 800,
              }}
            >
              Update Seating
            </Button>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* 3. SOPHISTICATED TABLE & ORDER TRANSFER MODAL */}
      {/* ========================================================================= */}
      <Modal
        open={transferModalVisible}
        onCancel={() => setTransferModalVisible(false)}
        title={t('transfer_table_order', 'Transfer Order / Guests to Another Table')}
        footer={null}
        destroyOnClose
        centered
        width={560}
        style={{ borderRadius: 18, overflow: 'hidden' }}
      >
        <div style={{ padding: '4px 0' }}>
          {/* Source Table Summary */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 6 }}>
              {t('transfer_from_desc', 'Source Table:')}
            </div>
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                background: '#fef2f2',
                border: '1px solid #fee2e2',
                fontWeight: 800,
                color: '#991b1b',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>🍽️ {sourceTable?.name} ({sourceTable?.floor_name})</div>
              <div>${(sourceTable?.bill_total || 0).toFixed(2)} ({sourceTable?.bill_items_count} items)</div>
            </div>
          </div>

          {/* Sub-Bill Selector if source table has multiple groups */}
          {sourceTable?.bills && sourceTable.bills.length > 1 && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
                Which group / sub-bill to transfer?
              </label>
              <Select
                value={selectedSubBillId}
                onChange={setSelectedSubBillId}
                size="large"
                style={{ width: '100%' }}
              >
                <Option value="all">Transfer Entire Table (All {sourceTable.bills.length} Groups)</Option>
                {sourceTable.bills.map((b) => (
                  <Option key={b.id} value={b.id}>
                    👥 {b.sub_bill_name} ({b.customer}) - ${b.total.toFixed(2)}
                  </Option>
                ))}
              </Select>
            </div>
          )}

          {/* Destination Table Selector */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
              {t('select_target_table', 'Transfer to Destination Table:')}
            </label>
            <Select
              placeholder={t('choose_target_table', 'Choose a table...')}
              size="large"
              style={{ width: '100%' }}
              value={targetTableId}
              onChange={setTargetTableId}
            >
              {tables
                .filter((tbl) => tbl.id !== sourceTable?.id)
                .map((tbl) => (
                  <Option key={tbl.id} value={tbl.id}>
                    {tbl.is_occupied ? '🔴' : '🟢'} {tbl.name} ({tbl.floor_name}) - {tbl.seats} Seats ({tbl.is_occupied ? `Occupied: $${tbl.bill_total.toFixed(2)}` : 'Available'})
                  </Option>
                ))}
            </Select>
          </div>

          {/* Intelligent Merge Mode if destination table is OCCUPIED */}
          {selectedTargetTable && selectedTargetTable.is_occupied && (
            <div
              style={{
                background: '#faf5ff',
                borderRadius: 12,
                padding: '12px 14px',
                border: '1.5px solid #d8b4fe',
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 800, color: '#6b21a8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>Destination Table "{selectedTargetTable.name}" is already occupied!</span>
              </div>
              <div style={{ fontSize: 12, color: '#475569', marginBottom: 10 }}>
                Guests are joining this table. How should their bill be handled?
              </div>

              <Radio.Group value={mergeMode} onChange={(e) => setMergeMode(e.target.value)} style={{ width: '100%' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Radio value="merge">
                    <span style={{ fontWeight: 800, color: '#0f172a' }}>Merge Bills into One Invoice</span>
                    <div style={{ fontSize: 11, color: '#64748b', marginLeft: 24 }}>
                      Combine items into the destination bill so guests pay together on a single check.
                    </div>
                  </Radio>
                  <Radio value="separate">
                    <span style={{ fontWeight: 800, color: '#7e22ce' }}>Keep as Separate Sub-Bill (Shared Table)</span>
                    <div style={{ fontSize: 11, color: '#64748b', marginLeft: 24 }}>
                      Guests share the table but keep their own independent order and separate receipt.
                    </div>
                  </Radio>
                </div>
              </Radio.Group>
            </div>
          )}

          {/* Chair Moving Option */}
          <div
            style={{
              background: '#f8fafc',
              padding: '10px 14px',
              borderRadius: 10,
              border: '1px solid #e2e8f0',
              marginBottom: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Checkbox checked={moveChairs} onChange={(e) => setMoveChairs(e.target.checked)}>
                <span style={{ fontWeight: 700, fontSize: 12, color: '#334155' }}>
                  Move chairs along with guests to new table?
                </span>
              </Checkbox>
              {moveChairs && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, color: '#64748b' }}>Count:</span>
                  <InputNumber
                    min={1}
                    max={10}
                    value={moveChairsCount}
                    onChange={setMoveChairsCount}
                    size="small"
                    style={{ width: 60 }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button onClick={() => setTransferModalVisible(false)} size="large" style={{ borderRadius: 10 }}>
              {t('cancel', 'Cancel')}
            </Button>
            <Button
              type="primary"
              icon={<SwapOutlined />}
              loading={transferring}
              onClick={handleConfirmTransfer}
              size="large"
              style={{
                borderRadius: 10,
                background: '#0284c7',
                borderColor: '#0284c7',
                fontWeight: 800,
              }}
            >
              {t('confirm_transfer', 'Confirm Transfer')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* 4. ADD NEW TABLE MODAL */}
      {/* ========================================================================= */}
      <Modal
        open={addModalVisible}
        onCancel={() => setAddModalVisible(false)}
        title={t('add_restaurant_table', 'Add New Restaurant Table / Room')}
        footer={null}
        destroyOnClose
        centered
        style={{ borderRadius: 18, overflow: 'hidden' }}
      >
        <Form
          form={addForm}
          layout="vertical"
          onFinish={handleCreateNewTable}
          initialValues={{ floor: '1', customer_qty: 4, type: 'table' }}
        >
          <Form.Item
            name="name"
            label={t('table_name', 'Table / Room Name')}
            rules={[{ required: true, message: 'Please enter table name (e.g. Table 1, VIP 02)' }]}
          >
            <Input placeholder="e.g. Table 10, Bar-01, VIP Lounge" size="large" />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item
              name="floor"
              label={t('floor_area', 'Floor / Zone')}
              rules={[{ required: true }]}
            >
              <Select size="large">
                {floors.map((f) => (
                  <Option key={f.id} value={String(f.id)}>
                    {f.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="customer_qty"
              label={t('capacity_seats', 'Capacity (Seats)')}
              rules={[{ required: true }]}
            >
              <InputNumber min={1} max={50} style={{ width: '100%' }} size="large" />
            </Form.Item>
          </div>

          <Form.Item name="description" label={t('description', 'Notes / Remarks (Optional)')}>
            <Input.TextArea placeholder="Near window, outdoor smoking area..." rows={2} />
          </Form.Item>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
            <Button onClick={() => setAddModalVisible(false)} size="large" style={{ borderRadius: 10 }}>
              {t('cancel', 'Cancel')}
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={submittingAdd}
              size="large"
              style={{
                borderRadius: 10,
                background: activeBillerColor,
                borderColor: activeBillerColor,
                fontWeight: 800,
              }}
            >
              {t('save_table', 'Save Table')}
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
}
