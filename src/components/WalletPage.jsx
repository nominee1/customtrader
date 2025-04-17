import React, { useState, useEffect, useMemo } from 'react';
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
  DollarOutlined,
  HistoryOutlined,
  InfoCircleOutlined,
  SyncOutlined
} from '@ant-design/icons';
import { useUser } from '../context/AuthContext';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;
const { Option } = Select;

const WalletPage = () => {
  const { activeAccount, accountData, balance, loading: authLoading, sendAuthorizedRequest } = useUser();
  const { token } = theme.useToken();
  
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState(['Date', 'Type', 'Amount', 'Description']);
  const [activeTab, setActiveTab] = useState('statement');
  const [statements, setStatements] = useState([]);
  const [realityCheck, setRealityCheck] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statementCount, setStatementCount] = useState(0);

  // Derived state
  const accountId = activeAccount?.loginid;
  const isLoading = authLoading || loading;

  // Helper functions
  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Data fetching
  const fetchData = async () => {
    if (!accountId) return;
  
    setLoading(true);
    setError(null);
  
    try {
      const statementsRes = await sendAuthorizedRequest({ statement: 1, limit: 100, loginid: accountId });
  
      console.log('Statements Response:', statementsRes);

      setStatements(statementsRes?.statement?.transactions || []);
      setStatementCount(statementsRes?.statement?.count || 0);
      localStorage.setItem(`statements_${accountId}`, JSON.stringify(statementsRes?.statement?.transactions || []));
      
      const realityRes = await sendAuthorizedRequest({ reality_check: 1, loginid: accountId });
      console.log('Reality Check Response:', realityRes);
      setRealityCheck(realityRes?.reality_check || null);
      localStorage.setItem(`realityCheck_${accountId}`, JSON.stringify(realityRes?.reality_check || null));
    } catch (err) {
      console.error('Error fetching wallet data:', err);
      setError('Failed to load wallet data. Please try again.');
      message.error('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    if (accountId) {
      const cached = localStorage.getItem(`statements_${accountId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        setStatements(parsed);
        setStatementCount(parsed.length);
      }
      const cachedReality = localStorage.getItem(`realityCheck_${accountId}`);
      if (cachedReality) {
        setRealityCheck(JSON.parse(cachedReality));
      }
      fetchData(); // always fetch in background to refresh
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId]);

  // Filtered data
  const filteredStatements = useMemo(() => {
    if (!statements.length) return [];
    
    return statements.filter(item => {
      if (!item.purchase_time) return false;
      
      const transactionDate = new Date(item.purchase_time * 1000);
      const matchesSearch = searchTerm 
        ? item.longcode?.toLowerCase().includes(searchTerm.toLowerCase())
        : true;
      
      const matchesDateRange = dateRange.length === 2
        ? transactionDate >= dateRange[0] && transactionDate <= dateRange[1]
        : true;
      
      return matchesSearch && matchesDateRange;
    });
  }, [statements, searchTerm, dateRange]);

  // Table columns
  const statementColumns = useMemo(() => [
    {
      title: 'Date',
      dataIndex: 'purchase_time',
      key: 'purchase_time',
      render: formatDate,
      sorter: (a, b) => a.purchase_time - b.purchase_time,
      visible: visibleColumns.includes('Date'),
    },
    {
      title: 'Type',
      dataIndex: 'action_type',
      key: 'action_type',
      render: type => (
        <Tag color={type === 'buy' ? token.colorSuccess : token.colorError}>
          {type?.toUpperCase() || 'N/A'}
        </Tag>
      ),
      visible: visibleColumns.includes('Type'),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: amount => (
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
      title: 'Transaction ID',
      dataIndex: 'transaction_id',
      key: 'transaction_id',
      ellipsis: true,
      visible: visibleColumns.includes('Description'),
    },
    {
      title: 'payout',
      dataIndex: 'payout',
      key: 'payout',
      visible: visibleColumns.includes('Status'),
    }
  ].filter(col => col.visible), [visibleColumns, token]);

  const handleRefresh = () => {
    localStorage.removeItem(`lastFetchTime_${accountId}`);
    fetchData();
    message.success('Data refreshed');
  };

  // Summary card data
  const summaryData = useMemo(() => ({
    balance: activeAccount?.balance || 0,
    deposits: realityCheck?.total_deposits || 0,
    withdrawals: realityCheck?.total_withdrawals || 0,
    totalTransactions: statementCount || 0,
    todayTransactions: realityCheck?.today_transactions || 0,
    weekTransactions: realityCheck?.week_transactions || 0,
    profitLoss: realityCheck?.total_profit_loss || 0,
    winRate: realityCheck?.win_rate || 0,
    avgProfit: realityCheck?.avg_profit || 0,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [activeAccount, accountData, realityCheck]);

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
                value={balance}
                precision={2}
                prefix={<DollarOutlined />}
                valueStyle={{ color: token.colorPrimary }}
              />
              <Divider style={{ margin: '12px 0' }} />
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
                value={summaryData.totalTransactions}
                prefix={<HistoryOutlined />}
              />
              <Divider style={{ margin: '12px 0' }} />
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
                value={summaryData.profitLoss}
                precision={2}
                prefix={<DollarOutlined />}
                valueStyle={{
                  color: summaryData.profitLoss >= 0 
                    ? token.colorSuccess 
                    : token.colorError
                }}
              />
              <Divider style={{ margin: '12px 0' }} />
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
                disabled={isLoading}
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <RangePicker
                onChange={setDateRange}
                style={{ width: '100%' }}
                suffixIcon={<FilterOutlined />}
                disabled={isLoading}
              />
            </Col>
          </Row>

          {/* Customizable Columns */}
          <Divider orientation="left" style={{ margin: '16px 0' }}>
            <Text type="secondary">Visible Columns</Text>
          </Divider>
          <Checkbox.Group
            options={['Date', 'Type', 'Amount', 'Description', 'Status']}
            value={visibleColumns}
            onChange={setVisibleColumns}
            disabled={isLoading}
          />
        </Card>

        {/* Main Content Tabs */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          style={{ marginTop: 24 }}
          tabBarExtraContent={
            <Space>
              <Text type="secondary">
                Last updated: {new Date().toLocaleString()}
              </Text>
              <Button 
                size="small" 
                icon={<SyncOutlined spin={loading} />} 
                onClick={handleRefresh}
              />
            </Space>
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
              {isLoading ? (
                <Spin size="large" style={{ display: 'block', margin: '40px auto' }} />
              ) : error ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <Text type="danger">{error}</Text>
                  }
                />
              ) : filteredStatements.length ? (
                <Table
                  dataSource={filteredStatements}
                  columns={statementColumns}
                  rowKey="transaction_id"
                  expandable={{
                    expandedRowRender: record => (
                      <div style={{ padding: 16 }}>
                        <Space direction="vertical" size={8}>
                          <Text strong>Contract Details</Text>
                          <Text>ID: <Text code>{record.contract_id || 'N/A'}</Text></Text>
                          <Text>Symbol: <Text code>{record.symbol || 'N/A'}</Text></Text>
                          <Text>Entry: {formatCurrency(record.entry_value || 0)}</Text>
                          <Text>Exit: {formatCurrency(record.exit_value || 0)}</Text>
                        </Space>
                      </div>
                    ),
                    rowExpandable: record => !!record.contract_id,
                  }}
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: total => `Total ${total} transactions`,
                  }}
                  scroll={{ x: true }}
                />
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <Text type="secondary">No transactions found</Text>
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