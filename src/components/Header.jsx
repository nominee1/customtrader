import React from 'react';
import { Layout, Menu, Button, Space, Avatar, Typography } from 'antd';
import { Link } from 'react-router-dom';

const { Header } = Layout;
const { Text } = Typography;

const AppHeader = () => {
  const menuItems = [
    {
      key: 'trade',
      label: <Link to="/trade">Trade</Link>,
    },
    {
      key: 'analysis',
      label: <Link to="/analysis">Analysis</Link>,
    },
    {
      key: 'login',
      label: (
        <Link to="/login">
          <Button type="text">Login</Button>
        </Link>
      ),
    },
    {
      key: 'signup',
      label: (
        <Link to="/register">
          <Button type="primary">Start Trading</Button>
        </Link>
      ),
    },
  ];

  return (
    <Header style={{ position: 'fixed', zIndex: 1, width: '100%', background: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 1200, margin: '0 auto' }}>
        <Space>
          <Avatar src="/mulla-logo.png" size="large" />
          <Text strong style={{ color: '#1890ff', fontSize: 18 }}>Mulla</Text>
        </Space>
        <Menu 
          mode="horizontal" 
          style={{ borderBottom: 'none' }}
          items={menuItems}
        />
      </div>
    </Header>
  );
};

export default AppHeader;