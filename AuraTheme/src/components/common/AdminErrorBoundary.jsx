import React from 'react';
import { Result, Button, Typography, Space } from 'antd';
import { ReloadOutlined, DashboardOutlined, BugOutlined } from '@ant-design/icons';

const { Paragraph, Text } = Typography;

export class AdminErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('[AdminErrorBoundary] Caught unhandled render error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/admins/dashboard';
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px 24px', maxWidth: 800, margin: '0 auto' }}>
          <Result
            status="error"
            icon={<BugOutlined style={{ color: '#ef4444' }} />}
            title="An error occurred in this Admin workspace"
            subTitle={
              this.state.error?.message ||
              'A component reference or rendering issue occurred in this section.'
            }
            extra={[
              <Button
                type="primary"
                key="dashboard"
                icon={<DashboardOutlined />}
                onClick={this.handleReset}
                style={{ borderRadius: 10, background: '#2563eb' }}
              >
                Return to Dashboard
              </Button>,
              <Button
                key="reload"
                icon={<ReloadOutlined />}
                onClick={this.handleReload}
                style={{ borderRadius: 10 }}
              >
                Reload View
              </Button>,
            ]}
          >
            {this.state.error && (
              <div
                style={{
                  textAlign: 'left',
                  background: 'rgba(0,0,0,0.04)',
                  padding: 16,
                  borderRadius: 12,
                  marginTop: 20,
                  fontFamily: 'monospace',
                  fontSize: 12,
                  maxHeight: 200,
                  overflowY: 'auto',
                }}
              >
                <Text type="danger" strong>
                  {this.state.error.toString()}
                </Text>
                {this.state.errorInfo?.componentStack && (
                  <Paragraph style={{ margin: '8px 0 0', whiteSpace: 'pre-wrap', color: '#64748b' }}>
                    {this.state.errorInfo.componentStack}
                  </Paragraph>
                )}
              </div>
            )}
          </Result>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AdminErrorBoundary;
