import { Layout, theme } from 'antd';
import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';

const { Content } = Layout;

function Dashboard({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  // For authentication (adjust as needed)
  const isAuthenticated = true;

  const handleLogout = () => {
    // Your logout logic here
    console.log('User logged out');
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar collapsed={collapsed} />
      <Layout>
        <Header 
          isAuthenticated={isAuthenticated} 
          onLogout={handleLogout}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
        />
        <Content style={{ 
          margin: '16px', 
          padding: 24, 
          background: colorBgContainer,
          borderRadius: 8
        }}>
          {children}  {/* Content injected here */}
        </Content>
        <Footer />
      </Layout>
    </Layout>
  );
}

export default Dashboard;