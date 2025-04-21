import React, { useState } from 'react';
import { Layout, Button, Typography, Drawer } from 'antd';
import { Link } from 'react-router-dom';
import { MenuOutlined } from '@ant-design/icons';
import '../assets/css/components/Header.css';

const { Header } = Layout;
const { Text } = Typography;

const AppHeader = () => {
  const [drawerVisible, setDrawerVisible] = useState(false);

  const toggleDrawer = () => {
    setDrawerVisible(!drawerVisible);
  };

  // Optional: Enable this for menu toggle on mobile
  const useMenuToggle = false; // Set to true to use drawer instead of buttons

  return (
    <Header className="header">
      <div className="header-container">
        <div className="logo">
          <Text className="logo-text">Mulla</Text>
        </div>
        {useMenuToggle && window.innerWidth <= 576 ? (
          <>
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={toggleDrawer}
              className="menu-toggle"
              style={{ fontSize: '20px', color: '#1890ff' }}
              aria-label="Toggle menu"
            />
            <Drawer
              placement="right"
              closable={true}
              onClose={toggleDrawer}
              visible={drawerVisible}
              width={200}
              title="Menu"
              styles={{
                header: { padding: '16px', borderBottom: '1px solid #f0f0f0' },
                body: { padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' },
              }}
            >
              <Link to="/login" onClick={toggleDrawer}>
                <Button className="header-button" block>
                  Login
                </Button>
              </Link>
              <Link to="/signup" onClick={toggleDrawer}>
                <Button className="header-button" type="primary" block>
                  Sign Up
                </Button>
              </Link>
            </Drawer>
          </>
        ) : (
          <div className="header-buttons">
            <Link to="/login">
              <Button className="header-button" variant="outlined">
                Login
              </Button>
            </Link>
            <Link to="/signup">
              <Button className="header-button" type="primary">
                Sign Up
              </Button>
            </Link>
          </div>
        )}
      </div>
    </Header>
  );
};

export default AppHeader;