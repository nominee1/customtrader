import React from 'react';
import { Layout } from 'antd';
import AppHeader from '../../components/Header';
import MainSection from './MainSection';
import AppFooter from '../../components/Footer';

const { Content } = Layout;

const LandingPage = () => {
  return (
    <Layout className="layout" style={{ minHeight: '100vh' }}>
      <AppHeader />
      <Content style={{ marginTop: 64 }}>
        <MainSection />
      </Content>
      <AppFooter />
    </Layout>
  );
};

export default LandingPage;