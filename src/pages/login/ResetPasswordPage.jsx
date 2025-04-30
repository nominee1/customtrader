import React, { useState, useEffect, useRef } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Card, 
  Typography, 
  Divider,
  Progress,
  Tooltip,
  Row,
  Col,
  Steps,
  Alert
} from 'antd';
import { 
  MailOutlined,
  LockOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
  InfoCircleOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import Notification from '../../utils/Notification';
import '../../assets/css/pages/ResetPassword.css';
import logo from '../../assets/images/logo.png';

const { Title, Text } = Typography;
const { Step } = Steps;

const ResetPasswordPage = () => {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [notification, setNotification] = useState({
    trigger: false,
    type: '',
    content: ''
  });
  const inputRefs = useRef([]);
  const navigate = useNavigate();

  // Password strength calculator
  const calculateStrength = (pass) => {
    if (!pass) return 0;
    let strength = 0;
    if (pass.length > 5) strength += 20;
    if (pass.length > 8) strength += 20;
    if (/[A-Z]/.test(pass)) strength += 20;
    if (/\d/.test(pass)) strength += 20;
    if (/[^A-Za-z0-9]/.test(pass)) strength += 20;
    return Math.min(strength, 100);
  };

  // Resend code countdown timer
  useEffect(() => {
    let timer;
    if (resendTimer > 0 && !canResend) {
      timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [resendTimer, canResend]);

  // Auto-focus next input and submit when complete
  const handleCodeInput = (e, index) => {
    const value = e.target.value;
    if (value.length === 1 && index < 5) {
      inputRefs.current[index + 1].focus();
    }
    
    // Check if all fields are filled
    const allFilled = inputRefs.current.every(ref => ref.input.value.length === 1);
    if (allFilled) {
      handleVerifyCode();
    }
  };

  const handleSendCode = async () => {
    setLoading(true);
    try {
      // Simulate API call to send code
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCurrentStep(1);
      setResendTimer(60);
      setCanResend(false);
      setNotification({
        trigger: true,
        type: 'success',
        content: 'Verification code sent to your email'
      });
    } catch (error) {
      setNotification({
        trigger: true,
        type: 'error',
        content: 'Failed to send code. Please try again.'
      });
      console.error('Code Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    setLoading(true);
    try {
      // Simulate code verification
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCurrentStep(2);
      setNotification({
        trigger: true,
        type: 'success',
        content: 'Code verified successfully'
      });
    } catch (error) {
      setNotification({
        trigger: true,
        type: 'error',
        content: 'Invalid verification code'
      });
      console.error("code varification error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (values) => {
    setLoading(true);
    try {
      // Simulate password reset
      await new Promise(resolve => setTimeout(resolve, 1000));
      setNotification({
        trigger: true,
        type: 'success',
        content: 'Password reset successfully! Redirecting to login...'
      });
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      setNotification({
        trigger: true,
        type: 'error',
        content: 'Failed to reset password. Please try again.'
      });
      console.error('Reset password error:', error);
    } finally {
      setLoading(false);
    }
  };

  const resendCode = () => {
    setResendTimer(60);
    setCanResend(false);
    handleSendCode();
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

  const steps = [
    {
      title: 'Enter Email',
      content: (
        <Form
          form={form}
          name="emailForm"
          onFinish={handleSendCode}
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
              prefix={<MailOutlined />}
              placeholder="Enter your email"
              size="large"
              onChange={(e) => setEmail(e.target.value)}
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
              Send Verification Code
            </Button>
          </Form.Item>
        </Form>
      )
    },
    {
      title: 'Verify Code',
      content: (
        <div className="verify-code-container">
          <Text type="secondary" className="code-instructions">
            We've sent a 6-digit code to {email}
          </Text>
          <div className="code-inputs">
            {[...Array(6)].map((_, index) => (
              <Input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                maxLength={1}
                size="large"
                className="code-input"
                onChange={(e) => handleCodeInput(e, index)}
              />
            ))}
          </div>
          <div className="resend-container">
            {canResend ? (
              <Button type="link" onClick={resendCode}>
                Resend Code
              </Button>
            ) : (
              <Text type="secondary">
                Resend code in {resendTimer} seconds
              </Text>
            )}
          </div>
          <Button
            type="primary"
            block
            size="large"
            loading={loading}
            onClick={handleVerifyCode}
            style={{ marginTop: 24 }}
          >
            Verify Code
          </Button>
        </div>
      )
    },
    {
      title: 'New Password',
      content: (
        <Form
          form={form}
          name="resetForm"
          onFinish={handleResetPassword}
          layout="vertical"
        >
          <Form.Item
            name="newPassword"
            rules={[
              { required: true, message: 'Please input your new password!' },
              { min: 8, message: 'Password must be at least 8 characters!' },
              { pattern: /[A-Z]/, message: 'Must contain at least one uppercase letter!' },
              { pattern: /\d/, message: 'Must contain at least one number!' },
              { pattern: /[^A-Za-z0-9]/, message: 'Must contain at least one special character!' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="New password"
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
                <Tooltip title={
                  <div>
                    <div>• At least 8 characters</div>
                    <div>• One uppercase letter</div>
                    <div>• One number</div>
                    <div>• One special character</div>
                  </div>
                }>
                  <InfoCircleOutlined style={{ color: 'rgba(0,0,0,.45)' }} />
                </Tooltip>
              </Col>
            </Row>
          )}

          <Form.Item
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Please confirm your password!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('The two passwords do not match!'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Confirm new password"
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
              Reset Password
            </Button>
          </Form.Item>
        </Form>
      )
    }
  ];

  return (
    <div className="reset-page">
      <Notification 
        trigger={notification.trigger}
        type={notification.type}
        content={notification.content}
      />
      <div className="reset-container">
        <Card className="reset-card">
          <div className="reset-header">
          <img
              src={logo} 
              className="logo-img"
              alt="Logo"
            />
            <Title level={3} className="reset-title">
              Reset Your Password
            </Title>
            <Text type="secondary">Follow the steps to reset your password</Text>
          </div>

          <Steps current={currentStep} className="reset-steps">
            {steps.map((item) => (
              <Step key={item.title} title={item.title} />
            ))}
          </Steps>

          <div className="steps-content">{steps[currentStep].content}</div>

          <div className="back-to-login">
            <Link to="/login">
              <ArrowLeftOutlined style={{ marginRight: 8 }} />
              Back to Login
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ResetPasswordPage;