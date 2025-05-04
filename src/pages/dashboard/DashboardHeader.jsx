import React, { useState, useEffect } from 'react';
import { Layout, Button, Space, Dropdown, Avatar, Typography, message } from 'antd';
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
import logo from '../../assets/images/logo.png';

const { Header } = Layout;
const { Text } = Typography;

const DashboardHeader = ({ collapsed, setCollapsed, toggleDrawer }) => {
  const { user, balance, activeAccountType, switchAccount, accounts, loading, activeAccount, sendAuthorizedRequest } = useUser();
  const navigate = useNavigate();
  const accountId = activeAccount?.loginid;
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 576);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 576);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    try {
      const response = await sendAuthorizedRequest({ logout: 1 });
      if (response.error) {
        throw new Error(response.error.message || 'Failed to logout.');
      }
      localStorage.removeItem('activeAccountType');
      localStorage.removeItem('activeAccount');
      localStorage.removeItem('accounts');
      message.success('Logged out successfully.');
      navigate('/');
    } catch (error) {
      console.error('Logout Error:', error);
      message.error(error.message || 'Logout failed. Please try again.');
    }
  };

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
      <Header className="header header-loading">
        <div>Loading...</div>
      </Header>
    );
  }

  return (
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
            aria-label="Toggle navigation drawer"
          />
        ) : (
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            className="menu-toggle"
            style={{ fontSize: '20px', color: '#1890ff' }}
            aria-label="Toggle sidebar"
          />
        )}
        {!isMobile && (
          <>
            <img
              src={logo}
              alt="Company Logo"
              style={{ height: '80px', width: 'auto' }}
            />
          </>
        )}
      </Space>
      <Space size="large" align="center">
        {!isMobile && (
          <Space className="balance-display">
            <WalletOutlined style={{ color: '#1890ff', fontSize: '16px' }} />
            <Text className="balance-text">
              {user?.currency} {balance?.toFixed(2) || '0.00'}
            </Text>
          </Space>
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
  );
};

export default DashboardHeader;