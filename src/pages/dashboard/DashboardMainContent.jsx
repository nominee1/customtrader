import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  Statistic, 
  Progress,
  Layout,
  Spin
} from 'antd';
import {
  DollarOutlined
} from '@ant-design/icons';
import { useUser } from '../../context/AuthContext';
import VolatilityMonitor from '../../components/VolatilityMonitor';

const { Title, Text } = Typography;
const { Content } = Layout;

const DashboardMainContent = () => {
  const { user } = useUser();

  if (!user) {
    return <Spin size="large" style={{ display: 'block', margin: '50px auto' }} />;
  }

  return (
    <div>
      <Content style={{ margin: '24px 16px', padding: 24, background: '#fff' }}>
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <Title level={3}>Welcome {user?.fullname || "User"}</Title>
          </Col>
          {/* Stats Cards */}
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Account Balance"
                value={user?.balance}
                precision={2}
                prefix={<DollarOutlined />}
              />
              <Progress percent={68} status="active" showInfo={false} />
              <Text type="secondary">Available balance</Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Trades Today"
                value={4}
              />
              <Progress percent={45} status="normal" showInfo={false} />
              <Text type="secondary">1 long, 3 short</Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Today's Profit"
                value={1582.50}
                precision={2}
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
              <Text type="secondary">5.2% portfolio growth</Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Active Symbols"
                value={10}
                suffix="daily"
              />
              <Progress percent={25} status="exception" showInfo={false} />
              <Text type="secondary">12 Contracts in last hour</Text>
            </Card>
          </Col>
          {/* Portfolio Overview */}
          <Col span={24}>
            <Card title="Volatility Index Monitor">
              <VolatilityMonitor />
            </Card>
          </Col>
        </Row>
      </Content>
    </div>
  );
};

export default DashboardMainContent;