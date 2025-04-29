import React, { useState } from 'react';
import { Form, Input, Progress, Tooltip, Row, Col, Space } from 'antd';
import { EyeInvisibleOutlined, EyeTwoTone, InfoCircleOutlined } from '@ant-design/icons';

const PasswordField = ({
  name,
  label,
  placeholder,
  onChange,
  dependencies = [],
  showStrength = true,
  passwordValue,
}) => {
  const [password, setPassword] = useState('');

  const handleChange = (e) => {
    setPassword(e.target.value);
    onChange?.(e);
  };

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
  
  const strength = calculateStrength(passwordValue || password);
  
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

  return (
    <>
      <Form.Item
        name={name}
        label={label}
        rules={[
          { required: true, message: 'Please input your password!' },
          { min: 8, message: 'Password must be at least 8 characters!' },
          ...(dependencies.length > 0 ? [({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue(dependencies[0]) === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error('The two passwords do not match!'));
            },
          })] : []),
        ]}
        dependencies={dependencies}
        hasFeedback
      >
        <Input.Password
          placeholder={placeholder}
          iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
          onChange={handleChange}
        />
      </Form.Item>
      
      {showStrength && (passwordValue || password) && (
        <Row gutter={8} align="middle" style={{ marginBottom: 24 }}>
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
    </>
  );
};

const PasswordForm = () => {
  const [form] = Form.useForm();
  const [password, setPassword] = useState('');

  return (
    <Form form={form} layout="vertical">
      <Space direction="vertical" style={{ width: '100%' }}>
        <PasswordField
          name="password"
          label="Password"
          placeholder="Enter your password"
          onChange={(e) => setPassword(e.target.value)}
          showStrength={true}
        />

        <PasswordField
          name="confirmPassword"
          label="Confirm Password"
          placeholder="Confirm your password"
          dependencies={['password']}
          showStrength={false}
          passwordValue={password}
        />
      </Space>
    </Form>
  );
};

export default PasswordForm;