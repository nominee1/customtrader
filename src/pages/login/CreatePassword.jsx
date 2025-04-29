import React, { useState } from 'react';
import { 
  Layout, 
  Card, 
  Form, 
  Input, 
  Button, 
  Typography, 
  Divider, 
  Space,
  Alert,
  message,
  Progress,
  Tooltip,
  Row,
  Col
} from 'antd';
import { 
  LockOutlined,
  EyeInvisibleOutlined, 
  EyeTwoTone,
  InfoCircleOutlined 
} from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import '../../assets/css/pages/LoginPage.css';
import logo from '../../assets/images/logo.png';

const { Content } = Layout;
const { Title, Text } = Typography;

const CreatePasswordPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  // Password strength calculator
  const calculateStrength = (pass) => {
    if (!pass) return 0;
    
    let strength = 0;
    
    // Length check
    if (pass.length > 5) strength += 20;
    if (pass.length > 8) strength += 20;
    
    // Complexity checks
    if (/[A-Z]/.test(pass)) strength += 20;
    if (/\d/.test(pass)) strength += 20;
    if (/[^A-Za-z0-9]/.test(pass)) strength += 20;
    
    return Math.min(strength, 100);
  };
  
  const strength = calculateStrength(password);
  
  const getStrengthColor = () => {
    if (strength < 40) return '#ff4d4f'; // red
    if (strength < 70) return '#faad14'; // orange
    return '#52c41a'; // green
  };
  
  const strengthText = () => {
    if (strength === 0) return '';
    if (strength < 40) return 'Weak';
    if (strength < 70) return 'Moderate';
    return 'Strong';
  };

  const onFinish = async (values) => {
    setLoading(true);
    setError(null);
    try {
      // Simulate API call
      console.log('Password creation values:', values);
      await new Promise(resolve => setTimeout(resolve, 1000));
      message.success('Password created successfully!');
      navigate('/login'); 
    } catch (err) {
      setError(err.message || 'Failed to create password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout className="layout">
      <Content className="content">
        <Card className="card">
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <img
              src={logo} 
              className="logo-img"
              alt="Logo"
            />
            <Title level={3} className="title">Create New Password</Title>
            <Text type="secondary">Create a strong password to secure your account</Text>
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
            name="createPassword"
            onFinish={onFinish}
            layout="vertical"
          >
            <Form.Item
              name="password"
              rules={[
                { required: true, message: 'Please input your password!' },
                { min: 8, message: 'Password must be at least 8 characters!' },
                { pattern: /[A-Z]/, message: 'Must contain at least one uppercase letter!' },
                { pattern: /\d/, message: 'Must contain at least one number!' },
                { pattern: /[^A-Za-z0-9]/, message: 'Must contain at least one special character!' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="New Password"
                size="large"
                iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Form.Item>
            
            {password && (
              <Row gutter={8} align="middle" style={{ marginBottom: 16 }}>
                <Col flex="auto">
                  <Progress 
                    percent={strength} 
                    showInfo={false} 
                    strokeColor={getStrengthColor()}
                    strokeWidth={6}
                  />
                </Col>
                <Col>
                  <span style={{ color: getStrengthColor() }}>
                    {strengthText()}
                  </span>
                </Col>
                <Col>
                  <Tooltip title="Password should be at least 8 characters and contain uppercase, numbers, and special characters">
                    <InfoCircleOutlined style={{ color: 'rgba(0,0,0,.45)' }} />
                  </Tooltip>
                </Col>
              </Row>
            )}
            
            <Form.Item
              name="confirmPassword"
              dependencies={['password']}
              rules={[
                { required: true, message: 'Please confirm your password!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('The two passwords do not match!'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Confirm Password"
                size="large"
                iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
              />
            </Form.Item>
            
            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                block 
                size="large"
                loading={loading}
              >
                Set Password
              </Button>
            </Form.Item>
          </Form>
          
          <Divider plain>or</Divider>
          
          <div className="login-text">
            <Text type="secondary">Remember your password? </Text>
            <Link to="/login">
              <Text strong>Sign in</Text>
            </Link>
          </div>
        </Card>
      </Content>
    </Layout>
  );
};

export default CreatePasswordPage;