import React from 'react';
import { Dropdown, Button } from 'antd';
import { MoreOutlined } from '@ant-design/icons';

/**
 * Standard Action Column Dropdown for data tables
 * Styled consistently with `admins?module=inventory&menu=products`
 */
export default function TableActionDropdown({
  items = [],
  label = 'Action',
  size = 'small',
  icon = <MoreOutlined />,
  placement = 'bottomRight',
  trigger = ['click'],
  buttonProps = {},
  style = {},
  disabled = false,
  ...props
}) {
  if (!items || items.length === 0) {
    return (
      <Button size={size} disabled style={{ borderRadius: 6, ...style }} {...buttonProps}>
        {label}
      </Button>
    );
  }

  return (
    <Dropdown menu={{ items }} trigger={trigger} placement={placement} disabled={disabled} {...props}>
      <Button
        size={size}
        type="default"
        icon={icon}
        style={{
          borderRadius: 6,
          fontWeight: 500,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          ...style,
        }}
        {...buttonProps}
      >
        {label}
      </Button>
    </Dropdown>
  );
}
