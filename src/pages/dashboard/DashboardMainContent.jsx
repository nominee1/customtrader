import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  Statistic, 
  Progress,
  Layout,
  Spin,
  Space,
  Divider,
  Tag
} from 'antd';
import {
  DollarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  LineChartOutlined,
  WalletOutlined,
  SwapOutlined,
  RiseOutlined,
  FallOutlined,
  NumberOutlined
} from '@ant-design/icons';
import { useUser } from '../../context/AuthContext';
import VolatilityMonitor from '../../components/VolatilityMonitor';
import { ConfigProvider } from 'antd';

const { Title, Text } = Typography;
const { Content } = Layout;

const DashboardMainContent = () => {
  const { user } = useUser();

  if (!user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  // Sample data - replace with real data from your API
  const performanceData = {
    profit: 1582.50,
    growth: 5.2,
    trades: {
      total: 4,
      long: 1,
      short: 3
    },
    symbols: 10,
    contracts: 12
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#6C5CE7',
          borderRadius: 8,
        },
        components: {
          Card: {
            borderRadiusLG: 16,
            headerBg: 'transparent',
          },
        },
      }}
    >
      <div style={{ background: '#f9f9f9', minHeight: '100vh' }}>
        <Content style={{ margin: '24px 16px', padding: 24 }}>
          {/* Welcome Header */}
          <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
            <Col span={24}>
              <Card bordered={false} style={{ background: 'transparent', boxShadow: 'none' }}>
                <Title level={2} style={{ color: '#6C5CE7', marginBottom: 8 }}>
                  Welcome back, {user?.fullname || "Trader"}!
                </Title>
                <Text type="secondary">
                  Here's your trading overview for today
                </Text>
              </Card>
            </Col>
          </Row>

          {/* Stats Cards */}
          <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} md={6}>
              <Card 
                hoverable
                style={{ 
                  borderTop: '4px solid #6C5CE7',
                  borderRadius: 16,
                  boxShadow: '0 4px 12px rgba(108, 92, 231, 0.1)'
                }}
              >
                <Statistic
                  title={
                    <Space>
                      <WalletOutlined style={{ color: '#6C5CE7' }} />
                      <Text>Account Balance</Text>
                    </Space>
                  }
                  value={user?.balance}
                  precision={2}
                  prefix="$"
                  valueStyle={{ fontSize: 24, fontWeight: 600 }}
                />
                <Progress 
                  percent={68} 
                  status="active" 
                  showInfo={false} 
                  strokeColor="#6C5CE7"
                  trailColor="#F1F3FE"
                />
                <Text type="secondary">Available balance</Text>
              </Card>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Card 
                hoverable
                style={{ 
                  borderTop: '4px solid #00CEFF',
                  borderRadius: 16,
                  boxShadow: '0 4px 12px rgba(0, 206, 255, 0.1)'
                }}
              >
                <Statistic
                  title={
                    <Space>
                      <SwapOutlined style={{ color: '#00CEFF' }} />
                      <Text>Trades Today</Text>
                    </Space>
                  }
                  value={performanceData.trades.total}
                  valueStyle={{ fontSize: 24, fontWeight: 600 }}
                />
                <Progress 
                  percent={45} 
                  status="normal" 
                  showInfo={false}
                  strokeColor="#00CEFF"
                  trailColor="#E8FAFF"
                />
                <Space>
                  <Tag icon={<RiseOutlined />} color="#00CEFF20" style={{ color: '#00CEFF' }}>
                    {performanceData.trades.long} long
                  </Tag>
                  <Tag icon={<FallOutlined />} color="#FF767520" style={{ color: '#FF7675' }}>
                    {performanceData.trades.short} short
                  </Tag>
                </Space>
              </Card>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Card 
                hoverable
                style={{ 
                  borderTop: '4px solid #3f8600',
                  borderRadius: 16,
                  boxShadow: '0 4px 12px rgba(63, 134, 0, 0.1)'
                }}
              >
                <Statistic
                  title={
                    <Space>
                      <ArrowUpOutlined style={{ color: '#3f8600' }} />
                      <Text>Today's Profit</Text>
                    </Space>
                  }
                  value={performanceData.profit}
                  precision={2}
                  prefix="$"
                  valueStyle={{ color: '#3f8600', fontSize: 24, fontWeight: 600 }}
                />
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary">
                    <ArrowUpOutlined style={{ color: '#3f8600' }} /> {performanceData.growth}% portfolio growth
                  </Text>
                </div>
              </Card>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Card 
                hoverable
                style={{ 
                  borderTop: '4px solid #FF7675',
                  borderRadius: 16,
                  boxShadow: '0 4px 12px rgba(255, 118, 117, 0.1)'
                }}
              >
                <Statistic
                  title={
                    <Space>
                      <LineChartOutlined style={{ color: '#FF7675' }} />
                      <Text>Active Symbols</Text>
                    </Space>
                  }
                  value={performanceData.symbols}
                  suffix="daily"
                  valueStyle={{ fontSize: 24, fontWeight: 600 }}
                />
                <Progress 
                  percent={25} 
                  status="exception" 
                  showInfo={false}
                  strokeColor="#FF7675"
                  trailColor="#FFEEED"
                />
                <Text type="secondary">{performanceData.contracts} contracts in last hour</Text>
              </Card>
            </Col>
          </Row>

          {/* Volatility Monitor Section */}
          <Row gutter={[24, 24]}>
            <Col span={24}>
              <Card 
                title={
                  <Space>
                    <LineChartOutlined style={{ color: '#6C5CE7' }} />
                    <Text strong style={{ fontSize: 18 }}>Volatility Index Monitor</Text>
                  </Space>
                }
                style={{ borderRadius: 16 }}
                extra={
                  <Space>
                    <Tag color="#6C5CE7">R_10</Tag>
                    <Tag color="#00CEFF">R_25</Tag>
                    <Tag color="#FF7675">R_50</Tag>
                    <Tag color="#6C5CE7">R_100</Tag>
                  </Space>
                }
              >
                <VolatilityMonitor />
                <Divider />
                <Row gutter={[24, 24]}>
                  <Col xs={24} md={12}>
                    <Title level={5} style={{ color: '#6C5CE7' }}>
                      <RiseOutlined /> Recent Winning Trades
                    </Title>
                    {/* Add your recent trades component here */}
                    <div style={{ 
                      height: 150, 
                      background: 'linear-gradient(90deg, #6C5CE710, #6C5CE705)', 
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Text type="secondary">Winning trades chart</Text>
                    </div>
                  </Col>
                  <Col xs={24} md={12}>
                    <Title level={5} style={{ color: '#FF7675' }}>
                      <FallOutlined /> Recent Losing Trades
                    </Title>
                    {/* Add your recent trades component here */}
                    <div style={{ 
                      height: 150, 
                      background: 'linear-gradient(90deg, #FF767510, #FF767505)', 
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Text type="secondary">Losing trades chart</Text>
                    </div>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>

          {/* Quick Actions */}
          <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
            <Col span={24}>
              <Card 
                title="Quick Actions"
                style={{ borderRadius: 16 }}
              >
                <Row gutter={[24, 16]}>
                  <Col xs={24} sm={8}>
                    <Card 
                      hoverable
                      style={{ 
                        textAlign: 'center',
                        borderRadius: 12,
                        border: '1px solid #6C5CE720',
                        background: '#6C5CE710'
                      }}
                    >
                      <RiseOutlined style={{ fontSize: 32, color: '#6C5CE7' }} />
                      <Title level={5} style={{ marginTop: 16, color: '#6C5CE7' }}>Rise/Fall</Title>
                      <Text type="secondary">Predict market direction</Text>
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card 
                      hoverable
                      style={{ 
                        textAlign: 'center',
                        borderRadius: 12,
                        border: '1px solid #00CEFF20',
                        background: '#00CEFF10'
                      }}
                    >
                      <NumberOutlined style={{ fontSize: 32, color: '#00CEFF' }} />
                      <Title level={5} style={{ marginTop: 16, color: '#00CEFF' }}>Even/Odd</Title>
                      <Text type="secondary">Bet on digit outcomes</Text>
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card 
                      hoverable
                      style={{ 
                        textAlign: 'center',
                        borderRadius: 12,
                        border: '1px solid #FF767520',
                        background: '#FF767510'
                      }}
                    >
                      <ArrowUpOutlined style={{ fontSize: 32, color: '#FF7675' }} />
                      <Title level={5} style={{ marginTop: 16, color: '#FF7675' }}>Over/Under</Title>
                      <Text type="secondary">Set your price barriers</Text>
                    </Card>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        </Content>
      </div>
    </ConfigProvider>
  );
};

export default DashboardMainContent;