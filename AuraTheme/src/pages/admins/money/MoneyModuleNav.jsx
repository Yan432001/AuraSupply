import React from 'react';
import { Button, Space } from 'antd';
import {
  UnorderedListOutlined,
  PlusCircleOutlined,
  SwapOutlined,
  BankOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdminTheme } from '../../../hooks/useAdminTheme';
import { useTranslation } from '../../../contexts/LanguageContext';

const MoneyModuleNav = ({ activeKey }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useAdminTheme();
  const { t } = useTranslation();

  const pathname = location.pathname.toLowerCase();
  const search = location.search.toLowerCase();

  const current =
    activeKey ||
    (pathname.includes('transfer_range') || pathname.includes('transfer_companies') || pathname.includes('transfer-companies') || search.includes('transfer')
      ? 'transfer_companies'
      : pathname.includes('exchange_rate') || pathname.includes('exchange-rate') || search.includes('exchange-rate') || search.includes('exchange_rate')
      ? 'exchange_rate'
      : pathname.endsWith('/add') || pathname.includes('/edit/') || search.includes('add-exchange')
      ? 'add'
      : 'list');

  const navItems = [
    {
      key: 'list',
      label: t('list_exchange_money', 'List Exchange Money'),
      icon: <UnorderedListOutlined />,
      path: '/admins/money'
    },
    {
      key: 'add',
      label: t('add_exchange', 'Add Exchange'),
      icon: <PlusCircleOutlined />,
      path: '/admins/money/add'
    },
    {
      key: 'exchange_rate',
      label: t('exchange_rate', 'Exchange Rate'),
      icon: <SwapOutlined />,
      path: '/admins/money/exchange_rate'
    },
    {
      key: 'transfer_companies',
      label: t('transfer_companies', 'Transfer Companies'),
      icon: <BankOutlined />,
      path: '/admins/money/transfer_companies'
    }
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        padding: '10px 14px',
        marginBottom: 16,
        borderRadius: 10,
        background: isDark ? 'rgba(30, 41, 59, 0.78)' : '#ffffff',
        border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0',
        boxShadow: isDark ? '0 2px 10px rgba(0,0,0,0.3)' : '0 1px 3px rgba(15, 23, 42, 0.04)'
      }}
    >
      <Space wrap size={8}>
        {navItems.map((item) => {
          const isActive = current === item.key;
          return (
            <Button
              key={item.key}
              type={isActive ? 'primary' : 'text'}
              icon={item.icon}
              onClick={() => navigate(item.path)}
              style={{
                borderRadius: 8,
                fontWeight: isActive ? 600 : 500,
                ...(isActive
                  ? { background: '#10b981', borderColor: '#10b981', color: '#ffffff' }
                  : { color: isDark ? '#cbd5e1' : '#334155' })
              }}
            >
              {item.label}
            </Button>
          );
        })}
      </Space>
    </div>
  );
};

export default MoneyModuleNav;
