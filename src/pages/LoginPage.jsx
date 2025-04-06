import { useState } from 'react';
import { Form, Input, Button, Checkbox, Layout, Typography, message } from 'antd';
import { useNavigate } from 'react-router-dom'; // Changed from useHistory to useNavigate

const { Title } = Typography;
const { Content, Footer } = Layout;

function LoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // Changed from useHistory to useNavigate

  const onFinish = (values) => {
    setLoading(true);
    // Here you would make an API call to authenticate the user, e.g., with JWT
    setTimeout(() => {
      message.success('Logged in successfully');
      navigate('/dashboard'); // Changed from history.push to navigate
      setLoading(false);
    }, 1000);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ padding: '50px' }}>
        <div style={{ maxWidth: '400px', margin: 'auto' }}>
          <Title level={2} style={{ textAlign: 'center' }}>Login</Title>
          <Form
            name="login"
            initialValues={{ remember: true }}
            onFinish={onFinish}
            style={{ maxWidth: 300 }}
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: 'Please input your username!' }]}
            >
              <Input placeholder="Username" />
            </Form.Item>
            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Please input your password!' }]}
            >
              <Input.Password placeholder="Password" />
            </Form.Item>
            <Form.Item>
              <Checkbox>Remember me</Checkbox>
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading}>
                Login
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Content>
      <Footer style={{ textAlign: 'center' }}>
        ©2025 Created by You
      </Footer>
    </Layout>
  );
}

export default LoginPage;