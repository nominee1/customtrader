import React from 'react';
import { Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  HomeOutlined,
  LineChartOutlined,
  WalletOutlined,
  UserOutlined,
  SettingOutlined
} from '@ant-design/icons';

const DashboardSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Extract the current route path
  const currentPath = location.pathname.split('/').pop() || 'home';

  const menuItems = [
    {
      key: 'home',
      icon: <HomeOutlined />,
      label: 'Home',
      onClick: () => navigate('/dashboard/home')
    },
    {
      key: 'trading',
      icon: <LineChartOutlined />,
      label: 'Trading',
      onClick: () => navigate('/dashboard/trading')
    },
    {
      key: 'wallet',
      icon: <WalletOutlined />,
      label: 'Wallet',
      onClick: () => navigate('/dashboard/wallet')
    },
    {
      key: 'account',
      icon: <UserOutlined />,
      label: 'Account',
      onClick: () => navigate('/dashboard/account')
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      onClick: () => navigate('/dashboard/settings')
    }
  ];

  return (
    <Menu
      theme="light"
      mode="inline"
      selectedKeys={[currentPath]}
      items={menuItems}
      style={{ borderRight: 0 }}
    />
  );
};

export default DashboardSidebar;