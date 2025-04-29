import React from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { Link } from 'react-router-dom';
import '../../assets/css/pages/SignUp.css';

const { Title, Text } = Typography;

const SignUpPage = () => {
  const [form] = Form.useForm();

  const onFinish = (values) => {
    // Mock submission (replace with your API call, e.g., sendAuthorizedRequest)
    console.log('Sign Up Values:', values);
    message.success('Sign up successful! Please log in.');
    // Example: Navigate to login after success
    // navigate('/login');
  };

  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo);
    message.error('Please check the form and try again.');
  };

  return (
    <div className="signup-page">
      <div className="signup-container">
        <Card className="signup-card">
          <Title level={3} className="signup-title">
            Sign Up for Mulla
          </Title>
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
              <Input placeholder="e.g., Nashon Okeyo Omondi" />
            </Form.Item>

            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: 'Please enter your email' },
                { type: 'email', message: 'Please enter a valid email' },
              ]}
            >
              <Input placeholder="e.g., nashon@example.com" />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[
                { required: true, message: 'Please enter your password' },
                { min: 6, message: 'Password must be at least 6 characters' },
              ]}
            >
              <Input.Password placeholder="Enter your password" />
            </Form.Item>

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
                    return Promise.reject(new Error('Passwords do not match'));
                  },
                }),
              ]}
            >
              <Input.Password placeholder="Confirm your password" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block className="signup-button">
                Sign Up
              </Button>
            </Form.Item>

            <Form.Item>
              <Text>
                Already have an account? <Link to="/login">Log in</Link>
              </Text>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default SignUpPage;