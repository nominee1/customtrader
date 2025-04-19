import React, { useEffect } from 'react';
import { Layout, Button, Space, Badge, Dropdown, Avatar, Typography, theme, message } from 'antd';
import {
  BellOutlined,
  UserOutlined,
  WalletOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import { useUser } from '../../context/AuthContext';
import { ConfigProvider } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Header } = Layout;
const { Text } = Typography;

const DashboardHeader = ({ collapsed, setCollapsed, isMobile }) => {
  const { user, balance, activeAccountType, switchAccount, accounts, loading, activeAccount, sendAuthorizedRequest } = useUser();
  const navigate = useNavigate();
  
  const accountId = activeAccount?.loginid;
  const [error, setError] = React.useState(null);

  const handleLogout = async () => {
    setError(null);

    try {
      // Send logout request
      const response = await sendAuthorizedRequest({ logout: 1 });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to logout. Please try again.');
      }

      // Clear tokens from localStorage
      localStorage.removeItem('activeAccountType');
      localStorage.removeItem('activeAccount');
      localStorage.removeItem('accounts');

      // Show toast
      message.success('Logged out successfully.');

      // Redirect to login page
      navigate('/login');
    } catch (error) {
      console.error('Logout Error:', error);
      setError(error.message || 'Logout failed. Please try again.');
    }
      message.error(error.message || 'Logout failed. Please try again.');
  };

  useEffect(() => {
    if (!accountId) return;
  }, [accountId]);

  const {
    token: { colorPrimary, colorBgContainer },
  } = theme.useToken();

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined style={{ color: colorPrimary }} />,
      label: 'My Profile',
      onClick: () => navigate('/dashboard/account'),
    },
    {
      key: 'wallet',
      icon: <WalletOutlined style={{ color: colorPrimary }} />,
      label: 'Wallet',
      onClick: () => navigate('/dashboard/wallet'),
    },
    {
      key: 'switch-real',
      icon: <SwapOutlined style={{ color: activeAccountType === 'real' ? '#ccc' : colorPrimary }} />,
      label: 'Switch to Real',
      disabled: activeAccountType === 'real' || !accounts.real,
      onClick: () => switchAccount('real'),
    },
    {
      key: 'switch-demo',
      icon: <SwapOutlined style={{ color: activeAccountType === 'demo' ? '#ccc' : colorPrimary }} />,
      label: 'Switch to Demo',
      disabled: activeAccountType === 'demo' || !accounts.demo,
      onClick: () => switchAccount('demo'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined style={{ color: colorPrimary }} />,
      label: 'Settings',
      onClick: () => navigate('/dashboard/settings'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined style={{ color: '#FF7675' }} />,
      label: 'Logout',
      danger: true,
      onClick: handleLogout
    },
  ];

  if (loading) {
    return (
      <Header
        style={{
          padding: '0 24px',
          background: colorBgContainer,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>Loading...</div>
      </Header>
    );
  }

  return (
    <ConfigProvider
      theme={{
        components: {
          Button: {
            colorPrimary: colorPrimary,
            colorPrimaryHover: `${colorPrimary}dd`,
          },
          Badge: {
            colorBgContainer: '#FF7675',
          },
        },
      }}
    >
      <Header
        style={{
          padding: isMobile ? '0 16px' : '0 24px',
          background: colorBgContainer,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 1px 4px 0 rgba(0, 0, 0, 0.05)',
          zIndex: 1,
          position: 'sticky',
          top: 0,
          height: 64,
        }}
      >
        <Space size="middle">
          {isMobile && (
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px' }}
            />
          )}
          <Space>
            <Avatar
              src="/logo.png"
              size="large"
              style={{
                background: colorPrimary,
                color: 'white',
                fontWeight: 'bold',
              }}
            >
              {!user?.logo && 'M'}
            </Avatar>
            {!isMobile && (
              <Text strong style={{ fontSize: 18, color: colorPrimary }}>
                Mulla Kenya
              </Text>
            )}
          </Space>
        </Space>

        <Space size="large" align="center">
          {!isMobile && (
            <Button
              type="primary"
              size="middle"
              icon={<WalletOutlined />}
              style={{
                background: colorPrimary,
                display: 'flex',
                alignItems: 'center',
                fontWeight: 500,
              }}
            >
              <Text style={{ color: 'white' }}>
                {user?.currency} {balance?.toFixed(2) || '0.00'}
              </Text>
            </Button>
          )}

          <Badge count={5} size="small" offset={[-5, 5]}>
            <Button
              type="text"
              shape="circle"
              icon={<BellOutlined style={{ fontSize: 18 }} />}
              style={{ color: colorPrimary }}
            />
          </Badge>

          <Dropdown
            menu={{ items: userMenuItems }}
            placement="bottomRight"
            trigger={['click']}
            overlayStyle={{ minWidth: 180 }}
          >
            <Space
              style={{
                cursor: 'pointer',
                padding: '8px 12px',
                borderRadius: 8,
                transition: 'all 0.2s',
              }}
            >
              <Avatar
                src={user?.avatar}
                icon={<UserOutlined />}
                style={{
                  background: colorPrimary,
                  color: 'white',
                }}
              />
              {!isMobile && (
                <>
                  <Text strong>{user?.fullname || 'User'}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {activeAccountType ? activeAccountType.charAt(0).toUpperCase() + activeAccountType.slice(1) : 'N/A'}
                  </Text>
                </>
              )}
            </Space>
          </Dropdown>
        </Space>
      </Header>
    </ConfigProvider>
  );
};

export default DashboardHeader;