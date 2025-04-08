import React, { useState } from 'react';
import { 
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
  List,
  Tabs,
  DatePicker,
  Input,
  Layout,
  Select,
  Avatar
} from 'antd';
import {
  DollarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
} from '@ant-design/icons';
import { 
  portfolioData,
  recentTransactions,
  marketData
} from './data/DashboardData';
import { useUser } from '../../context/AuthContext';

const { Title, Text } = Typography;
const { Option } = Select;
const { Content } = Layout;
const { RangePicker } = DatePicker;

const DashboardMainContent = () => {
  const [activeTab, setActiveTab] = useState('portfolio');
  const { user } = useUser();

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
    <div>
      <Content style={{ margin: '24px 16px', padding: 24, background: '#fff' }}>
          <Row gutter={[24, 24]}>
            <Col span={24}>
              <Title level={3}>Welcome {user?.fullname|| "User"}</Title>
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
                <Tabs
                  activeKey={activeTab}
                  onChange={setActiveTab}
                  items={[
                    {
                      key: 'portfolio',
                      label: 'Portfolio',
                      children: (
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
                      ),
                    },
                    {
                      key: 'transactions',
                      label: 'Transactions',
                      children: (
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
                      ),
                    },
                    {
                      key: 'market',
                      label: 'Market Data',
                      children: (
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
                      ),
                    },
                  ]}
                />
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
    </div>
  );
};

export default DashboardMainContent;