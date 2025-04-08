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
  GoogleOutlined, 
  FacebookOutlined,
  TwitterOutlined,
  MailOutlined
} from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import derivLogo from '../../assets/react.svg'; 

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
      // Replace with actual Deriv API authentication
      console.log('Login values:', values);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // On successful login
      message.success('Login successful!');
      navigate('/dashboard'); // Redirect to dashboard
    } catch (err) {
      setError(err.message || 'Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Content style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        padding: '24px'
      }}>
        <Card
          style={{ 
            width: '100%',
            maxWidth: 420,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            border: 'none'
          }}
          bodyStyle={{ padding: '32px' }}
        >
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <img 
              src={derivLogo} 
              alt="Deriv Logo" 
              style={{ height: 48, marginBottom: 16 }} 
            />
            <Title level={3} style={{ marginBottom: 8 }}>Sign in to your account</Title>
            <Text type="secondary">Connect with Deriv API to start trading</Text>
          </div>

          {error && (
            <Alert 
              message={error} 
              type="error" 
              showIcon 
              style={{ marginBottom: 24 }}
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

            <Form.Item>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox>Remember me</Checkbox>
                </Form.Item>

                <Link to="/forgot-password">
                  <Text type="secondary">Forgot password?</Text>
                </Link>
              </div>
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
              icon={<GoogleOutlined />} 
              block 
              size="large"
              onClick={() => message.info('Google login coming soon')}
            >
              Google
            </Button>
            <Button 
              icon={<FacebookOutlined />} 
              block 
              size="large"
              onClick={() => message.info('Facebook login coming soon')}
            >
              Facebook
            </Button>
            <Button 
              icon={<TwitterOutlined />} 
              block 
              size="large"
              onClick={() => message.info('Twitter login coming soon')}
            >
              Twitter
            </Button>
          </Space>

          <div style={{ textAlign: 'center', marginTop: 24 }}>
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