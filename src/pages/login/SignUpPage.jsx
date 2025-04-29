import React, { useState } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Card, 
  Typography, 
  message,
  Progress,
  Tooltip,
  Row,
  Col,
  Divider
} from 'antd';
import { 
  UserOutlined,
  MailOutlined,
  LockOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
  InfoCircleOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import '../../assets/css/pages/SignUp.css';
import logo from '../../assets/images/logo.png';

const { Title, Text } = Typography;

const SignUpPage = () => {
  const [form] = Form.useForm();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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

  const onFinish = (values) => {
    setLoading(true);
    // Mock submission
    console.log('Sign Up Values:', values);
    setTimeout(() => {
      message.success('Sign up successful! Please log in.');
      form.resetFields();
      setLoading(false);
      // navigate('/login');
    }, 1500);
  };

  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo);
    message.error('Please check the form and try again.');
  };

  const strength = calculateStrength(password);
  const getStrengthColor = () => {
    if (strength < 40) return '#ff4d4f';
    if (strength < 70) return '#faad14';
    return '#52c41a';
  };

  const strengthText = () => {
    if (strength === 0) return '';
    if (strength < 40) return 'Weak';
    if (strength < 70) return 'Moderate';
    return 'Strong';
  };

  return (
    <div className="signup-page">
      <div className="signup-container">
        <Card className="signup-card">
          <div className="signup-header">
            <img
              src={logo} 
              className="logo-img"
              alt="Logo"
            />
            <Title level={3} className="signup-title">
              Create Your Account
            </Title>
            <Text type="secondary">Join our trading platform today</Text>
          </div>

          <Form
            form={form}
            name="signup"
            layout="vertical"
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            autoComplete="off"
          >
            <Form.Item
              label="Full Name"
              name="fullname"
              rules={[
                { required: true, message: 'Please enter your full name' },
                { min: 2, message: 'Name must be at least 2 characters' },
              ]}
            >
              <Input 
                prefix={<UserOutlined />} 
                placeholder="e.g., Nashon Okeyo Omondi" 
                size="large"
              />
            </Form.Item>

            <Form.Item
              label="Email Address"
              name="email"
              rules={[
                { required: true, message: 'Please enter your email' },
                { type: 'email', message: 'Please enter a valid email' },
              ]}
            >
              <Input 
                prefix={<MailOutlined />} 
                placeholder="e.g., nashon@example.com" 
                size="large"
              />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[
                { required: true, message: 'Please enter your password' },
                { min: 8, message: 'Password must be at least 8 characters' },
                { pattern: /[A-Z]/, message: 'Must contain at least one uppercase letter' },
                { pattern: /\d/, message: 'Must contain at least one number' },
                { pattern: /[^A-Za-z0-9]/, message: 'Must contain at least one special character' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Create a password"
                size="large"
                iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Form.Item>

            {password && (
              <Row gutter={8} align="middle" className="password-strength-row">
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
              label="Confirm Password"
              name="confirmPassword"
              dependencies={['password']}
              rules={[
                { required: true, message: 'Please confirm your password' },
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
                placeholder="Confirm your password"
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
                className="signup-button"
              >
                Create Account
              </Button>
            </Form.Item>

            <Divider plain>or</Divider>

            <div className="login-link">
              <Text type="secondary">Already have an account? </Text>
              <Link to="/login">
                <Text strong>Sign in</Text>
              </Link>
            </div>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default SignUpPage;