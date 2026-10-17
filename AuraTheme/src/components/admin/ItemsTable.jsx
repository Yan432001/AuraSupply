/**
 * HIGH-PERFORMANCE ERP ITEMS DATA TABLE
 * =====================================
 * Architected for browsing millions of master items without UI freezing or lag.
 *
 * Core Features:
 *   - O(1) Server-side Keyset (Cursor) Pagination
 *   - Debounced Search Filtering (350ms) with AbortController cancellation
 *   - Server-side column sorting with zero filesort overhead
 *   - Pessimistic Row-Locked updates via PUT /api/items/:id
 *   - Fine-grained RBAC action controls via <Can module="INVENTORY" action="..." />
 *   - Sub-50ms execution latency telemetry indicator
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import axios from 'axios';
import {
  SearchOutlined,
  ReloadOutlined,
  EditOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ThunderboltOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  LeftOutlined,
  RightOutlined,
  FilterOutlined
} from '@ant-design/icons';
import { Can, usePermission } from '../../contexts/PermissionContext';

export const ItemsTable = () => {
  const { can } = usePermission();

  // 1. Data State
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 2. Pagination State (Cursor Stack for O(1) Keyset Navigation)
  const [pageSize, setPageSize] = useState(50);
  const [cursorStack, setCursorStack] = useState([]); // Stack of previous cursors
  const [currentCursor, setCurrentCursor] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [pageIndex, setPageIndex] = useState(1);

  // 3. Search & Filter State
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [lowStockFilter, setLowStockFilter] = useState(false);

  // 4. Sorting State
  const [sortColumn, setSortColumn] = useState('id');
  const [sortDir, setSortDir] = useState('DESC');

  // 5. Telemetry & Metrics
  const [serverLatency, setServerLatency] = useState(null);

  // 6. Inline / Modal Editing State
  const [editingItem, setEditingItem] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    selling_price: '',
    cost_price: '',
    quantity_on_hand: '',
    alert_quantity: '',
    status: 'active'
  });

  // Active HTTP AbortController ref
  const abortControllerRef = useRef(null);

  // 350ms Search Debounce Timer
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      // Reset cursor stack on new search term
      setCursorStack([]);
      setCurrentCursor(null);
      setPageIndex(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchInput]);

  /**
   * Fetch Paginated Items from Server
   */
  const fetchItems = useCallback(async (cursorToFetch = null) => {
    // Cancel any previous in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      let userId = null;
      if (savedUser) {
        try { userId = JSON.parse(savedUser).id; } catch (_) {}
      }

      const params = {
        limit: pageSize,
        sort_by: sortColumn,
        sort_dir: sortDir
      };

      if (cursorToFetch) params.cursor = cursorToFetch;
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
      if (lowStockFilter) params.low_stock = 'true';

      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (userId) headers['x-user-id'] = userId;

      const res = await axios.get('/api/items', {
        params,
        headers,
        signal: abortControllerRef.current.signal
      });

      if (res.data && res.data.success) {
        setItems(res.data.data || []);
        setHasMore(Boolean(res.data.pagination?.has_more));
        setNextCursor(res.data.pagination?.next_cursor || null);
        if (res.data.meta?.execution_time_ms) {
          setServerLatency(res.data.meta.execution_time_ms);
        }
      }
    } catch (err) {
      if (axios.isCancel(err) || err.name === 'CanceledError') {
        // Request cancelled by user typing; ignore
        return;
      }
      console.error('[ItemsTable] Fetch error:', err);
      setError(err.response?.data?.message || 'Failed to load items from server.');
    } finally {
      setLoading(false);
    }
  }, [pageSize, sortColumn, sortDir, debouncedSearch, statusFilter, lowStockFilter]);

  // Refetch when filters or sorting change
  useEffect(() => {
    fetchItems(currentCursor);
  }, [fetchItems, currentCursor]);

  /**
   * Next Page Navigation (O(1) Keyset Seek)
   */
  const handleNextPage = () => {
    if (!nextCursor || !hasMore) return;
    setCursorStack((prev) => [...prev, currentCursor]);
    setCurrentCursor(nextCursor);
    setPageIndex((prev) => prev + 1);
  };

  /**
   * Previous Page Navigation
   */
  const handlePrevPage = () => {
    if (cursorStack.length === 0) return;
    const prevCursor = cursorStack[cursorStack.length - 1];
    setCursorStack((prev) => prev.slice(0, -1));
    setCurrentCursor(prevCursor);
    setPageIndex((prev) => Math.max(prev - 1, 1));
  };

  /**
   * Column Sort Toggle
   */
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDir((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'));
    } else {
      setSortColumn(column);
      setSortDir('DESC');
    }
    // Reset cursor stack on sort change
    setCursorStack([]);
    setCurrentCursor(null);
    setPageIndex(1);
  };

  /**
   * Open Edit Modal
   */
  const openEditModal = (item) => {
    setEditingItem(item);
    setEditForm({
      name: item.name || '',
      selling_price: item.selling_price || 0,
      cost_price: item.cost_price || 0,
      quantity_on_hand: item.quantity_on_hand || 0,
      alert_quantity: item.alert_quantity || 5,
      status: item.status || 'active'
    });
  };

  /**
   * Submit PUT /api/items/:id (Row-Locked Update)
   */
  const handleUpdateItem = async (e) => {
    e.preventDefault();
    if (!editingItem) return;

    setIsUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      let userId = null;
      if (savedUser) {
        try { userId = JSON.parse(savedUser).id; } catch (_) {}
      }

      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (userId) headers['x-user-id'] = userId;

      const payload = {
        name: editForm.name,
        selling_price: parseFloat(editForm.selling_price),
        cost_price: parseFloat(editForm.cost_price),
        quantity_on_hand: parseFloat(editForm.quantity_on_hand),
        alert_quantity: parseFloat(editForm.alert_quantity),
        status: editForm.status
      };

      const res = await axios.put(`/api/items/${editingItem.id}`, payload, { headers });
      if (res.data && res.data.success) {
        // Optimistic local state update
        setItems((prev) =>
          prev.map((it) => (it.id === editingItem.id ? { ...it, ...res.data.data } : it))
        );
        setEditingItem(null);
      }
    } catch (err) {
      console.error('[Update Item Error]:', err);
      alert(err.response?.data?.message || 'Failed to update item record.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="w-full bg-[var(--admin-card-bg,#ffffff)] text-[var(--admin-text,#1f2937)] rounded-xl shadow-sm border border-[var(--admin-border,#e5e7eb)] overflow-hidden">
      {/* 1. Header Toolbar */}
      <div className="p-4 border-b border-[var(--admin-border,#e5e7eb)] flex flex-wrap items-center justify-between gap-3 bg-[var(--admin-card-bg,#fafafa)]">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
            ERP Master Catalog
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
              InnoDB High-Volume
            </span>
          </h2>
          {serverLatency !== null && (
            <div className="hidden sm:flex items-center gap-1 text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
              <ThunderboltOutlined />
              <span>{serverLatency}ms latency</span>
            </div>
          )}
        </div>

        {/* Search & Action Controls */}
        <div className="flex items-center gap-2 flex-grow sm:flex-grow-0">
          <div className="relative flex-grow sm:w-72">
            <SearchOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search SKU, Barcode, Name..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-[var(--admin-border,#d1d5db)] bg-[var(--admin-card-bg,#ffffff)] text-[var(--admin-text,#111827)] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          <button
            onClick={() => fetchItems(currentCursor)}
            className="p-2 text-gray-600 hover:text-blue-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 border border-[var(--admin-border,#d1d5db)] transition-colors"
            title="Refresh Catalog"
          >
            <ReloadOutlined spin={loading} />
          </button>
        </div>
      </div>

      {/* 2. Filter Bar */}
      <div className="px-4 py-2.5 border-b border-[var(--admin-border,#e5e7eb)] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-gray-500 font-medium flex items-center gap-1">
            <FilterOutlined /> Status:
          </span>
          {['all', 'active', 'inactive', 'draft', 'discontinued'].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setCursorStack([]);
                setCurrentCursor(null);
                setPageIndex(1);
              }}
              className={`capitalize px-2.5 py-1 rounded-md transition-colors ${
                statusFilter === st
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              {st}
            </button>
          ))}

          <button
            onClick={() => {
              setLowStockFilter((prev) => !prev);
              setCursorStack([]);
              setCurrentCursor(null);
              setPageIndex(1);
            }}
            className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
              lowStockFilter
                ? 'bg-amber-600 text-white font-semibold'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
            }`}
          >
            <WarningOutlined />
            <span>Low Stock Alert</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-gray-500">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCursorStack([]);
              setCurrentCursor(null);
              setPageIndex(1);
            }}
            className="text-xs bg-[var(--admin-card-bg,#ffffff)] border border-[var(--admin-border,#d1d5db)] rounded px-2 py-0.5 focus:outline-none"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* 3. Table Grid */}
      <div className="overflow-x-auto min-h-[350px]">
        {error && (
          <div className="p-6 text-center text-red-600 bg-red-50 dark:bg-red-950/20 text-sm">
            {error}
          </div>
        )}

        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--admin-border,#e5e7eb)] bg-[var(--admin-card-bg,#f9fafb)] text-xs font-semibold text-gray-500 uppercase tracking-wider select-none">
              <th
                onClick={() => handleSort('id')}
                className="py-3 px-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <div className="flex items-center gap-1">
                  ID {sortColumn === 'id' && (sortDir === 'ASC' ? <ArrowUpOutlined /> : <ArrowDownOutlined />)}
                </div>
              </th>
              <th
                onClick={() => handleSort('sku')}
                className="py-3 px-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <div className="flex items-center gap-1">
                  SKU / Barcode {sortColumn === 'sku' && (sortDir === 'ASC' ? <ArrowUpOutlined /> : <ArrowDownOutlined />)}
                </div>
              </th>
              <th
                onClick={() => handleSort('name')}
                className="py-3 px-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <div className="flex items-center gap-1">
                  Item Description {sortColumn === 'name' && (sortDir === 'ASC' ? <ArrowUpOutlined /> : <ArrowDownOutlined />)}
                </div>
              </th>
              <th className="py-3 px-4 text-right">Cost</th>
              <th className="py-3 px-4 text-right">Selling Price</th>
              <th className="py-3 px-4 text-center">Stock Level</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--admin-border,#f3f4f6)]">
            {loading && items.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-gray-400">
                  <ReloadOutlined spin className="text-2xl mb-2" />
                  <p>Fetching records from MySQL InnoDB engine...</p>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-gray-400">
                  No inventory items match the specified filters.
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const isOutOfStock = Number(item.quantity_on_hand) <= 0 && item.track_inventory === 1;
                const isLowStock =
                  Number(item.quantity_on_hand) <= Number(item.alert_quantity) &&
                  item.track_inventory === 1 &&
                  !isOutOfStock;

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono text-xs text-gray-400">#{item.id}</td>
                    <td className="py-3 px-4">
                      <div className="font-mono font-medium text-blue-600 dark:text-blue-400 text-xs">
                        {item.sku}
                      </div>
                      {item.barcode && item.barcode !== item.sku && (
                        <div className="text-gray-400 font-mono text-[11px]">{item.barcode}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-[var(--admin-text,#111827)]">{item.name}</div>
                      {item.second_name && (
                        <div className="text-gray-400 text-xs">{item.second_name}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs text-gray-500">
                      ${Number(item.cost_price || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs font-semibold text-gray-900 dark:text-gray-100">
                      ${Number(item.selling_price || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          isOutOfStock
                            ? 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400'
                            : isLowStock
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                        }`}
                      >
                        {isOutOfStock ? (
                          <CloseCircleOutlined />
                        ) : isLowStock ? (
                          <WarningOutlined />
                        ) : (
                          <CheckCircleOutlined />
                        )}
                        {Number(item.quantity_on_hand || 0).toFixed(0)} units
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 text-[11px] font-medium rounded capitalize ${
                          item.status === 'active'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {/* RBAC Protected Edit Button: Conditionally disabled or hidden */}
                      <Can module="INVENTORY" action="update" disableOnly>
                        <button
                          onClick={() => openEditModal(item)}
                          className="px-2.5 py-1 text-xs font-medium rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 transition-colors inline-flex items-center gap-1"
                        >
                          <EditOutlined /> Edit
                        </button>
                      </Can>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 4. Keyset Pagination Controls */}
      <div className="p-3 border-t border-[var(--admin-border,#e5e7eb)] flex items-center justify-between text-xs text-gray-500 bg-[var(--admin-card-bg,#fafafa)]">
        <div>
          Page <span className="font-semibold text-gray-800 dark:text-gray-200">{pageIndex}</span>
          {' · '}
          Showing {items.length} items on page
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevPage}
            disabled={cursorStack.length === 0 || loading}
            className="px-3 py-1.5 rounded border border-[var(--admin-border,#d1d5db)] hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
          >
            <LeftOutlined /> Previous
          </button>
          <button
            onClick={handleNextPage}
            disabled={!hasMore || loading}
            className="px-3 py-1.5 rounded border border-[var(--admin-border,#d1d5db)] bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
          >
            Next <RightOutlined />
          </button>
        </div>
      </div>

      {/* 5. Edit Item Modal (Row-Locked PUT /api/items/:id) */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--admin-card-bg,#ffffff)] text-[var(--admin-text,#1f2937)] rounded-xl shadow-2xl border border-[var(--admin-border,#e5e7eb)] w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-[var(--admin-border,#e5e7eb)] flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base">Edit Item Record</h3>
                <p className="text-xs text-gray-500 font-mono">SKU: {editingItem.sku}</p>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateItem} className="p-4 space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold mb-1">Item Title</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-1.5 border rounded-lg border-gray-300 dark:border-gray-700 bg-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Selling Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={editForm.selling_price}
                    onChange={(e) => setEditForm({ ...editForm, selling_price: e.target.value })}
                    className="w-full px-3 py-1.5 border rounded-lg border-gray-300 dark:border-gray-700 bg-transparent font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Cost Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editForm.cost_price}
                    onChange={(e) => setEditForm({ ...editForm, cost_price: e.target.value })}
                    className="w-full px-3 py-1.5 border rounded-lg border-gray-300 dark:border-gray-700 bg-transparent font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Quantity on Hand</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.quantity_on_hand}
                    onChange={(e) => setEditForm({ ...editForm, quantity_on_hand: e.target.value })}
                    className="w-full px-3 py-1.5 border rounded-lg border-gray-300 dark:border-gray-700 bg-transparent font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Alert Threshold</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.alert_quantity}
                    onChange={(e) => setEditForm({ ...editForm, alert_quantity: e.target.value })}
                    className="w-full px-3 py-1.5 border rounded-lg border-gray-300 dark:border-gray-700 bg-transparent font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full px-3 py-1.5 border rounded-lg border-gray-300 dark:border-gray-700 bg-transparent"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="draft">Draft</option>
                  <option value="discontinued">Discontinued</option>
                </select>
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-1.5 text-xs font-medium rounded-lg border hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemsTable;
