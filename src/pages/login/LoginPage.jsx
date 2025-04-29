import React, { useState } from 'react';
import { 
  Layout, 
  Card, 
  Form, 
  Input, 
  Button, 
  Checkbox, 
  Typography, 
  Divider, 
  Space,
  Alert,
  message
} from 'antd';
import { 
  UserOutlined, 
  LockOutlined, 
  MailOutlined
} from '@ant-design/icons';

import { useNavigate, Link } from 'react-router-dom';
import '../../assets/css/pages/LoginPage.css';

const { Content } = Layout;
const { Title, Text } = Typography;

const LoginPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    setError(null);
    try {
      // Simulate API call
      console.log('Login values:', values);
      await new Promise(resolve => setTimeout(resolve, 1000));
      message.success('Login successful!');
      navigate('/dashboard'); 
    } catch (err) {
      setError(err.message || 'Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDerivAuth = async () => {
    const appId = import.meta.env.VITE_DERIV_APP_ID;
    const redirectUri = `${window.location.origin}/`; 
    window.location.href = `https://oauth.deriv.com/oauth2/authorize?app_id=${appId}&response_type=token&scope=read&redirect_uri=${encodeURIComponent(redirectUri)}`;
    console.log('Redirecting to Deriv authentication...');
  };

  return (
    <Layout className="layout">
      <Content className="content">
        <Card className="card">
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Title level={2} className='logo'>Mulla</Title>
            <Divider ></Divider>
            <Title level={3} className="title">Sign in to your account</Title>
            <Text type="secondary">Connect with Deriv API to start trading</Text>
          </div>
          {error && (
            <Alert 
              message={error} 
              type="error" 
              showIcon 
              className="error-alert"
              closable
              onClose={() => setError(null)}
            />
          )}
          <Form
            form={form}
            name="login"
            initialValues={{ remember: true }}
            onFinish={onFinish}
            layout="vertical"
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Please input your email!' },
                { type: 'email', message: 'Please enter a valid email!' }
              ]}
            >
              <Input 
                prefix={<UserOutlined />} 
                placeholder="Email" 
                size="large"
              />
            </Form.Item>
            <Form.Item
              name="password"
              rules={[
                { required: true, message: 'Please input your password!' },
                { min: 6, message: 'Password must be at least 6 characters!' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Password"
                size="large"
              />
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
              <Button 
                type="primary" 
                htmlType="submit" 
                block 
                size="large"
                loading={loading}
              >
                Sign In
              </Button>
            </Form.Item>
          </Form>
          <Divider plain>or continue with</Divider>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button 
              block 
              size="large"
              onClick={handleDerivAuth}
              icon={<MailOutlined />}
              className="button-deriv"
            >
              Login with Deriv
            </Button>
          </Space>
          <div className="signup-text">
            <Text type="secondary">Don't have an account? </Text>
            <Link to="/register">
              <Text strong>Sign up</Text>
            </Link>
          </div>
        </Card>
      </Content>
    </Layout>
  );
};
export default LoginPage;