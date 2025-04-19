import React, { useEffect } from 'react';
import { Layout, Button, Space, Dropdown, Avatar, Typography, ConfigProvider, message } from 'antd';
import {
  UserOutlined,
  WalletOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SwapOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import { useUser } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../../assets/css/pages/dashboard/DashboardHeader.css';

const { Header } = Layout;
const { Text } = Typography;

const DashboardHeader = ({ collapsed, setCollapsed, toggleDrawer }) => {
  const { user, balance, activeAccountType, switchAccount, accounts, loading, activeAccount, sendAuthorizedRequest } = useUser();
  const navigate = useNavigate();
  const accountId = activeAccount?.loginid;
  const isMobile = window.innerWidth <= 576; // Detect mobile screen

  const handleLogout = async () => {
    // setError(null); // Removed as it is not defined and seems unnecessary
    try {
      const response = await sendAuthorizedRequest({ logout: 1 });
      if (response.error) {
        throw new Error(response.error.message || 'Failed to logout.');
      }
      localStorage.removeItem('activeAccountType');
      localStorage.removeItem('activeAccount');
      localStorage.removeItem('accounts');
      message.success('Logged out successfully.');
      navigate('/login');
    } catch (error) {
      console.error('Logout Error:', error);
      message.error(error.message || 'Logout failed. Please try again.');
    }
  };

  useEffect(() => {
    if (!accountId) return;
  }, [accountId]);

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined style={{ color: '#1890ff' }} />,
      label: 'My Profile',
      onClick: () => navigate('/dashboard/account'),
    },
    {
      key: 'wallet',
      icon: <WalletOutlined style={{ color: '#1890ff' }} />,
      label: 'Wallet',
      onClick: () => navigate('/dashboard/wallet'),
    },
    {
      key: 'switch-real',
      icon: <SwapOutlined style={{ color: activeAccountType === 'real' ? '#ccc' : '#1890ff' }} />,
      label: 'Switch to Real',
      disabled: activeAccountType === 'real' || !accounts.real,
      onClick: () => switchAccount('real'),
    },
    {
      key: 'switch-demo',
      icon: <SwapOutlined style={{ color: activeAccountType === 'demo' ? '#ccc' : '#1890ff' }} />,
      label: 'Switch to Demo',
      disabled: activeAccountType === 'demo' || !accounts.demo,
      onClick: () => switchAccount('demo'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined style={{ color: '#1890ff' }} />,
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
      onClick: handleLogout,
    },
  ];

  if (loading) {
    return (
      <Header className={`header header-loading`}>
        <div>Loading...</div>
      </Header>
    );
  }

  return (
    <ConfigProvider>
      <Header
        className={`header ${isMobile ? 'header-mobile' : 'header-desktop'}`}
        style={{ position: 'fixed', width: '100%', zIndex: 1000, top: 0 }}
      >
        <Space size="middle">
          {isMobile ? (
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={toggleDrawer}
              className="menu-toggle"
              style={{ fontSize: '20px', color: '#1890ff' }}
            />
          ) : (
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="menu-toggle"
              style={{ fontSize: '20px', color: '#1890ff' }}
            />
          )}
          {!isMobile && (
            <Text strong className="user-name">
              Mulla
            </Text>
          )}
        </Space>
        <Space size="large" align="center">
          {!isMobile && (
            <Button
              type="primary"
              size="middle"
              icon={<WalletOutlined />}
              className="balance-button"
            >
              <Text className="balance-text">
                {user?.currency} {balance?.toFixed(2) || '0.00'}
              </Text>
            </Button>
          )}
          <Dropdown
            menu={{ items: userMenuItems }}
            placement="bottomRight"
            trigger={['click']}
            overlayStyle={{ minWidth: 180 }}
          >
            <Space className="user-menu">
              <Avatar
                src={user?.avatar}
                icon={<UserOutlined />}
                className="avatar"
              />
              {!isMobile && (
                <>
                  <Text strong>{user?.fullname || 'User'}</Text>
                  <Text type="secondary" className="user-account-type">
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