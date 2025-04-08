import React, { useState } from 'react';
import { 
  Layout, 
  Menu, 
  Card, 
  Row, 
  Col, 
  Typography, 
  Statistic, 
  Table, 
  Tag,
  Progress,
  Space,
  Button,
  Avatar,
  Badge,
  Divider,
  Dropdown,
  List,
  Tabs,
  DatePicker,
  Select
} from 'antd';
import {
  DashboardOutlined,
  LineChartOutlined,
  WalletOutlined,
  ApiOutlined,
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  DollarOutlined
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

// Sample data
const portfolioData = [
  { id: 1, asset: 'EUR/USD', type: 'Forex', amount: 2500, change: 2.3, status: 'active' },
  { id: 2, asset: 'BTC/USD', type: 'Crypto', amount: 1800, change: -1.2, status: 'active' },
  { id: 3, asset: 'Apple Inc', type: 'Stocks', amount: 3200, change: 5.7, status: 'active' },
];

const recentTransactions = [
  { id: 1, asset: 'EUR/USD', type: 'Buy', amount: 500, time: '10:30 AM', status: 'completed' },
  { id: 2, asset: 'BTC/USD', type: 'Sell', amount: 300, time: 'Yesterday', status: 'completed' },
  { id: 3, asset: 'Volatility 75', type: 'Buy', amount: 200, time: 'Mar 15', status: 'pending' },
];

const marketData = [
  { symbol: 'EUR/USD', price: 1.0824, change: 0.0021, changePercent: 0.19 },
  { symbol: 'GBP/USD', price: 1.2632, change: -0.0015, changePercent: -0.12 },
  { symbol: 'BTC/USD', price: 42356.12, change: 1254.32, changePercent: 3.05 },
];

const Dashboard = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('portfolio');

  const userMenu = (
    <Menu>
      <Menu.Item key="profile" icon={<UserOutlined />}>Profile</Menu.Item>
      <Menu.Item key="settings" icon={<ApiOutlined />}>API Settings</Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" icon={<LogoutOutlined />}>Logout</Menu.Item>
    </Menu>
  );

  const renderChange = (value) => {
    const isPositive = value >= 0;
    return (
      <Text type={isPositive ? 'success' : 'danger'}>
        {isPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
        {Math.abs(value)}%
      </Text>
    );
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        width={250}
        style={{ background: '#fff', boxShadow: '2px 0 8px 0 rgba(29,35,41,0.05)' }}
      >
        <div style={{ padding: collapsed ? '16px 8px' : '16px 24px', textAlign: collapsed ? 'center' : 'left' }}>
          <Space>
            <Avatar src="/logo.png" size="large" />
            {!collapsed && <Text strong style={{ fontSize: 16 }}>Deriv API</Text>}
          </Space>
        </div>
        <Menu
          theme="light"
          mode="inline"
          defaultSelectedKeys={['dashboard']}
          style={{ borderRight: 0 }}
        >
          <Menu.Item key="dashboard" icon={<DashboardOutlined />}>
            Dashboard
          </Menu.Item>
          <Menu.Item key="trading" icon={<LineChartOutlined />}>
            Trading
          </Menu.Item>
          <Menu.Item key="wallet" icon={<WalletOutlined />}>
            Wallet
          </Menu.Item>
          <Menu.Item key="api" icon={<ApiOutlined />}>
            API Management
          </Menu.Item>
        </Menu>
      </Sider>
      
      <Layout>
        <Header style={{ 
          padding: 0, 
          background: '#fff', 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 1px 4px 0 rgba(0,21,41,0.12)'
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ width: 64, height: 64 }}
          />
          <Space size="large" style={{ marginRight: 24 }}>
            <Badge count={5}>
              <Button type="text" icon={<BellOutlined />} size="large" />
            </Badge>
            <Dropdown overlay={userMenu} placement="bottomRight">
              <Space style={{ cursor: 'pointer', padding: '0 16px' }}>
                <Avatar icon={<UserOutlined />} />
                {!collapsed && <Text strong>John Doe</Text>}
              </Space>
            </Dropdown>
          </Space>
        </Header>

        <Content style={{ margin: '24px 16px', padding: 24, background: '#f0f2f5' }}>
          <Row gutter={[24, 24]}>
            <Col span={24}>
              <Title level={3}>Dashboard</Title>
            </Col>
            
            {/* Stats Cards */}
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Account Balance"
                  value={112893}
                  precision={2}
                  prefix={<DollarOutlined />}
                />
                <Progress percent={68} status="active" showInfo={false} />
                <Text type="secondary">+12.5% from last month</Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Open Positions"
                  value={8}
                />
                <Progress percent={45} status="normal" showInfo={false} />
                <Text type="secondary">3 long, 5 short</Text>
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
                  title="API Calls"
                  value={1242}
                  suffix="/ 5000 daily"
                />
                <Progress percent={25} status="exception" showInfo={false} />
                <Text type="secondary">42 calls in last hour</Text>
              </Card>
            </Col>
            
            {/* Main Content */}
            <Col span={24}>
              <Card>
                <Tabs activeKey={activeTab} onChange={setActiveTab}>
                  <TabPane tab="Portfolio" key="portfolio">
                    <Table
                      columns={[
                        { title: 'Asset', dataIndex: 'asset', key: 'asset' },
                        { title: 'Type', dataIndex: 'type', key: 'type' },
                        { 
                          title: 'Amount', 
                          dataIndex: 'amount', 
                          key: 'amount',
                          render: (value) => `$${value.toLocaleString()}`
                        },
                        { 
                          title: '24h Change', 
                          dataIndex: 'change', 
                          key: 'change',
                          render: renderChange
                        },
                        { 
                          title: 'Status', 
                          dataIndex: 'status', 
                          key: 'status',
                          render: (status) => (
                            <Tag color={status === 'active' ? 'green' : 'orange'}>
                              {status.toUpperCase()}
                            </Tag>
                          )
                        },
                      ]}
                      dataSource={portfolioData}
                      rowKey="id"
                      pagination={false}
                    />
                  </TabPane>
                  <TabPane tab="Transactions" key="transactions">
                    <List
                      itemLayout="horizontal"
                      dataSource={recentTransactions}
                      renderItem={item => (
                        <List.Item
                          actions={[
                            <Tag color={item.status === 'completed' ? 'green' : 'orange'}>
                              {item.status}
                            </Tag>
                          ]}
                        >
                          <List.Item.Meta
                            avatar={<Avatar icon={<DollarOutlined />} />}
                            title={`${item.type} ${item.asset}`}
                            description={`$${item.amount} • ${item.time}`}
                          />
                        </List.Item>
                      )}
                    />
                  </TabPane>
                  <TabPane tab="Market Data" key="market">
                    <Table
                      columns={[
                        { title: 'Symbol', dataIndex: 'symbol', key: 'symbol' },
                        { 
                          title: 'Price', 
                          dataIndex: 'price', 
                          key: 'price',
                          render: (value) => `$${value.toLocaleString()}`
                        },
                        { 
                          title: 'Change', 
                          dataIndex: 'change', 
                          key: 'change',
                          render: (value) => (
                            <Text type={value >= 0 ? 'success' : 'danger'}>
                              {value >= 0 ? '+' : ''}{value.toFixed(4)}
                            </Text>
                          )
                        },
                        { 
                          title: 'Change %', 
                          dataIndex: 'changePercent', 
                          key: 'changePercent',
                          render: renderChange
                        },
                        {
                          title: 'Action',
                          key: 'action',
                          render: () => (
                            <Space>
                              <Button size="small">Buy</Button>
                              <Button size="small" danger>Sell</Button>
                            </Space>
                          )
                        }
                      ]}
                      dataSource={marketData}
                      rowKey="symbol"
                      pagination={false}
                    />
                  </TabPane>
                </Tabs>
              </Card>
            </Col>
            
            {/* API Console */}
            <Col xs={24} md={12}>
              <Card title="API Console">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Select defaultValue="ticks" style={{ width: '100%' }}>
                    <Option value="ticks">Get Ticks</Option>
                    <Option value="ohlc">Get OHLC</Option>
                    <Option value="balance">Get Balance</Option>
                    <Option value="buy">Buy Contract</Option>
                  </Select>
                  <RangePicker showTime style={{ width: '100%' }} />
                  <Input.TextArea rows={4} placeholder="Enter parameters as JSON..." />
                  <Button type="primary" block>Execute API Call</Button>
                </Space>
              </Card>
            </Col>
            
            {/* Quick Trade */}
            <Col xs={24} md={12}>
              <Card title="Quick Trade">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Select defaultValue="EUR/USD" style={{ width: '100%' }}>
                    <Option value="EUR/USD">EUR/USD</Option>
                    <Option value="GBP/USD">GBP/USD</Option>
                    <Option value="BTC/USD">BTC/USD</Option>
                  </Select>
                  <Input placeholder="Amount" prefix="$" />
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Button type="primary" danger style={{ width: '48%' }}>Sell</Button>
                    <Button type="primary" style={{ width: '48%' }}>Buy</Button>
                  </Space>
                </Space>
              </Card>
            </Col>
          </Row>
        </Content>
      </Layout>
    </Layout>
  );
};

export default Dashboard;