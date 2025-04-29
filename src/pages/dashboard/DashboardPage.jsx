import React, { useState } from 'react';
import { Layout, Drawer } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import DashboardHeader from './DashboardHeader';
import DashboardSidebar from './DashboardSidebar';
import { Outlet } from 'react-router-dom';

const { Sider, Content } = Layout;

const DashboardPage = () => {
  const [collapsed, setCollapsed] = useState(false); // Desktop sidebar collapse state
  const [drawerVisible, setDrawerVisible] = useState(false); // Mobile drawer state

  const toggleDrawer = () => {
    setDrawerVisible(!drawerVisible);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <DashboardHeader
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        toggleDrawer={toggleDrawer}
        drawerVisible={drawerVisible}
      />
      <Layout>
        {/* Desktop Sidebar */}
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={() => setCollapsed(!collapsed)}
          width={250}
          breakpoint="sm" // Triggers at ≤576px
          collapsedWidth={0}
          onBreakpoint={(broken) => {
            setCollapsed(broken); // Auto-collapse on mobile
          }}
          style={{
            background: '#fff',
            overflow: 'auto',
            height: '100vh',
            position: 'fixed', // Keep sidebar fixed
            left: 0,
            top: 64, // Adjust for header height
            bottom: 0,
            zIndex: 100,
          }}
        >
          <DashboardSidebar />
        </Sider>

        {/* Mobile Drawer */}
        <Drawer
          placement="left"
          closable={true}
          onClose={toggleDrawer}
          visible={drawerVisible}
          width={250}
          bodyStyle={{ padding: 0 }}
          zIndex={1000} // Ensure drawer is above content
          styles={{
            header: { padding: '16px', borderBottom: '1px solid #f0f0f0' },
          }}
          title="Menu"
        >
          <DashboardSidebar />
        </Drawer>

        <Content
          style={{
            marginLeft: collapsed ? 0 : window.innerWidth > 576 ? 250 : 0,
            padding: '24px',
            transition: 'margin-left 0.2s',
            minHeight: 'calc(100vh - 64px)', // Adjust for header
            overflowY: 'auto',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default DashboardPage;