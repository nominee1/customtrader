import React from 'react';
import { Layout, Button, Space, Badge, Dropdown, Avatar, Typography, Menu, theme } from 'antd';
import {
  BellOutlined,
  UserOutlined,
  WalletOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { useUser } from '../../context/AuthContext';
import { ConfigProvider } from 'antd';

const { Header } = Layout;
const { Text } = Typography;

const DashboardHeader = ({ collapsed, setCollapsed, isMobile }) => {
  const { user, loading } = useUser();
  const {
    token: { colorPrimary, colorBgContainer },
  } = theme.useToken();

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined style={{ color: colorPrimary }} />,
      label: 'My Profile'
    },
    {
      key: 'wallet',
      icon: <WalletOutlined style={{ color: colorPrimary }} />,
      label: 'Wallet'
    },
    {
      key: 'settings',
      icon: <SettingOutlined style={{ color: colorPrimary }} />,
      label: 'Settings'
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined style={{ color: '#FF7675' }} />,
      label: 'Logout',
      danger: true
    }
  ];

  if (loading) {
    return (
      <Header style={{ 
        padding: '0 24px', 
        background: colorBgContainer,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
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
          }
        }
      }}
    >
      <Header style={{ 
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
      }}>
        {/* Left Side - Logo and Collapse Button */}
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
                fontWeight: 'bold'
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

        {/* Right Side - User Controls */}
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
                fontWeight: 500
              }}
            >
              <Text style={{ color: 'white' }}>
                {user?.currency} {user?.balance?.toFixed(2) || '0.00'}
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
                ':hover': {
                  background: `${colorPrimary}10`
                }
              }}
            >
              <Avatar 
                src={user?.avatar} 
                icon={<UserOutlined />} 
                style={{ 
                  background: colorPrimary,
                  color: 'white'
                }}
              />
              {!isMobile && (
                <>
                  <Text strong>{user?.fullname || "User"}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {user?.accountType || "Standard"}
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