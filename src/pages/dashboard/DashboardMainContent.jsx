import React from 'react';
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
  const { user, realityCheck } = useUser();

  if (!user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  // Extract values from realityCheck
  const totalPurchases = realityCheck?.reality_check?.total_purchases || 0;
  const totalProfitLoss = realityCheck?.reality_check?.total_profit_loss || 0;
  const totalPayouts = realityCheck?.reality_check?.total_payouts || 0;
  const numTransactions = realityCheck?.reality_check?.num_transactions || 0;
  const sessionDuration = realityCheck?.reality_check?.session_duration || 0;

  // Calculate percentage growth
  const percentageGrowth = totalPurchases
    ? ((totalProfitLoss / totalPurchases) * 100).toFixed(2)
    : 0;

  // Convert session duration to human-readable format
  const formatSessionDuration = (durationInSeconds) => {
    const minutes = Math.floor(durationInSeconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `in the last ${hours} hour${hours > 1 ? 's' : ''}`;
    } else if (minutes > 0) {
      return `in the last ${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else {
      return `just now`;
    }
  };

  const readableSessionDuration = formatSessionDuration(sessionDuration);

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
                      <Text>Total Purchases</Text>
                    </Space>
                  }
                  value={totalPurchases}
                  precision={2}
                  prefix="$"
                  valueStyle={{ fontSize: 24, fontWeight: 600 }}
                />
                <Progress 
                  percent={45} 
                  status="normal" 
                  showInfo={false}
                  strokeColor="#00CEFF"
                  trailColor="#E8FAFF"
                />
                <Text type="secondary">{numTransactions} transactions {readableSessionDuration}</Text>
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
                      <Text>Profit Growth</Text>
                    </Space>
                  }
                  value={totalProfitLoss}
                  precision={2}
                  prefix="$"
                  valueStyle={{ color: '#3f8600', fontSize: 24, fontWeight: 600 }}
                />
                <Progress
                  percent={percentageGrowth}
                  status="active"
                  showInfo={false}
                  strokeColor="#3f8600"
                  trailColor="#E6FFED"
                />
                <Text type="secondary">{percentageGrowth}% Growth {readableSessionDuration}</Text>
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
                      <Text>Total Payouts</Text>
                    </Space>
                  }
                  value={totalPayouts}
                  precision={2}
                  prefix="$"
                  valueStyle={{ color: '#FF7675', fontSize: 24, fontWeight: 600 }}
                />
                <Progress 
                  percent={25} 
                  status="exception" 
                  showInfo={false}
                  strokeColor="#FF7675"
                  trailColor="#FFEEED"
                />
                <Text type="secondary">{numTransactions} transactions {readableSessionDuration}</Text>
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
          <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
            <Col xs={12} sm={6} md={6}>
              <Card 
                hoverable
                style={{ 
                  textAlign: 'center',
                  borderRadius: 12,
                  border: '1px solid #6C5CE720',
                  background: '#6C5CE710'
                }}
              >
                <RiseOutlined style={{ fontSize: 24, color: '#6C5CE7' }} />
                <Title level={5} style={{ marginTop: 8, fontSize: 14, color: '#6C5CE7' }}>Rise/Fall</Title>
                <Text type="secondary" style={{ fontSize: 12 }}>Predict market direction</Text>
              </Card>
            </Col>
            <Col xs={12} sm={6} md={6}>
              <Card 
                hoverable
                style={{ 
                  textAlign: 'center',
                  borderRadius: 12,
                  border: '1px solid #00CEFF20',
                  background: '#00CEFF10'
                }}
              >
                <NumberOutlined style={{ fontSize: 24, color: '#00CEFF' }} />
                <Title level={5} style={{ marginTop: 8, fontSize: 14, color: '#00CEFF' }}>Even/Odd</Title>
                <Text type="secondary" style={{ fontSize: 12 }}>Bet on digit outcomes</Text>
              </Card>
            </Col>
            <Col xs={12} sm={6} md={6}>
              <Card 
                hoverable
                style={{ 
                  textAlign: 'center',
                  borderRadius: 12,
                  border: '1px solid #FF767520',
                  background: '#FF767510'
                }}
              >
                <ArrowUpOutlined style={{ fontSize: 24, color: '#FF7675' }} />
                <Title level={5} style={{ marginTop: 8, fontSize: 14, color: '#FF7675' }}>Over/Under</Title>
                <Text type="secondary" style={{ fontSize: 12 }}>Set your price barriers</Text>
              </Card>
            </Col>
            <Col xs={12} sm={6} md={6}>
              <Card 
                hoverable
                style={{ 
                  textAlign: 'center',
                  borderRadius: 12,
                  border: '1px solid #3f860020',
                  background: '#3f860010'
                }}
              >
                <SwapOutlined style={{ fontSize: 24, color: '#3f8600' }} />
                <Title level={5} style={{ marginTop: 8, fontSize: 14, color: '#3f8600' }}>Matches/Differs</Title>
                <Text type="secondary" style={{ fontSize: 12 }}>Predict the digit outcomes</Text>
              </Card>
            </Col>
          </Row>
        </Content>
      </div>
    </ConfigProvider>
  );
};

export default DashboardMainContent;