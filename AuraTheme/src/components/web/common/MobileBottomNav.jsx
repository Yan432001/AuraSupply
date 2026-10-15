import React from 'react';
import { Badge, Grid } from 'antd';
import {
  HomeOutlined,
  HeartOutlined,
  ShoppingCartOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../../../contexts/CartContext';
import { useWishlist } from '../../../contexts/WishlistContext';
import { useAuth } from '../../../contexts/AuthContext';
import { publicTheme } from '../../../utils/webTheme';

const { useBreakpoint } = Grid;

const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const { cartItemCount } = useCart();
  const { wishlistItemCount } = useWishlist();
  const { user } = useAuth();

  // Show only on mobile phone screens (< 576px)
  const isMobilePhone = screens.xs && !screens.sm;

  if (!isMobilePhone) return null;

  const currentPath = location.pathname;

  const navItems = [
    {
      key: 'home',
      label: 'Home',
      icon: <HomeOutlined style={{ fontSize: 20 }} />,
      path: '/',
      isActive: currentPath === '/',
    },
    {
      key: 'like',
      label: 'Like',
      icon: (
        <Badge count={wishlistItemCount} size="small" offset={[4, -2]}>
          <HeartOutlined style={{ fontSize: 20 }} />
        </Badge>
      ),
      path: '/wishlist',
      isActive: currentPath.startsWith('/wishlist'),
    },
    {
      key: 'cart',
      label: 'Cart',
      icon: (
        <Badge count={cartItemCount} size="small" offset={[4, -2]}>
          <ShoppingCartOutlined style={{ fontSize: 20 }} />
        </Badge>
      ),
      path: '/cart',
      isActive: currentPath.startsWith('/cart'),
      isCartTarget: true,
    },
    {
      key: 'account',
      label: 'Account',
      icon: <UserOutlined style={{ fontSize: 20 }} />,
      path: user ? '/profile' : '/login',
      isActive: currentPath.startsWith('/profile') || currentPath.startsWith('/login'),
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: '#ffffff',
        borderTop: `1px solid ${publicTheme.softBorder}`,
        boxShadow: '0 -4px 16px rgba(15, 23, 42, 0.06)',
        paddingTop: 6,
        paddingBottom: 'max(8px, env(safe-area-inset-bottom, 8px))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
      }}
    >
      {navItems.map((item) => {
        const active = item.isActive;
        return (
          <button
            key={item.key}
            type="button"
            data-cart-target={item.isCartTarget ? 'true' : undefined}
            onClick={() => navigate(item.path)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 0',
              outline: 'none',
              color: active ? publicTheme.primary : publicTheme.subtext,
              transition: 'transform 0.15s ease, color 0.15s ease',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 28,
                borderRadius: 999,
                background: active ? 'rgba(47, 111, 237, 0.12)' : 'transparent',
                transition: 'background 0.15s ease',
              }}
            >
              {item.icon}
            </div>
            <span
              style={{
                fontSize: 'var(--font-small)',
                fontWeight: active ? 750 : 500,
                letterSpacing: '-0.1px',
                lineHeight: 1,
              }}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default MobileBottomNav;
