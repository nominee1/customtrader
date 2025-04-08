import React, { useState } from 'react';
import { Layout } from 'antd';
import DashboardHeader from './DashboardHeader';
import DashboardSidebar from './DashboardSidebar';
import { Outlet } from 'react-router-dom';

const { Sider, Content } = Layout;

const DashboardPage = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <DashboardHeader collapsed={collapsed} setCollapsed={setCollapsed} />
      <Layout>
        <Sider 
          collapsible
          collapsed={collapsed}
          onCollapse={() => setCollapsed(!collapsed)}
          width={250}
          style={{ 
            background: '#fff',
            overflow: 'auto',
            height: '100vh',
          }}
        >
          <DashboardSidebar collapsed={collapsed} />
        </Sider>
        <Content 
          style={{ 
            marginLeft: collapsed ? 0 : 0,
            padding: '24px',
            transition: 'transition: all 0.2s',
            maxHeight: '100vh',
            overflowY: 'scroll',
            
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default DashboardPage;