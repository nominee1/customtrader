import { Button, Layout, Typography, Row, Col, Space, Alert } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph } = Typography;
const { Header, Content, Footer } = Layout;

function LandingPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Environment variable - we only need the app ID
  const appId = import.meta.env.VITE_DERIV_APP_ID;

  // Check for existing token in localStorage
  useEffect(() => {
    const token = localStorage.getItem('deriv_token');
    if (token) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleLogin = () => {
    setIsLoading(true);
    setError(null);
    
    // Construct the exact URL you want
    const oauthUrl = `https://oauth.deriv.com/oauth2/authorize?app_id=${appId}&l=EN&brand=deriv`;
    
    console.log('Redirecting to:', oauthUrl);
    window.location.href = oauthUrl;
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#fff', padding: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <Title level={3} style={{ textAlign: 'center', margin: '16px 0' }}>Binary Kenya</Title>
      </Header>
      <Content style={{ padding: '24px' }}>
        <Row justify="center" style={{ marginTop: '64px' }}>
          <Col xs={24} sm={20} md={16} lg={12} xl={10}>
            {error && (
              <Alert
                message="Error"
                description={error}
                type="error"
                showIcon
                style={{ marginBottom: '24px' }}
              />
            )}
            <Title level={2} style={{ textAlign: 'center' }}>Welcome to Binary Kenya</Title>
            <Paragraph style={{ textAlign: 'center', fontSize: '16px', marginBottom: '32px' }}>
              Your one-stop platform for managing all trading activities.
              <br />
              Log in with your Deriv account to get started.
            </Paragraph>
            <div style={{ textAlign: 'center' }}>
              <Button
                type="primary"
                size="large"
                onClick={handleLogin}
                loading={isLoading}
                style={{ width: '200px', height: '40px' }}
              >
                {isLoading ? 'Redirecting...' : 'Login with Deriv'}
              </Button>
            </div>
          </Col>
        </Row>
      </Content>
      <Footer style={{ textAlign: 'center', padding: '16px' }}>
        ©2025 Binary Kenya. All rights reserved.
      </Footer>
    </Layout>
  );
}

export default LandingPage;