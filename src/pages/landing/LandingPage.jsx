import React, { useEffect } from 'react';
import { Layout } from 'antd';
import AppHeader from '../../components/Header';
import MainSection from './MainSection';
import AppFooter from '../../components/Footer';
import { parseDerivAuthTokens } from '../../services/parseDerivAuth'; 



const { Content } = Layout;

const LandingPage = () => {
  useEffect(() => {
    const accounts = parseDerivAuthTokens();
    if (accounts.length > 0) {
      // Store the accounts in localStorage for later use
      localStorage.setItem('accounts', JSON.stringify(accounts));
    }
  }, []);

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