import React from 'react';
import { Layout, Button, Space, Badge, Dropdown, Avatar, Typography } from 'antd';
import {
  BellOutlined,
  UserOutlined,
} from '@ant-design/icons';

const { Header } = Layout;
const { Text } = Typography;

const DashboardHeader = () => {
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
        <Badge count={5} size="small">
          <Button type="text" icon={<BellOutlined />} size="large" />
        </Badge>
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <Space style={{ cursor: 'pointer', padding: '0 16px' }}>
            <Avatar icon={<UserOutlined />} />
            <Text strong>John Doe</Text>
          </Space>
        </Dropdown>
      </Space>
    </Header>
  );
};

export default DashboardHeader;