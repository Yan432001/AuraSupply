import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button, Tag, Spin, message, Switch, Tooltip, Badge } from 'antd';
import {
  CheckOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
  UserOutlined,
  SoundOutlined,
  CoffeeOutlined,
  FireOutlined,
  DesktopOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const PosKitchenDisplay = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedStation, setSelectedStation] = useState('all'); // all, Bar, Kitchen, Bakery, Grill
  const [soundAlert, setSoundAlert] = useState(true);
  const [previousOrderCount, setPreviousOrderCount] = useState(0);

  // Play gentle alert chime for new kitchen orders
  const playChime = useCallback(() => {
    if (!soundAlert) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (_) {}
  }, [soundAlert]);

  // Fetch kitchen orders from API
  const fetchKitchenOrders = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await axios.get('/api/admin/pos/kitchen/orders');
      if (res.data?.success && Array.isArray(res.data.orders)) {
        const fetchedOrders = res.data.orders;
        // If order count increased, play alert chime
        if (fetchedOrders.length > previousOrderCount && previousOrderCount > 0) {
          playChime();
        }
        setPreviousOrderCount(fetchedOrders.length);
        setOrders(fetchedOrders);
      }
    } catch (err) {
      if (!isSilent) {
        message.error('Failed to load kitchen display tickets');
      }
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [previousOrderCount, playChime]);

  useEffect(() => {
    fetchKitchenOrders();
  }, [fetchKitchenOrders]);

  // Auto-polling interval
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchKitchenOrders(true);
    }, 6000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchKitchenOrders]);

  // Toggle Item status between Pending and Ready/Done
  const handleToggleItemStatus = async (itemId, currentStatus) => {
    const nextStatus = currentStatus === 'pending' ? 'completed' : 'pending';
    try {
      await axios.put('/api/admin/pos/kitchen/item-status', {
        item_id: itemId,
        status: nextStatus,
      });
      // Local state optimistic update
      setOrders((prev) =>
        prev.map((ord) => ({
          ...ord,
          items: (ord.items || []).map((it) =>
            it.s_id === itemId ? { ...it, status: nextStatus } : it
          ),
        }))
      );
    } catch (err) {
      message.error('Failed to update item status');
    }
  };

  // Mark entire ticket Done
  const handleCompleteOrder = async (orderId) => {
    try {
      await axios.put('/api/admin/pos/kitchen/order-done', { order_id: orderId });
      message.success(`Order #${orderId} completed!`);
      // Remove ticket from board
      setOrders((prev) => prev.filter((ord) => ord.id !== orderId));
      setPreviousOrderCount((c) => Math.max(0, c - 1));
    } catch (err) {
      message.error('Failed to mark order done');
    }
  };

  // Filter orders by station type
  const filteredOrders = useMemo(() => {
    if (selectedStation === 'all') return orders;
    return orders
      .map((ord) => {
        const matchingItems = (ord.items || []).filter(
          (it) => (it.stock_type || 'Kitchen').toLowerCase() === selectedStation.toLowerCase()
        );
        if (matchingItems.length === 0) return null;
        return {
          ...ord,
          items: matchingItems,
        };
      })
      .filter(Boolean);
  }, [orders, selectedStation]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f8fafc',
        fontFamily: "'Segoe UI', Aptos, -apple-system, sans-serif",
        padding: '20px 24px',
        color: '#1e293b',
      }}
    >
      {/* Top Navigation & Controls Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          background: '#ffffff',
          padding: '12px 20px',
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/admins/pos')}
            style={{ borderRadius: 8, fontWeight: 700 }}
          >
            Back to POS
          </Button>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>
            Active Tickets: <span style={{ color: '#2563eb', fontWeight: 900 }}>{filteredOrders.length}</span>
          </div>
        </div>

        {/* Station Filter Tabs */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { id: 'all', label: 'All Stations' },
            { id: 'kitchen', label: '🍳 Kitchen' },
            { id: 'bar', label: '🍹 Bar' },
            { id: 'bakery', label: '🥐 Bakery' },
          ].map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setSelectedStation(st.id)}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                border: selectedStation === st.id ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                background: selectedStation === st.id ? '#eff6ff' : '#ffffff',
                color: selectedStation === st.id ? '#1d4ed8' : '#475569',
                transition: 'all 0.15s ease',
              }}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Right Tools: Auto Refresh, Sound, Reload */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600 }}>
            <span>Auto Refresh (6s)</span>
            <Switch size="small" checked={autoRefresh} onChange={setAutoRefresh} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600 }}>
            <SoundOutlined />
            <span>Sound</span>
            <Switch size="small" checked={soundAlert} onChange={setSoundAlert} />
          </div>

          <Button
            icon={<ReloadOutlined />}
            onClick={() => fetchKitchenOrders(false)}
            loading={loading}
            style={{ borderRadius: 8, fontWeight: 700 }}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Title Header Matching Image 3: "Kitchen Display" */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 800,
            margin: 0,
            color: '#0f172a',
            letterSpacing: 0.5,
          }}
        >
          Kitchen Display
        </h1>
        <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
          Real-time order tickets queue for chefs and bartenders
        </div>
      </div>

      {/* Orders Grid Matching Image 3 Multi-Ticket Layout */}
      {loading && orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 12, color: '#64748b', fontWeight: 600 }}>Loading active kitchen orders...</div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div
          style={{
            maxWidth: 480,
            margin: '60px auto',
            textAlign: 'center',
            background: '#ffffff',
            padding: '40px 30px',
            borderRadius: 16,
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ fontSize: 50, marginBottom: 12 }}>👨‍🍳</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>All Clear! No Pending Orders</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>
            When cashiers hold or send orders to the kitchen, tickets will immediately appear here.
          </div>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(480px, 1fr))',
            gap: 20,
            alignItems: 'start',
          }}
        >
          {filteredOrders.map((order, orderIdx) => {
            // Group items inside this ticket by station type (e.g. Bar, Kitchen)
            const itemsByStation = (order.items || []).reduce((acc, it) => {
              const type = it.stock_type || 'Kitchen';
              if (!acc[type]) acc[type] = [];
              acc[type].push(it);
              return acc;
            }, {});

            const dateStr = order.date
              ? new Date(order.date).toLocaleString('en-GB', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Just now';

            const allItemsDone =
              order.items && order.items.length > 0 && order.items.every((it) => it.status === 'completed');

            return (
              <div
                key={order.id || orderIdx}
                style={{
                  border: '1px solid #000000',
                  borderRadius: 8,
                  background: '#ffffff',
                  padding: 16,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                  position: 'relative',
                  transition: 'all 0.15s ease',
                }}
              >
                {/* Order Header Matching Image 3: Order : #X in red, Date, Customer, Raised By */}
                <h2
                  style={{
                    color: 'red',
                    textAlign: 'center',
                    fontSize: 20,
                    fontWeight: 900,
                    margin: '0 0 10px 0',
                    letterSpacing: 0.5,
                  }}
                >
                  Order : #{order.refer || order.id}
                </h2>

                <div style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 12, color: '#1e293b' }}>
                  <div>
                    <strong>Date :</strong> {dateStr}
                  </div>
                  <div>
                    <strong>Customer :</strong> {order.customer || 'General Customer'}
                  </div>
                  <div>
                    <strong>Raised By :</strong> {order.raised_by?.trim() || order.cashier_username || 'Cashier'}
                  </div>
                  {order.table_name && (
                    <div>
                      <strong>Table / Location :</strong> <span style={{ color: '#2563eb', fontWeight: 800 }}>📍 {order.table_name}</span>
                    </div>
                  )}
                </div>

                {/* Grouped by Station Types (Matching Image 3: Type: Bar) */}
                {Object.entries(itemsByStation).map(([stationType, stationItems]) => (
                  <div key={stationType} style={{ marginBottom: 14 }}>
                    {/* Blue Station Header Banner Matching Image 3 */}
                    <div
                      style={{
                        background: '#5DADE2',
                        color: '#000000',
                        fontWeight: 800,
                        fontSize: 13,
                        padding: '6px 10px',
                        borderTopLeftRadius: 4,
                        borderTopRightRadius: 4,
                        border: '1px solid #000000',
                        borderBottom: 'none',
                      }}
                    >
                      Type : {stationType}
                    </div>

                    {/* Items Table Matching Image 3 */}
                    <table
                      style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        border: '1px solid #000000',
                        fontSize: 12.5,
                      }}
                    >
                      <thead>
                        <tr style={{ background: '#DCDCDC' }}>
                          <th style={{ border: '1px solid #000000', padding: '5px 8px', width: '8%', textAlign: 'center' }}>
                            No
                          </th>
                          <th style={{ border: '1px solid #000000', padding: '5px 8px', width: '22%', textAlign: 'left' }}>
                            Code
                          </th>
                          <th style={{ border: '1px solid #000000', padding: '5px 8px', textAlign: 'left' }}>
                            Name
                          </th>
                          <th style={{ border: '1px solid #000000', padding: '5px 8px', width: '16%', textAlign: 'center' }}>
                            Quantity
                          </th>
                          <th style={{ border: '1px solid #000000', padding: '5px 8px', width: '18%', textAlign: 'center' }}>
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {stationItems.map((item, itIdx) => {
                          const isDone = item.status === 'completed';
                          return (
                            <tr
                              key={item.s_id || itIdx}
                              style={{
                                background: isDone ? '#f0fdf4' : '#ffffff',
                                transition: 'background 0.15s ease',
                              }}
                            >
                              <td style={{ border: '1px solid #000000', padding: '6px 8px', textAlign: 'center', fontWeight: 700 }}>
                                {itIdx + 1}
                              </td>
                              <td style={{ border: '1px solid #000000', padding: '6px 8px', color: '#475569', fontWeight: 600 }}>
                                {item.product_code}
                              </td>
                              <td style={{ border: '1px solid #000000', padding: '6px 8px', fontWeight: 700, color: isDone ? '#15803d' : '#0f172a' }}>
                                <div>{item.product_name}</div>
                                {item.comment && (
                                  <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 800, marginTop: 2 }}>
                                    ⚠️ Note: {item.comment}
                                  </div>
                                )}
                              </td>
                              <td style={{ border: '1px solid #000000', padding: '6px 8px', textAlign: 'center', fontWeight: 900, fontSize: 14 }}>
                                {parseFloat(item.quantity).toFixed(2)}
                              </td>
                              <td style={{ border: '1px solid #000000', padding: '6px 8px', textAlign: 'center' }}>
                                <button
                                  type="button"
                                  onClick={() => handleToggleItemStatus(item.s_id, item.status)}
                                  style={{
                                    border: 'none',
                                    borderRadius: 5,
                                    padding: '4px 10px',
                                    fontWeight: 800,
                                    fontSize: 11.5,
                                    cursor: 'pointer',
                                    background: isDone ? '#218838' : '#edb409',
                                    color: '#ffffff',
                                    textTransform: 'capitalize',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                    transition: 'all 0.12s ease',
                                  }}
                                  title="Click to toggle item preparation status"
                                >
                                  {isDone ? '✓ Done' : 'Pending'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ))}

                {/* Ticket Action Footer Matching Image 3: Blue Done Button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                  <button
                    type="button"
                    onClick={() => handleCompleteOrder(order.id)}
                    style={{
                      background: '#5AAAFF',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 6,
                      padding: '8px 24px',
                      fontWeight: 800,
                      fontSize: 13,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: '0 2px 8px rgba(90, 170, 255, 0.4)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <CheckOutlined /> Done
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PosKitchenDisplay;
