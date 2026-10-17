/**
 * ERP USER GROUP & RBAC PERMISSION CONFIGURATION SCREEN
 * =====================================================
 * Enterprise admin dashboard interface for:
 *   1. Browsing and managing user groups (roles)
 *   2. Real-time matrix configuration of can_view, can_create, can_update, can_delete,
 *      can_export, and can_approve permissions per ERP module
 *   3. Assigning and unassigning users to roles with instant cache invalidation
 */

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  SafetyCertificateOutlined,
  UsergroupAddOutlined,
  SaveOutlined,
  ReloadOutlined,
  CheckSquareOutlined,
  BorderOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  UserOutlined,
  LockOutlined,
  UnlockOutlined,
  CheckCircleFilled,
  ThunderboltFilled
} from '@ant-design/icons';
import { Can, usePermission } from '../../contexts/PermissionContext';

export const UserGroupConfig = () => {
  const { refreshPermissions } = usePermission();

  // 1. Groups & Selection
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);

  // 2. Permission Matrix State
  const [permissionMatrix, setPermissionMatrix] = useState([]);
  const [matrixLoading, setMatrixLoading] = useState(false);
  const [isSavingMatrix, setIsSavingMatrix] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  // 3. User Assignment State
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // 4. Assign User Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [isAssigningUser, setIsAssigningUser] = useState(false);

  /**
   * Helper to build auth headers
   */
  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    let userId = null;
    if (savedUser) {
      try { userId = JSON.parse(savedUser).id; } catch (_) {}
    }
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (userId) headers['x-user-id'] = userId;
    return headers;
  }, []);

  /**
   * 1. Load All User Groups
   */
  const loadGroups = useCallback(async () => {
    try {
      const res = await axios.get('/api/user-groups', { headers: getAuthHeaders() });
      if (res.data && res.data.success) {
        setGroups(res.data.data || []);
        if (!selectedGroupId && res.data.data.length > 0) {
          setSelectedGroupId(res.data.data[0].id);
        }
      }
    } catch (err) {
      console.error('[UserGroupConfig] Error loading groups:', err);
    }
  }, [getAuthHeaders, selectedGroupId]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  // Keep selectedGroup in sync
  useEffect(() => {
    if (selectedGroupId && groups.length > 0) {
      const found = groups.find((g) => g.id === selectedGroupId);
      setSelectedGroup(found || groups[0]);
    }
  }, [selectedGroupId, groups]);

  /**
   * 2. Load Permission Matrix for Selected Group
   */
  const loadPermissionsMatrix = useCallback(async (groupId) => {
    if (!groupId) return;
    setMatrixLoading(true);
    setSaveSuccessNotice(false);
    try {
      const res = await axios.get(`/api/user-groups/${groupId}/permissions`, {
        headers: getAuthHeaders()
      });
      if (res.data && res.data.success) {
        setPermissionMatrix(res.data.data || []);
      }
    } catch (err) {
      console.error('[UserGroupConfig] Error loading matrix:', err);
    } finally {
      setMatrixLoading(false);
    }
  }, [getAuthHeaders]);

  /**
   * 3. Load Assigned Users for Selected Group
   */
  const loadAssignedUsers = useCallback(async (groupId) => {
    if (!groupId) return;
    setUsersLoading(true);
    try {
      const res = await axios.get(`/api/user-groups/${groupId}/users`, {
        headers: getAuthHeaders()
      });
      if (res.data && res.data.success) {
        setAssignedUsers(res.data.data || []);
      }
    } catch (err) {
      console.error('[UserGroupConfig] Error loading users:', err);
    } finally {
      setUsersLoading(false);
    }
  }, [getAuthHeaders]);

  // Refetch when selectedGroupId changes
  useEffect(() => {
    if (selectedGroupId) {
      loadPermissionsMatrix(selectedGroupId);
      loadAssignedUsers(selectedGroupId);
    }
  }, [selectedGroupId, loadPermissionsMatrix, loadAssignedUsers]);

  /**
   * Toggle a specific permission flag for a module
   */
  const togglePermission = (moduleId, flag) => {
    if (selectedGroup?.code === 'SUPER_ADMIN') return; // Superadmin is locked full access

    setPermissionMatrix((prev) =>
      prev.map((row) => {
        if (row.module_id === moduleId) {
          return {
            ...row,
            [flag]: row[flag] === 1 ? 0 : 1
          };
        }
        return row;
      })
    );
  };

  /**
   * Quick "Select All" / "Clear All" for a module
   */
  const toggleAllForModule = (moduleId) => {
    if (selectedGroup?.code === 'SUPER_ADMIN') return;

    setPermissionMatrix((prev) =>
      prev.map((row) => {
        if (row.module_id === moduleId) {
          const allSelected =
            row.can_view === 1 &&
            row.can_create === 1 &&
            row.can_update === 1 &&
            row.can_delete === 1;
          const target = allSelected ? 0 : 1;
          return {
            ...row,
            can_view: target,
            can_create: target,
            can_update: target,
            can_delete: target,
            can_export: target,
            can_approve: target
          };
        }
        return row;
      })
    );
  };

  /**
   * Quick "Select All" / "Clear All" for entire role
   */
  const toggleEntireRole = (enableAll) => {
    if (selectedGroup?.code === 'SUPER_ADMIN') return;
    const target = enableAll ? 1 : 0;
    setPermissionMatrix((prev) =>
      prev.map((row) => ({
        ...row,
        can_view: target,
        can_create: target,
        can_update: target,
        can_delete: target,
        can_export: target,
        can_approve: target
      }))
    );
  };

  /**
   * Save Permission Matrix via PUT /api/user-groups/:id/permissions
   */
  const handleSavePermissions = async () => {
    if (!selectedGroupId) return;
    setIsSavingMatrix(true);
    setSaveSuccessNotice(false);

    try {
      const payload = {
        permissions: permissionMatrix.map((r) => ({
          module_id: r.module_id,
          can_view: r.can_view,
          can_create: r.can_create,
          can_update: r.can_update,
          can_delete: r.can_delete,
          can_export: r.can_export,
          can_approve: r.can_approve
        }))
      };

      const res = await axios.put(
        `/api/user-groups/${selectedGroupId}/permissions`,
        payload,
        { headers: getAuthHeaders() }
      );

      if (res.data && res.data.success) {
        setSaveSuccessNotice(true);
        refreshPermissions(); // Invalidate frontend session permissions
        setTimeout(() => setSaveSuccessNotice(false), 4000);
      }
    } catch (err) {
      console.error('[Save Permissions Error]:', err);
      alert(err.response?.data?.message || 'Failed to save permissions matrix.');
    } finally {
      setIsSavingMatrix(false);
    }
  };

  /**
   * Search Users to Assign
   */
  const handleUserSearch = async (term) => {
    setUserSearchTerm(term);
    if (!term || term.trim().length === 0) {
      setSearchResults([]);
      return;
    }

    setIsSearchingUsers(true);
    try {
      const res = await axios.get('/api/users/search', {
        params: { q: term },
        headers: getAuthHeaders()
      });
      if (res.data && res.data.success) {
        setSearchResults(res.data.data || []);
      }
    } catch (err) {
      console.error('[User Search Error]:', err);
    } finally {
      setIsSearchingUsers(false);
    }
  };

  /**
   * Assign User to Group
   */
  const handleAssignUser = async (user) => {
    if (!selectedGroupId || isAssigningUser) return;
    setIsAssigningUser(true);
    try {
      await axios.post(
        `/api/user-groups/${selectedGroupId}/users`,
        { user_id: user.id, is_primary: 1 },
        { headers: getAuthHeaders() }
      );
      loadAssignedUsers(selectedGroupId);
      loadGroups(); // Update member count
      setIsAssignModalOpen(false);
      setUserSearchTerm('');
      setSearchResults([]);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign user to group.');
    } finally {
      setIsAssigningUser(false);
    }
  };

  /**
   * Remove User from Group
   */
  const handleRemoveUser = async (userId) => {
    if (!window.confirm('Remove this user from the selected role?')) return;
    try {
      await axios.delete(`/api/user-groups/${selectedGroupId}/users/${userId}`, {
        headers: getAuthHeaders()
      });
      loadAssignedUsers(selectedGroupId);
      loadGroups();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove user from role.');
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 bg-[var(--admin-card-bg,#ffffff)] border border-[var(--admin-border,#e5e7eb)] rounded-2xl shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <SafetyCertificateOutlined className="text-blue-600" />
            Roles & Access Control (RBAC)
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure granular module permissions and assign operational roles across users.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {saveSuccessNotice && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200 animate-in fade-in">
              <CheckCircleFilled /> Permissions updated & cache purged!
            </div>
          )}

          <Can module="SETTINGS" action="update">
            <button
              onClick={handleSavePermissions}
              disabled={isSavingMatrix || selectedGroup?.code === 'SUPER_ADMIN'}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
            >
              <SaveOutlined spin={isSavingMatrix} />
              {isSavingMatrix ? 'Updating...' : 'Save Permissions'}
            </button>
          </Can>
        </div>
      </div>

      {/* 2. Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Roles / User Groups List */}
        <div className="lg:col-span-1 space-y-2 bg-[var(--admin-card-bg,#ffffff)] border border-[var(--admin-border,#e5e7eb)] rounded-2xl p-4 shadow-sm h-fit">
          <div className="flex justify-between items-center px-2 mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              System Roles ({groups.length})
            </h2>
            <button
              onClick={loadGroups}
              className="text-gray-400 hover:text-blue-600 transition-colors"
              title="Refresh Roles"
            >
              <ReloadOutlined />
            </button>
          </div>

          <div className="space-y-1.5">
            {groups.map((g) => {
              const isSelected = g.id === selectedGroupId;
              const isSuper = g.code === 'SUPER_ADMIN';

              return (
                <button
                  key={g.id}
                  onClick={() => setSelectedGroupId(g.id)}
                  className={`w-full text-left px-3.5 py-3 rounded-xl transition-all border flex items-center justify-between ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-500 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold shadow-sm'
                      : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-800/60 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      {isSuper ? <ThunderboltFilled className="text-amber-500 text-xs" /> : null}
                      <span className="text-sm">{g.name}</span>
                    </div>
                    <div className="text-[11px] text-gray-400 font-mono">
                      Level {g.level} · {g.code}
                    </div>
                  </div>

                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 font-medium">
                    {g.member_count || 0}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Columns: Permissions Matrix & Assigned Users Tabs */}
        <div className="lg:col-span-3 space-y-6">
          {/* Active Role Meta Card */}
          {selectedGroup && (
            <div className="p-4 bg-[var(--admin-card-bg,#ffffff)] border border-[var(--admin-border,#e5e7eb)] rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-[var(--admin-text,#111827)]">
                    {selectedGroup.name}
                  </h3>
                  <span className="text-xs font-mono px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded font-semibold text-gray-600 dark:text-gray-300">
                    {selectedGroup.code}
                  </span>
                  {selectedGroup.is_system === 1 && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 rounded-full flex items-center gap-1">
                      <LockOutlined /> System Protected
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {selectedGroup.description || 'Configuring module-level privileges for this role.'}
                </p>
              </div>

              {/* Quick Actions (Select All / Deselect All) */}
              {selectedGroup.code !== 'SUPER_ADMIN' && (
                <div className="flex items-center gap-2 text-xs">
                  <button
                    onClick={() => toggleEntireRole(true)}
                    className="px-2.5 py-1 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors"
                  >
                    Grant All
                  </button>
                  <button
                    onClick={() => toggleEntireRole(false)}
                    className="px-2.5 py-1 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 3. Granular Module Permissions Matrix */}
          <div className="bg-[var(--admin-card-bg,#ffffff)] border border-[var(--admin-border,#e5e7eb)] rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[var(--admin-border,#e5e7eb)] flex items-center justify-between bg-[var(--admin-card-bg,#fafafa)]">
              <h4 className="text-sm font-bold tracking-tight">ERP Module Privileges</h4>
              <span className="text-xs text-gray-400">
                {permissionMatrix.length} Modules configured
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[var(--admin-border,#e5e7eb)] bg-[var(--admin-card-bg,#f9fafb)] text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="py-3 px-4">ERP Module</th>
                    <th className="py-3 px-3 text-center">View</th>
                    <th className="py-3 px-3 text-center">Create</th>
                    <th className="py-3 px-3 text-center">Update</th>
                    <th className="py-3 px-3 text-center">Delete</th>
                    <th className="py-3 px-3 text-center">Export</th>
                    <th className="py-3 px-3 text-center">Approve</th>
                    <th className="py-3 px-3 text-center">Toggle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--admin-border,#f3f4f6)]">
                  {matrixLoading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-gray-400">
                        <ReloadOutlined spin className="text-xl mb-2" />
                        <p>Loading module rights...</p>
                      </td>
                    </tr>
                  ) : (
                    permissionMatrix.map((mod) => {
                      const isSuper = selectedGroup?.code === 'SUPER_ADMIN';

                      return (
                        <tr
                          key={mod.module_id}
                          className="hover:bg-blue-50/30 dark:hover:bg-blue-950/10 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div className="font-semibold text-gray-900 dark:text-gray-100">
                              {mod.module_name}
                            </div>
                            <div className="text-xs text-gray-400 font-mono">{mod.module_code}</div>
                          </td>

                          {/* Checkbox columns */}
                          {['can_view', 'can_create', 'can_update', 'can_delete', 'can_export', 'can_approve'].map((flag) => (
                            <td key={flag} className="py-3 px-3 text-center">
                              <input
                                type="checkbox"
                                checked={isSuper ? true : mod[flag] === 1}
                                disabled={isSuper}
                                onChange={() => togglePermission(mod.module_id, flag)}
                                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer disabled:cursor-not-allowed"
                              />
                            </td>
                          ))}

                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              disabled={isSuper}
                              onClick={() => toggleAllForModule(mod.module_id)}
                              className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-30 disabled:cursor-not-allowed font-medium"
                            >
                              Toggle
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. Assigned Users Section */}
          <div className="bg-[var(--admin-card-bg,#ffffff)] border border-[var(--admin-border,#e5e7eb)] rounded-2xl shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold">Assigned Users</h4>
                <p className="text-xs text-gray-400">
                  Accounts that currently inherit this role and its module permissions.
                </p>
              </div>

              <Can module="SETTINGS" action="update">
                <button
                  onClick={() => setIsAssignModalOpen(true)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 transition-colors flex items-center gap-1.5"
                >
                  <PlusOutlined /> Assign User
                </button>
              </Can>
            </div>

            {usersLoading ? (
              <p className="text-xs text-gray-400 py-4 text-center">Loading assigned users...</p>
            ) : assignedUsers.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">
                No users are currently assigned to this role.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {assignedUsers.map((u) => (
                  <div
                    key={u.id}
                    className="p-3 border rounded-xl flex items-center justify-between gap-2 bg-gray-50/50 dark:bg-gray-800/40"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {u.first_name ? u.first_name[0] : u.username[0].toUpperCase()}
                      </div>
                      <div className="overflow-hidden">
                        <div className="font-semibold text-xs truncate">
                          {u.first_name ? `${u.first_name} ${u.last_name || ''}` : u.username}
                        </div>
                        <div className="text-[11px] text-gray-400 truncate">{u.email}</div>
                      </div>
                    </div>

                    <Can module="SETTINGS" action="delete">
                      <button
                        onClick={() => handleRemoveUser(u.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors text-xs p-1"
                        title="Remove user from role"
                      >
                        <DeleteOutlined />
                      </button>
                    </Can>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. Assign User Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--admin-card-bg,#ffffff)] text-[var(--admin-text,#1f2937)] rounded-2xl shadow-2xl border border-[var(--admin-border,#e5e7eb)] w-full max-w-md p-5 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base">Assign User to {selectedGroup?.name}</h3>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg"
              >
                ✕
              </button>
            </div>

            <div className="relative">
              <SearchOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by username, name, or email..."
                value={userSearchTerm}
                onChange={(e) => handleUserSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="max-h-60 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
              {isSearchingUsers ? (
                <p className="text-xs text-gray-400 py-4 text-center">Searching accounts...</p>
              ) : searchResults.length === 0 ? (
                <p className="text-xs text-gray-400 py-4 text-center">
                  {userSearchTerm ? 'No users found matching query.' : 'Type to search users.'}
                </p>
              ) : (
                searchResults.map((usr) => (
                  <div
                    key={usr.id}
                    className="py-2.5 px-2 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/60 rounded-lg transition-colors"
                  >
                    <div>
                      <div className="text-xs font-semibold">{usr.username}</div>
                      <div className="text-[11px] text-gray-400">{usr.email}</div>
                    </div>
                    <button
                      onClick={() => handleAssignUser(usr)}
                      disabled={isAssigningUser}
                      className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Assign
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserGroupConfig;
