import React, { useEffect, useState } from 'react';
import { Layout, message } from 'antd';
import AppHeader from '../../components/Header';
import MainSection from './MainSection';
import AppFooter from '../../components/Footer';
import InitialSetup from './InitialSetup';
import { parseDerivAuthTokens } from '../../services/parseDerivAuth';

const { Content } = Layout;

const LandingPage = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [hasAccounts, setHasAccounts] = useState(false);

  useEffect(() => {
    const accounts = parseDerivAuthTokens();
    if (accounts.length > 0) {
      setHasAccounts(true);
      messageApi.open({
        type: 'success',
        content: 'Deriv login successful! Please set a password.',
      });
    }
  }, [messageApi]);

  // Render InitialSetup if accounts are present, otherwise show landing page
  return (
    <Layout className="layout" style={{ minHeight: '100vh' }}>
      {contextHolder}
      <AppHeader />
      <Content style={{ marginTop: 64 }}>
        {hasAccounts ? <InitialSetup /> : <MainSection />}
      </Content>
      <AppFooter />
    </Layout>
  );
};

export default LandingPage;