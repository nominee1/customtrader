import { Layout, Menu, Button, Row, Col, Typography, Space } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { HomeOutlined, UserOutlined, DashboardOutlined, LoginOutlined, LogoutOutlined } from '@ant-design/icons';

const { Header: AntHeader } = Layout;
const { Title } = Typography;

function Header({ isAuthenticated = false, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    if (onLogout) onLogout();
    navigate('/login');
  };

  return (
    <AntHeader style={{ background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <Row justify="space-between" align="middle">
        <Col>
          <Link to="/">
            <Title level={4} style={{ margin: 0 }}>
              <Space>
                <HomeOutlined />
                My App
              </Space>
            </Title>
          </Link>
        </Col>
        <Col>
          <Menu mode="horizontal" selectedKeys={[]} style={{ borderBottom: 'none' }}>
            {isAuthenticated ? (
              <>
                <Menu.Item key="dashboard" icon={<DashboardOutlined />}>
                  <Link to="/dashboard">Dashboard</Link>
                </Menu.Item>
                <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
                  Logout
                </Menu.Item>
              </>
            ) : (
              <Menu.Item key="login" icon={<LoginOutlined />}>
                <Link to="/login">Login</Link>
              </Menu.Item>
            )}
          </Menu>
        </Col>
      </Row>
    </AntHeader>
  );
}

export default Header;