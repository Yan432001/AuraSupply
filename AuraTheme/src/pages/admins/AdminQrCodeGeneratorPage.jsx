import React from 'react';
import { Space, Typography } from 'antd';
import AdminQrCodeGenerator from '../../components/admins/AdminQrCodeGenerator';
import { useAdminTheme } from '../../hooks/useAdminTheme';

const { Title, Text } = Typography;

export default function AdminQrCodeGeneratorPage() {
  const adminTheme = useAdminTheme();

  return (
    <div style={{ width: '100%', maxWidth: 1400, margin: '0 auto' }}>
      <AdminQrCodeGenerator />
    </div>
  );
}
