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
  Descriptions,
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
import '../../assets/css/pages/dashboard/DashboardMainContent.css'; 
import Notification from '../../utils/Notification';

const { Title, Text } = Typography;
const { Content } = Layout;

const DashboardMainContent = () => {
  const { user, balance, activeAccount, authLoading, sendAuthorizedRequest } = useUser();
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({
    totalProfitLoss: 0,
    totalPurchases: 0,
    totalPayouts: 0,
    numTransactions: 0,
  });
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({
    type: '',
    content: '',
    trigger: false,
  });
  const [loading] = useState(false);
  const accountId = activeAccount?.loginid;
  const isLoading = authLoading || loading;
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const showNotification = (type, content) => {
    setNotification({ type, content, trigger: true });
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, trigger: false }));
    }, 500);
  };
  useEffect(() => {
    if (accountId) {
      const cachedProfitTable = localStorage.getItem(`profitTable_${accountId}`);
      if (cachedProfitTable) {
        const parsedData = JSON.parse(cachedProfitTable);
        const transactions = parsedData?.profit_table?.transactions || [];
        setTransactions(transactions);
        setStats({
          totalProfitLoss: transactions.reduce((sum, tx) => sum + (tx.profit_loss || 0), 0),
          totalPurchases: transactions.reduce((sum, tx) => sum + (tx.buy_price || 0), 0),
          totalPayouts: transactions.reduce((sum, tx) => sum + (tx.payout || 0), 0),
          numTransactions: transactions.length,
        });
      }
    }
  }, [accountId]);
  useEffect(() => {
    if (!accountId) return;
    const fetchProfitTable = async () => {
      setError(null);
      const now = new Date();
      const dateTo = Math.floor(now.getTime() / 1000);
      const dateFrom = dateTo - 30 * 24 * 60 * 60;
      const payload = {
        profit_table: 1,
        description: 1,
        sort: 'DESC',
        date_from: dateFrom,
        date_to: dateTo,
        limit: 100,
      };
      try {
        const response = await sendAuthorizedRequest(payload);
        if (response.error) {
          showNotification('error', response.error.message || 'Failed to fetch profit table');
          throw new Error(response.error.message);
        }
        const profitTableData = response.profit_table?.transactions || [];
        setTransactions(profitTableData);
        localStorage.setItem(`profitTable_${accountId}`, JSON.stringify(response));
        setStats({
          totalProfitLoss: profitTableData.reduce((sum, tx) => sum + (tx.sell_price || 0), 0),
          totalPurchases: profitTableData.reduce((sum, tx) => sum + (tx.buy_price || 0), 0),
          totalPayouts: profitTableData.reduce((sum, tx) => sum + (tx.payout || 0), 0),
          numTransactions: profitTableData.length,
        });
        showNotification('success', 'Profit table loaded successfully!');
        if (profitTableData.length === 0) {
          showNotification('warning', 'No transactions found for the last 30 days.');
        }
      } catch (err) {
        console.error('Error fetching profit table:', err, err.stack);
      }
    };
    fetchProfitTable();
    const interval = setInterval(fetchProfitTable, 30000);
    return () => clearInterval(interval);
  }, [accountId, sendAuthorizedRequest]);
  const latestLosingTrade = transactions
    .filter((tx) => tx.sell_price === 0)
    .sort((a, b) => b.sell_time - a.sell_time)[0];
  const latestWinningTrade = transactions
    .filter((tx) => tx.sell_price > 0)
    .sort((a, b) => b.sell_time - a.sell_time)[0];
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
      <div className="dashboard-container">
        <Content className="dashboard-content">
          <Notification
            type={notification.type}
            content={notification.content}
            trigger={notification.trigger}
          />
          {error && (
            <Alert
              message="Error"
              description={error}
              type="error"
              showIcon
              className="error-alert"
            />
          )}
          <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
            <Col span={24}>
              <Card className="welcome-card">
                <Title level={2} className="welcome-title">
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
                className="statistic-card"
                style={{
                  borderTop: '4px solid #6C5CE7',
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
                className="statistic-card"
                style={{
                  borderTop: '4px solid #00CEFF',
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
                className="statistic-card"
                style={{
                  borderTop: '4px solid #3f8600',
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
                className="statistic-card"
                style={{
                  borderTop: '4px solid #FF7675',
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
                className="volatility-card"
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
                    <Title level={5} className="recent-trade-title">
                      <RiseOutlined /> Recent Winning Trade
                    </Title>
                    <div className="trade-description">
                      {latestWinningTrade ? (
                        <Descriptions column={1} size="small">
                          <Descriptions.Item label="Contract Type">
                            {latestWinningTrade.contract_type}
                          </Descriptions.Item>
                          <Descriptions.Item label="Buying Price">
                            ${latestWinningTrade.buy_price.toFixed(2)}
                          </Descriptions.Item>
                          <Descriptions.Item label="Description">
                            {latestWinningTrade.longcode}
                          </Descriptions.Item>
                          <Descriptions.Item label="Payout">
                            ${latestWinningTrade.payout.toFixed(2)}
                          </Descriptions.Item>
                          <Descriptions.Item label="Time">
                            {formatTimestamp(latestWinningTrade.purchase_time)}
                          </Descriptions.Item>
                        </Descriptions>
                      ) : (
                        <Text type="secondary">No winning trades found.</Text>
                      )}
                    </div>
                  </Col>
                  <Col xs={24} md={12}>
                    <Title level={5} className="recent-trade-title">
                      <FallOutlined /> Recent Losing Trade
                    </Title>
                    <div className="trade-description">
                      {latestLosingTrade ? (
                        <Descriptions column={1} size="small">
                          <Descriptions.Item label="Contract Type">
                            {latestLosingTrade.contract_type}
                          </Descriptions.Item>
                          <Descriptions.Item label="Buying Price">
                            ${latestLosingTrade.buy_price.toFixed(2)}
                          </Descriptions.Item>
                          <Descriptions.Item label="Description">
                            {latestLosingTrade.longcode}
                          </Descriptions.Item>
                          <Descriptions.Item label="Payout">
                            ${latestLosingTrade.payout.toFixed(2)}
                          </Descriptions.Item>
                          <Descriptions.Item label="Time">
                            {formatTimestamp(latestLosingTrade.purchase_time)}
                          </Descriptions.Item>
                        </Descriptions>
                      ) : (
                        <Text type="secondary">No losing trades found.</Text>
                      )}
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
                className="card-hover"
                style={{
                  border: '1px solid #6C5CE720',
                  background: '#6C5CE710',
                }}
              >
                <RiseOutlined style={{ fontSize: 24, color: '#6C5CE7' }} />
                <Title level={5} className="card-title">
                  Rise/Fall
                </Title>
                <Text type="secondary" className="card-text">
                  Predict market direction
                </Text>
              </Card>
            </Col>
            <Col xs={12} sm={6} md={6}>
              <Card
                hoverable
                className="card-hover"
                style={{
                  border: '1px solid #00CEFF20',
                  background: '#00CEFF10',
                }}
              >
                <NumberOutlined style={{ fontSize: 24, color: '#00CEFF' }} />
                <Title level={5} className="card-title">
                  Even/Odd
                </Title>
                <Text type="secondary" className="card-text">
                  Bet on digit outcomes
                </Text>
              </Card>
            </Col>
            <Col xs={12} sm={6} md={6}>
              <Card
                hoverable
                className="card-hover"
                style={{
                  border: '1px solid #FF767520',
                  background: '#FF767510',
                }}
              >
                <ArrowUpOutlined style={{ fontSize: 24, color: '#FF7675' }} />
                <Title level={5} className="card-title">
                  Over/Under
                </Title>
                <Text type="secondary" className="card-text">
                  Set your price barriers
                </Text>
              </Card>
            </Col>
            <Col xs={12} sm={6} md={6}>
              <Card
                hoverable
                className="card-hover"
                style={{
                  border: '1px solid #3f860020',
                  background: '#3f860010',
                }}
              >
                <SwapOutlined style={{ fontSize: 24, color: '#3f8600' }} />
                <Title level={5} className="card-title">
                  Matches/Differs
                </Title>
                <Text type="secondary" className="card-text">
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