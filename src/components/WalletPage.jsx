import React, { useState} from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  Table, 
  Spin, 
  Input, 
  DatePicker, 
  Checkbox, 
  Empty,
  Statistic,
  Tabs,
  Tag,
  Space,
  Divider,
  ConfigProvider,
  theme,
  Button,
  Select,
  message
} from 'antd';
import { 
  SearchOutlined,
  FilterOutlined,
  DownloadOutlined,
  DollarOutlined,
  TransactionOutlined,
  HistoryOutlined,
  InfoCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
} from '@ant-design/icons';
import { useUser } from '../context/AuthContext';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;
const { Option } = Select;

const WalletPage = () => {
  const { user, realityCheck, statement, transactions, loading } = useUser();
  const { token } = theme.useToken();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState(['Date', 'Type', 'Amount', 'Description']);
  const [activeTab, setActiveTab] = useState('statement');
  const [exportFormat, setExportFormat] = useState('csv');

  // Format date to human-readable form
  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  // Format currency with proper symbol
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Filtered Statement Data
  const filteredStatement = statement?.statement?.transactions?.filter((item) => {
    const transactionDate = new Date(item.purchase_time * 1000);
    const matchesSearch = item.longcode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDateRange =
      (!dateRange[0] || transactionDate >= dateRange[0]) &&
      (!dateRange[1] || transactionDate <= dateRange[1]);
    return matchesSearch && matchesDateRange;
  }) || [];

  // Statement Table Columns
  const statementColumns = [
    {
      title: 'Date',
      dataIndex: 'purchase_time',
      key: 'purchase_time',
      render: (timestamp) => formatDate(timestamp),
      sorter: (a, b) => a.purchase_time - b.purchase_time,
      visible: visibleColumns.includes('Date'),
    },
    {
      title: 'Type',
      dataIndex: 'action_type',
      key: 'action_type',
      render: (type) => (
        <Tag color={type === 'buy' ? token.colorSuccess : token.colorError}>
          {type.toUpperCase()}
        </Tag>
      ),
      visible: visibleColumns.includes('Type'),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => (
        <Text type={amount >= 0 ? 'success' : 'danger'}>
          {formatCurrency(amount)}
        </Text>
      ),
      sorter: (a, b) => a.amount - b.amount,
      visible: visibleColumns.includes('Amount'),
    },
    {
      title: 'Description',
      dataIndex: 'longcode',
      key: 'longcode',
      ellipsis: true,
      visible: visibleColumns.includes('Description'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'won' ? token.colorSuccess : 
                    status === 'lost' ? token.colorError : 
                    token.colorWarning}>
          {status?.toUpperCase() || 'PENDING'}
        </Tag>
      ),
      visible: visibleColumns.includes('Status'),
    }
  ].filter((col) => col.visible);

  // Transaction Table Columns
  const transactionColumns = [
    {
      title: 'Date',
      dataIndex: 'purchase_time',
      key: 'purchase_time',
      render: (timestamp) => formatDate(timestamp),
      sorter: (a, b) => a.purchase_time - b.purchase_time,
    },
    {
      title: 'Type',
      dataIndex: 'action',
      key: 'action',
      render: (type) => (
        <Tag color={type === 'deposit' ? token.colorSuccess : 
                    type === 'withdrawal' ? token.colorError : 
                    token.colorPrimary}>
          {type.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => (
        <Text type={amount >= 0 ? 'success' : 'danger'}>
          {formatCurrency(amount)}
        </Text>
      ),
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: 'Description',
      dataIndex: 'longcode',
      key: 'longcode',
      ellipsis: true,
    },
    {
      title: 'Reference',
      dataIndex: 'id',
      key: 'id',
      render: (id) => <Text code>{id?.substring(0, 8)}</Text>,
    }
  ];

  // Reality Check Table Columns
  const realityCheckColumns = [
    {
      title: 'Session Start',
      dataIndex: 'start_time',
      key: 'start_time',
      render: (timestamp) => formatDate(timestamp),
      sorter: (a, b) => a.start_time - b.start_time,
    },
    {
      title: 'Transactions',
      dataIndex: 'num_transactions',
      key: 'num_transactions',
      sorter: (a, b) => a.num_transactions - b.num_transactions,
    },
    {
      title: 'Purchases',
      dataIndex: 'total_purchases',
      key: 'total_purchases',
      render: (amount) => formatCurrency(amount),
      sorter: (a, b) => a.total_purchases - b.total_purchases,
    },
    {
      title: 'Profit/Loss',
      dataIndex: 'total_profit_loss',
      key: 'total_profit_loss',
      render: (amount) => (
        <Text type={amount >= 0 ? 'success' : 'danger'}>
          {formatCurrency(amount)}
        </Text>
      ),
      sorter: (a, b) => a.total_profit_loss - b.total_profit_loss,
    },
    {
      title: 'Duration',
      dataIndex: 'session_duration',
      key: 'session_duration',
      render: (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
      },
    }
  ];

  const handleExport = () => {
    message.info(`Exporting data as ${exportFormat.toUpperCase()}`);
    // Export logic would go here
  };

  return (
    <ConfigProvider
      theme={{
        components: {
          Card: {
            borderRadiusLG: 16,
          },
          Table: {
            headerBg: token.colorFillAlter,
            headerColor: token.colorTextHeading,
          }
        }
      }}
    >
      <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
        {/* Summary Cards */}
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={12} md={8}>
            <Card
              style={{ 
                borderRadius: 16,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
              }}
            >
              <Statistic
                title="Total Balance"
                value={user?.balance || 0}
                precision={2}
                prefix={<DollarOutlined />}
                valueStyle={{ color: token.colorPrimary }}
              />
              <Divider style={{ margin: '12px 0' }} />
              <Space>
                <ArrowUpOutlined style={{ color: token.colorSuccess }} />
                <Text type="secondary">Deposits: {formatCurrency(realityCheck?.reality_check?.total_deposits || 0)}</Text>
              </Space>
              <Space style={{ marginTop: 8 }}>
                <ArrowDownOutlined style={{ color: token.colorError }} />
                <Text type="secondary">Withdrawals: {formatCurrency(realityCheck?.reality_check?.total_withdrawals || 0)}</Text>
              </Space>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card
              style={{ 
                borderRadius: 16,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
              }}
            >
              <Statistic
                title="Total Transactions"
                value={realityCheck?.reality_check?.num_transactions || 0}
                prefix={<TransactionOutlined />}
              />
              <Divider style={{ margin: '12px 0' }} />
              <Space>
                <Text type="secondary">Today: {realityCheck?.reality_check?.today_transactions || 0}</Text>
              </Space>
              <Space style={{ marginTop: 8 }}>
                <Text type="secondary">This week: {realityCheck?.reality_check?.week_transactions || 0}</Text>
              </Space>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card
              style={{ 
                borderRadius: 16,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
              }}
            >
              <Statistic
                title="Net Profit/Loss"
                value={realityCheck?.reality_check?.total_profit_loss || 0}
                precision={2}
                prefix={<DollarOutlined />}
                valueStyle={{
                  color: (realityCheck?.reality_check?.total_profit_loss || 0) >= 0 
                    ? token.colorSuccess 
                    : token.colorError
                }}
              />
              <Divider style={{ margin: '12px 0' }} />
              <Space>
                <Text type="secondary">Win rate: {realityCheck?.reality_check?.win_rate || 0}%</Text>
              </Space>
              <Space style={{ marginTop: 8 }}>
                <Text type="secondary">Avg. profit: {formatCurrency(realityCheck?.reality_check?.avg_profit || 0)}</Text>
              </Space>
            </Card>
          </Col>
        </Row>

        {/* Search and Filter Section */}
        <Card
          style={{ 
            marginTop: 24,
            borderRadius: 16,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
          }}
        >
          <Row gutter={[24, 24]} align="middle">
            <Col xs={24} sm={12} md={8}>
              <Input
                placeholder="Search transactions..."
                prefix={<SearchOutlined />}
                onChange={(e) => setSearchTerm(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <RangePicker
                onChange={(dates) => setDateRange(dates)}
                style={{ width: '100%' }}
                suffixIcon={<FilterOutlined />}
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Space>
                <Select
                  value={exportFormat}
                  onChange={setExportFormat}
                  style={{ width: 120 }}
                >
                  <Option value="csv">CSV</Option>
                  <Option value="pdf">PDF</Option>
                  <Option value="excel">Excel</Option>
                </Select>
                <Button 
                  type="primary" 
                  icon={<DownloadOutlined />}
                  onClick={handleExport}
                >
                  Export
                </Button>
              </Space>
            </Col>
          </Row>

          {/* Customizable Columns */}
          <Divider orientation="left" style={{ margin: '16px 0' }}>
            <Text type="secondary">Visible Columns</Text>
          </Divider>
          <Checkbox.Group
            options={['Date', 'Type', 'Amount', 'Description', 'Status']}
            value={visibleColumns}
            onChange={(checkedValues) => setVisibleColumns(checkedValues)}
          />
        </Card>

        {/* Main Content Tabs */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          style={{ marginTop: 24 }}
          tabBarExtraContent={
            <Text type="secondary">
              Last updated: {new Date().toLocaleString()}
            </Text>
          }
        >
          <TabPane
            tab={
              <Space>
                <HistoryOutlined />
                Statement
              </Space>
            }
            key="statement"
          >
            <Card
              style={{ 
                borderRadius: 16,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
              }}
            >
              {loading ? (
                <Spin size="large" style={{ display: 'block', margin: '40px auto' }} />
              ) : filteredStatement.length ? (
                <Table
                  dataSource={filteredStatement}
                  columns={statementColumns}
                  rowKey="transaction_id"
                  expandable={{
                    expandedRowRender: (record) => (
                      <div style={{ padding: 16 }}>
                        <Space direction="vertical" size={8}>
                          <Text strong>Contract Details</Text>
                          <Text>ID: <Text code>{record.contract_id}</Text></Text>
                          <Text>Symbol: <Text code>{record.symbol}</Text></Text>
                          <Text>Entry: {formatCurrency(record.entry_value)}</Text>
                          <Text>Exit: {formatCurrency(record.exit_value)}</Text>
                        </Space>
                      </div>
                    ),
                    rowExpandable: (record) => record.contract_id,
                  }}
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total) => `Total ${total} transactions`,
                  }}
                  scroll={{ x: true }}
                />
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <Text type="secondary">No transactions match your filters</Text>
                  }
                />
              )}
            </Card>
          </TabPane>

          <TabPane
            tab={
              <Space>
                <TransactionOutlined />
                Transactions
              </Space>
            }
            key="transactions"
          >
            <Card
              style={{ 
                borderRadius: 16,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
              }}
            >
              {loading ? (
                <Spin size="large" style={{ display: 'block', margin: '40px auto' }} />
              ) : transactions?.transaction ? (
                <Table
                  dataSource={[transactions.transaction]}
                  columns={transactionColumns}
                  rowKey="transaction_id"
                  pagination={false}
                />
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <Text type="secondary">No recent transactions</Text>
                  }
                />
              )}
            </Card>
          </TabPane>

          <TabPane
            tab={
              <Space>
                <InfoCircleOutlined />
                Reality Check
              </Space>
            }
            key="reality"
          >
            <Card
              style={{ 
                borderRadius: 16,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
              }}
            >
              {loading ? (
                <Spin size="large" style={{ display: 'block', margin: '40px auto' }} />
              ) : realityCheck?.reality_check ? (
                <Table
                  dataSource={[realityCheck.reality_check]}
                  columns={realityCheckColumns}
                  rowKey="start_time"
                  pagination={false}
                />
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <Text type="secondary">No reality check data available</Text>
                  }
                />
              )}
            </Card>
          </TabPane>
        </Tabs>
      </div>
    </ConfigProvider>
  );
};

export default WalletPage;