import React from 'react';
import { Layout, Button, Space, Badge, Dropdown, Avatar, Typography } from 'antd';
import {
  BellOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useUser } from '../../context/AuthContext';

const { Header } = Layout;
const { Text } = Typography;

const DashboardHeader = () => {
  const { user, loading } = useUser();

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile'
    },
    {
      key: 'settings',
      icon: <UserOutlined />,
      label: 'Settings'
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      icon: <UserOutlined />,
      label: 'Logout',
      danger: true
    }
  ];
  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Header style={{ 
      padding: 0, 
      background: '#fff', 
      display: 'flex', 
      justifyContent: 'flex-end',
      alignItems: 'center',
    }}>
      <div style={{ flex: 1, paddingLeft: 24 }}>
      <Space>
          <Avatar src="/logo.png" size="large" />
          {<Text strong style={{ fontSize: 16 }}>Mulla Dashboard</Text>}
        </Space>
      </div>
      <Space size="large" style={{ marginRight: 24 }}>
        <Text strong>Bal. {user?.currency} {user?.balance || "Bal"}</Text>
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <Space style={{ cursor: 'pointer', padding: '0 16px' }}>
            <Avatar icon={<UserOutlined />} />
            <Text strong>{user?.fullname || "User"}</Text>
          </Space>
        </Dropdown>
      </Space>
    </Header>
  );
};

export default DashboardHeader;