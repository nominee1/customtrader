import React, { useEffect, useState } from 'react';
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
  Tag,
  Alert,
} from 'antd';
import {
  DollarOutlined,
  ArrowUpOutlined,
  LineChartOutlined,
  WalletOutlined,
  SwapOutlined,
  RiseOutlined,
  FallOutlined,
  NumberOutlined,
} from '@ant-design/icons';
import { useUser } from '../../context/AuthContext';
import VolatilityMonitor from '../../components/VolatilityMonitor';
import { ConfigProvider } from 'antd';

const { Title, Text } = Typography;
const { Content } = Layout;

const DashboardMainContent = () => {
  const { user, balance, activeAccount, authLoading, sendAuthorizedRequest } = useUser();
  const [profitTable, setProfitTable] = useState([]);
  const [stats, setStats] = useState({
    totalProfitLoss: 0,
    totalPurchases: 0,
    totalPayouts: 0,
    numTransactions: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const accountId = activeAccount?.loginid;
  const isLoading = authLoading || loading;

  // Load cached data
  useEffect(() => {
    if (accountId) {
      const cachedProfitTable = localStorage.getItem(`profitTable_${accountId}`);
      if (cachedProfitTable) {
        const parsedData = JSON.parse(cachedProfitTable);
        setProfitTable(parsedData);
        const transactions = parsedData?.profit_table?.transactions || [];
        setStats({
          totalProfitLoss: transactions.reduce((sum, tx) => sum + (tx.profit_loss || 0), 0),
          totalPurchases: transactions.reduce((sum, tx) => sum + (tx.buy_price || 0), 0),
          totalPayouts: transactions.reduce((sum, tx) => sum + (tx.payout || 0), 0),
          numTransactions: transactions.length,
        });
      }
    }
  }, [accountId]);

  // Fetch profit table data for the last 30 days
  useEffect(() => {
    if (!accountId) return;

    const fetchProfitTable = async () => {
      setError(null);

      // Set date range for the last 30 days using Unix timestamps
      const now = new Date();
      const dateTo = Math.floor(now.getTime() / 1000); // Current time in seconds (UTC)
      const dateFrom = dateTo - 30 * 24 * 60 * 60; // 30 days ago in seconds

      const payload = {
        profit_table: 1,
        description: 1,
        sort: 'DESC',
        date_from: dateFrom, // e.g., 1745088000 (30 days ago from April 19, 2025)
        date_to: dateTo, // e.g., 1747670400 (April 19, 2025)
        limit: 100,
      };

      console.log('Sending profit_table payload:', payload);

      try {
        const response = await sendAuthorizedRequest(payload);
        console.log('Profit_table response:', response);

        if (response.error) {
          throw new Error(
            response.error.message || 'Failed to fetch profit table: Invalid input parameters'
          );
        }

        const profitTableData = response.profit_table?.transactions || [];
        setProfitTable(response);
        localStorage.setItem(`profitTable_${accountId}`, JSON.stringify(response));

        setStats({
          totalProfitLoss: profitTableData.reduce((sum, tx) => sum + (tx.sell_price || 0), 0),
          totalPurchases: profitTableData.reduce((sum, tx) => sum + (tx.buy_price || 0), 0),
          totalPayouts: profitTableData.reduce((sum, tx) => sum + (tx.payout || 0), 0),
          numTransactions: profitTableData.length,
        });

        if (profitTableData.length === 0) {
          setError('No transactions found for the last 30 days.');
        }
      } catch (err) {
        console.error('Error fetching profit table:', err, err.stack);
        setError(err.message || 'Failed to load profit table data. Please try again.');
      } 
    };

    fetchProfitTable();

    // Poll every 30 seconds
    const interval = setInterval(fetchProfitTable, 30000);

    return () => clearInterval(interval);
  }, [accountId, sendAuthorizedRequest]);

  if (!user || isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  const percentageGrowth = stats.totalPurchases
    ? Math.min(((stats.totalProfitLoss / stats.totalPurchases) * 100).toFixed(2), 100)
    : 0;

  const readableSessionDuration = 'in the last 30 days';

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
          {error && (
            <Alert
              message="Error"
              description={error}
              type="error"
              showIcon
              style={{ marginBottom: 24 }}
            />
          )}
          <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
            <Col span={24}>
              <Card bordered={false} style={{ background: 'transparent', boxShadow: 'none' }}>
                <Title level={2} style={{ color: '#6C5CE7', marginBottom: 8 }}>
                  Welcome back, {user?.fullname || 'Trader'}!
                </Title>
                <Text type="secondary">Here's your trading overview for the last 30 days</Text>
              </Card>
            </Col>
          </Row>
          <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} md={6}>
              <Card
                hoverable
                style={{
                  borderTop: '4px solid #6C5CE7',
                  borderRadius: 16,
                  boxShadow: '0 4px 12px rgba(108, 92, 231, 0.1)',
                }}
              >
                <Statistic
                  title={
                    <Space>
                      <WalletOutlined style={{ color: '#6C5CE7' }} />
                      <Text>Account Balance</Text>
                    </Space>
                  }
                  value={balance}
                  precision={2}
                  prefix="$"
                  valueStyle={{ fontSize: 24, fontWeight: 600 }}
                />
                <Progress
                  percent={balance ? (balance / (balance + stats.totalPurchases)) * 100 : 0}
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
                  boxShadow: '0 4px 12px rgba(0, 206, 255, 0.1)',
                }}
              >
                <Statistic
                  title={
                    <Space>
                      <SwapOutlined style={{ color: '#00CEFF' }} />
                      <Text>Total Purchases</Text>
                    </Space>
                  }
                  value={stats.totalPurchases}
                  precision={2}
                  prefix="$"
                  valueStyle={{ fontSize: 24, fontWeight: 600 }}
                />
                <Progress
                  percent={stats.totalPurchases ? (stats.totalPurchases / (stats.totalPurchases + balance)) * 100 : 0}
                  status="normal"
                  showInfo={false}
                  strokeColor="#00CEFF"
                  trailColor="#E8FAFF"
                />
                <Text type="secondary">
                  {stats.numTransactions} transactions {readableSessionDuration}
                </Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card
                hoverable
                style={{
                  borderTop: '4px solid #3f8600',
                  borderRadius: 16,
                  boxShadow: '0 4px 12px rgba(63, 134, 0, 0.1)',
                }}
              >
                <Statistic
                  title={
                    <Space>
                      <ArrowUpOutlined style={{ color: '#3f8600' }} />
                      <Text>Profit Growth</Text>
                    </Space>
                  }
                  value={stats.totalProfitLoss}
                  precision={2}
                  prefix="$"
                  valueStyle={{ color: '#3f8600', fontSize: 24, fontWeight: 600 }}
                />
                <Progress
                  percent={percentageGrowth}
                  status={percentageGrowth >= 0 ? 'active' : 'exception'}
                  showInfo={false}
                  strokeColor={percentageGrowth >= 0 ? '#3f8600' : '#FF7675'}
                  trailColor={percentageGrowth >= 0 ? '#E6FFED' : '#FFEEED'}
                />
                <Text type="secondary">
                  {percentageGrowth}% Growth {readableSessionDuration}
                </Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card
                hoverable
                style={{
                  borderTop: '4px solid #FF7675',
                  borderRadius: 16,
                  boxShadow: '0 4px 12px rgba(255, 118, 117, 0.1)',
                }}
              >
                <Statistic
                  title={
                    <Space>
                      <LineChartOutlined style={{ color: '#FF7675' }} />
                      <Text>Total Payouts</Text>
                    </Space>
                  }
                  value={stats.totalPayouts}
                  precision={2}
                  prefix="$"
                  valueStyle={{ color: '#FF7675', fontSize: 24, fontWeight: 600 }}
                />
                <Progress
                  percent={stats.totalPayouts ? (stats.totalPayouts / (stats.totalPayouts + stats.totalPurchases)) * 100 : 0}
                  status="exception"
                  showInfo={false}
                  strokeColor="#FF7675"
                  trailColor="#FFEEED"
                />
                <Text type="secondary">
                  {stats.numTransactions} transactions {readableSessionDuration}
                </Text>
              </Card>
            </Col>
          </Row>
          <Row gutter={[24, 24]}>
            <Col span={24}>
              <Card
                title={
                  <Space>
                    <LineChartOutlined style={{ color: '#6C5CE7' }} />
                    <Text strong style={{ fontSize: 18 }}>
                      Volatility Index Monitor
                    </Text>
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
                    <div
                      style={{
                        height: 150,
                        background: 'linear-gradient(90deg, #6C5CE710, #6C5CE705)',
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text type="secondary">Winning trades chart (TBD)</Text>
                    </div>
                  </Col>
                  <Col xs={24} md={12}>
                    <Title level={5} style={{ color: '#FF7675' }}>
                      <FallOutlined /> Recent Losing Trades
                    </Title>
                    <div
                      style={{
                        height: 150,
                        background: 'linear-gradient(90deg, #FF767510, #FF767505)',
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text type="secondary">Losing trades chart (TBD)</Text>
                    </div>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
          <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
            <Col xs={12} sm={6} md={6}>
              <Card
                hoverable
                style={{
                  textAlign: 'center',
                  borderRadius: 12,
                  border: '1px solid #6C5CE720',
                  background: '#6C5CE710',
                }}
              >
                <RiseOutlined style={{ fontSize: 24, color: '#6C5CE7' }} />
                <Title level={5} style={{ marginTop: 8, fontSize: 14, color: '#6C5CE7' }}>
                  Rise/Fall
                </Title>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Predict market direction
                </Text>
              </Card>
            </Col>
            <Col xs={12} sm={6} md={6}>
              <Card
                hoverable
                style={{
                  textAlign: 'center',
                  borderRadius: 12,
                  border: '1px solid #00CEFF20',
                  background: '#00CEFF10',
                }}
              >
                <NumberOutlined style={{ fontSize: 24, color: '#00CEFF' }} />
                <Title level={5} style={{ marginTop: 8, fontSize: 14, color: '#00CEFF' }}>
                  Even/Odd
                </Title>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Bet on digit outcomes
                </Text>
              </Card>
            </Col>
            <Col xs={12} sm={6} md={6}>
              <Card
                hoverable
                style={{
                  textAlign: 'center',
                  borderRadius: 12,
                  border: '1px solid #FF767520',
                  background: '#FF767510',
                }}
              >
                <ArrowUpOutlined style={{ fontSize: 24, color: '#FF7675' }} />
                <Title level={5} style={{ marginTop: 8, fontSize: 14, color: '#FF7675' }}>
                  Over/Under
                </Title>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Set your price barriers
                </Text>
              </Card>
            </Col>
            <Col xs={12} sm={6} md={6}>
              <Card
                hoverable
                style={{
                  textAlign: 'center',
                  borderRadius: 12,
                  border: '1px solid #3f860020',
                  background: '#3f860010',
                }}
              >
                <SwapOutlined style={{ fontSize: 24, color: '#3f8600' }} />
                <Title level={5} style={{ marginTop: 8, fontSize: 14, color: '#3f8600' }}>
                  Matches/Differs
                </Title>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Predict the digit outcomes
                </Text>
              </Card>
            </Col>
          </Row>
        </Content>
      </div>
    </ConfigProvider>
  );
};

export default DashboardMainContent;