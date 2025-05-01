import React, { useState } from 'react';
import { Form, Input, Button, Alert, Progress, Row, Col, Tooltip } from 'antd';
import { LockOutlined, EyeInvisibleOutlined, EyeTwoTone, InfoCircleOutlined } from '@ant-design/icons';
import Notification from '../../utils/Notification';

const CreatePassword = ({ onSubmit, loading }) => {
  const [form] = Form.useForm();
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState(null);
  const [password, setPassword] = useState('');
  const [notification, setNotification] = useState({ type: '', content: '', trigger: false });

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

  const handleSubmit = async (values) => {
    setFormLoading(true);
    setError(null);
    try {
      await onSubmit(values.password);
      setNotification({ type: 'success', content: 'Password set successfully!', trigger: true });
      form.resetFields();
    } catch (err) {
      setError(err.message || 'Failed to create password');
      setNotification({ type: 'error', content: err.message || 'Failed to create password', trigger: true });
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '40px auto', padding: '20px' }}>
      <h2>Create New Password</h2>
      <p>Create a strong password to secure your account</p>
      {error && <Alert message={error} type="error" showIcon closable onClose={() => setError(null)} />}
      <Form form={form} name="createPassword" onFinish={handleSubmit} layout="vertical">
        <Form.Item
          name="password"
          rules={[
            { required: true, message: 'Please input your password!' },
            { min: 8, message: 'Password must be at least 8 characters!' },
            { pattern: /[A-Z]/, message: 'Must contain at least one uppercase letter!' },
            { pattern: /\d/, message: 'Must contain at least one number!' },
            { pattern: /[^A-Za-z0-9]/, message: 'Must contain at least one special character!' },
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
              <Progress percent={strength} showInfo={false} strokeColor={getStrengthColor()} strokeWidth={6} />
            </Col>
            <Col>
              <span style={{ color: getStrengthColor() }}>{strengthText()}</span>
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
          <Button type="primary" htmlType="submit" block size="large" loading={formLoading || loading}>
            Set Password
          </Button>
        </Form.Item>
      </Form>
      <Notification type={notification.type} content={notification.content} trigger={notification.trigger} />
    </div>
  );
};

export default CreatePassword;