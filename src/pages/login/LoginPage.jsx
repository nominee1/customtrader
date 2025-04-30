import React, { useState } from 'react';
import { Layout, Card, Form, Input, Button, Checkbox, Typography, Divider, Space, Alert } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import Notification from '../../utils/Notification';
import '../../assets/css/pages/LoginPage.css';
import logo from '../../assets/images/logo.png';

const { Content } = Layout;
const { Title, Text } = Typography;

const LoginPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ type: '', content: '', trigger: false });
  const navigate = useNavigate();

  const showNotification = (type, content) => {
    setNotification({ type, content, trigger: true });
    setTimeout(() => setNotification((prev) => ({ ...prev, trigger: false })), 3000);
  };

  const onFinish = async (values) => {
    setLoading(true);
    setError(null);
    try {
      // Check if user exists
      const checkResponse = await fetch('/api/check-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: values.email }),
      });
      const checkData = await checkResponse.json();

      if (!checkData.exists) {
        showNotification('warning', 'No account found. Please log in with Deriv first.');
        handleDerivAuth();
        return;
      }

      // Attempt login
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: values.email, password: values.password }),
      });
      const data = await response.json();

      if (data.success) {
        sessionStorage.setItem('sessionToken', data.sessionToken || 'temp-token');
        showNotification('success', 'Login successful!');
        navigate('/dashboard');
      } else {
        throw new Error(data.error || 'Invalid credentials');
      }
    } catch (err) {
      setError(err.message || 'Failed to login');
      showNotification('error', err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleDerivAuth = () => {
    const appId = import.meta.env.VITE_DERIV_APP_ID;
    const redirectUri = `${window.location.origin}/`;
    window.location.href = `https://oauth.deriv.com/oauth2/authorize?app_id=${appId}&response_type=token&scope=read&redirect_uri=${encodeURIComponent(redirectUri)}`;
  };

  return (
    <Layout className="layout">
      <Content className="content">
        <Card className="card">
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <img src={logo} className="logo-img" alt="Logo" />
            <Title level={3} className="title">Sign in to your account</Title>
            <Text type="secondary">Connect with Deriv API to start trading</Text>
          </div>
          {error && <Alert message={error} type="error" showIcon className="error-alert" closable onClose={() => setError(null)} />}
          <Form form={form} name="login" initialValues={{ remember: true }} onFinish={onFinish} layout="vertical">
            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Please input your email!' },
                { type: 'email', message: 'Please enter a valid email!' },
              ]}
            >
              <Input prefix={<UserOutlined />} placeholder="Email" size="large" />
            </Form.Item>
            <Form.Item
              name="password"
              rules={[
                { required: true, message: 'Please input your password!' },
                { min: 6, message: 'Password must be at least 6 characters!' },
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Password" size="large" />
            </Form.Item>
            <Form.Item className="form-item">
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox>Remember me</Checkbox>
              </Form.Item>
              <Link to="/forgot-password">
                <Text type="secondary">Forgot password?</Text>
              </Link>
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block size="large" loading={loading}>
                Sign In
              </Button>
            </Form.Item>
          </Form>
          <Divider plain>or continue with</Divider>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button block size="large" onClick={handleDerivAuth} icon={<MailOutlined />} className="button-deriv">
              Login with Deriv
            </Button>
          </Space>
          <div className="signup-text">
            <Text type="secondary">Don't have an account? </Text>
            <Link to="/signup">
              <Text strong>Sign up</Text>
            </Link>
          </div>
        </Card>
        <Notification type={notification.type} content={notification.content} trigger={notification.trigger} />
      </Content>
    </Layout>
  );
};

export default LoginPage;