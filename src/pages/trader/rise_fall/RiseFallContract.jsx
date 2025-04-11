import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Card, 
  Radio, 
  InputNumber, 
  Row, 
  Col, 
  Space, 
  Typography,
  Select,
  Statistic,
  Progress,
  Divider,
  Tooltip,
  Alert,
  ConfigProvider,
  theme,
  Tabs,
  Badge,
  Tag
} from 'antd';
import { 
  ArrowUpOutlined,
  ArrowDownOutlined,
  DollarOutlined,
  LineChartOutlined,
  RiseOutlined,
  InfoCircleOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { useUser } from '../../../context/AuthContext';
import RecentTrades from '../../../components/RecentTrades';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const RiseFallTrader = () => {
  const { user } = useUser(); 
  const { token } = theme.useToken();
  const [durationType, setDurationType] = useState('ticks');
  const [duration, setDuration] = useState(5);
  const [minutes, setMinutes] = useState(1);
  const [basis, setBasis] = useState('stake');
  const [symbol, setSymbol] = useState('R_10');
  const [amount, setAmount] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [payout, setPayout] = useState(0);
  const [activeTab, setActiveTab] = useState('trade');

  // Calculate payout based on amount and symbol
  useEffect(() => {
    const payoutMultiplier = symbol.includes('10') ? 0.95 : 
                          symbol.includes('25') ? 0.92 :
                          symbol.includes('50') ? 0.89 : 0.85;
    setPayout((amount * (1 + payoutMultiplier)).toFixed(2));
  }, [amount, symbol]);

  const handleSubmit = (contractType) => {
    setIsSubmitting(true);

    const contractData = {
      buy: 1,
      price: amount,
      parameters: {
        amount: amount,
        basis: basis,
        contract_type: contractType === 'rise' ? 'CALL' : 'PUT',
        currency: user?.currency || 'USD',
        duration: durationType === 'ticks' ? duration : minutes,
        duration_unit: durationType === 'ticks' ? 't' : 'm',
        symbol: symbol,
      },
      loginid: user?.loginid,
    };

    console.log('Sending contract:', contractData);
  };

  const volatilityOptions = [
    { value: 'R_10', label: 'Volatility 10 Index', payout: '95%' },
    { value: '1HZ10V', label: 'Volatility 10 (1s) Index', payout: '95%' },
    { value: 'R_25', label: 'Volatility 25 Index', payout: '92%' },
    { value: '1HZ25V', label: 'Volatility 25 (1s) Index', payout: '92%' },
    { value: 'R_50', label: 'Volatility 50 Index', payout: '89%' },
    { value: '1HZ50V', label: 'Volatility 50 (1s) Index', payout: '89%' },
    { value: 'R_75', label: 'Volatility 75 Index', payout: '87%' },
    { value: '1HZ75V', label: 'Volatility 75 (1s) Index', payout: '87%' },
    { value: 'R_100', label: 'Volatility 100 Index', payout: '85%' },
    { value: '1HZ100V', label: 'Volatility 100 (1s) Index', payout: '85%' }
  ];

  return (
    <ConfigProvider
      theme={{
        components: {
          Card: {
            borderRadiusLG: 16,
          },
          Button: {
            colorPrimary: token.colorPrimary,
            colorPrimaryHover: `${token.colorPrimary}dd`,
          }
        }
      }}
    >
      <Row gutter={[24, 24]}>
        <Col xs={24} md={16}>
          <Card
            title={
              <Space>
                <RiseOutlined style={{ color: token.colorPrimary }} />
                <Title level={4} style={{ margin: 0, color: token.colorPrimary }}>Rise/Fall Contract</Title>
              </Space>
            }
            style={{ 
              borderRadius: 16,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
            }}
            extra={
              <Tooltip title="Predict whether the price will rise or fall">
                <InfoCircleOutlined style={{ color: token.colorPrimary }} />
              </Tooltip>
            }
          >
            <Tabs activeKey={activeTab} onChange={setActiveTab}>
              <TabPane tab="Trade" key="trade">
                <Space direction="vertical" size={24} style={{ width: '100%', marginTop: 16 }}>
                  {/* Symbol Selection */}
                  <div>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>Volatility Index</Text>
                    <Select
                      value={symbol}
                      onChange={setSymbol}
                      style={{ width: '100%' }}
                      placeholder="Select a volatility index"
                      optionLabelProp="label"
                    >
                      {volatilityOptions.map(option => (
                        <Option 
                          key={option.value} 
                          value={option.value}
                          label={
                            <Space>
                              <span>{option.label}</span>
                              <Tag color={token.colorPrimary}>{option.payout} payout</Tag>
                            </Space>
                          }
                        >
                          <Space>
                            <span>{option.label}</span>
                            <Tag color={token.colorPrimary} style={{ marginLeft: 'auto' }}>
                              {option.payout} payout
                            </Tag>
                          </Space>
                        </Option>
                      ))}
                    </Select>
                  </div>

                  {/* Duration Type Selection */}
                  <div>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>Duration Type</Text>
                    <Radio.Group 
                      value={durationType} 
                      onChange={(e) => setDurationType(e.target.value)}
                      buttonStyle="solid"
                      style={{ width: '100%' }}
                    >
                      <Radio.Button value="ticks" style={{ width: '50%', textAlign: 'center' }}>
                        Ticks
                      </Radio.Button>
                      <Radio.Button value="minutes" style={{ width: '50%', textAlign: 'center' }}>
                        Minutes
                      </Radio.Button>
                    </Radio.Group>
                  </div>

                  {/* Duration Input - Ticks or Minutes based on selection */}
                  {durationType === 'ticks' ? (
                    <div>
                      <Text strong style={{ display: 'block', marginBottom: 8 }}>Duration (Ticks)</Text>
                      <Row justify="space-between" style={{ padding: '0 10px' }}>
                        {[...Array(10)].map((_, i) => {
                          const tick = i + 1;
                          const isActive = tick === duration;
                          const IconComponent = isActive ? CheckCircleOutlined : CloseCircleOutlined;

                          return (
                            <Col key={tick}>
                              <Tooltip title={`${tick} tick${tick > 1 ? 's' : ''}`}>
                                <IconComponent
                                  style={{
                                    fontSize: 24,
                                    color: isActive ? token.colorPrimary : token.colorBorder,
                                    cursor: 'pointer',
                                  }}
                                  onClick={() => setDuration(tick)}
                                />
                              </Tooltip>
                            </Col>
                          );
                        })}
                      </Row>
                      <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginTop: 8 }}>
                        Selected: {duration} tick{duration > 1 ? 's' : ''}
                      </Text>
                    </div>
                  ) : (
                    <div>
                      <Text strong style={{ display: 'block', marginBottom: 8 }}>Duration (Minutes)</Text>
                      <InputNumber
                        min={1}
                        max={60}
                        value={minutes}
                        onChange={setMinutes}
                        style={{ width: '100%' }}
                        addonAfter="minutes"
                        prefix={<ClockCircleOutlined />}
                      />
                    </div>
                  )}

                  {/* Basis Selection */}
                  <div>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>Basis</Text>
                    <Radio.Group 
                      value={basis} 
                      onChange={(e) => setBasis(e.target.value)} 
                      buttonStyle="solid"
                      style={{ width: '100%' }}
                    >
                      <Radio.Button value="stake" style={{ width: '50%', textAlign: 'center' }}>
                        <DollarOutlined style={{ marginRight: 8 }} />
                        Stake
                      </Radio.Button>
                      <Radio.Button value="payout" style={{ width: '50%', textAlign: 'center' }}>
                        <LineChartOutlined style={{ marginRight: 8 }} />
                        Payout
                      </Radio.Button>
                    </Radio.Group>
                  </div>

                  {/* Amount Input */}
                  <div>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>
                      Amount ({user?.currency || 'USD'})
                    </Text>
                    <InputNumber
                      min={1}
                      max={user?.balance || 1000}
                      value={amount}
                      onChange={setAmount}
                      style={{ width: '100%' }}
                      precision={2}
                      prefix={<DollarOutlined />}
                      step={5}
                    />
                    <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                      Available balance: {user?.balance?.toFixed(2) || '0.00'} {user?.currency || 'USD'}
                    </Text>
                  </div>

                  {/* Payout Information */}
                  <div>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Statistic
                          title="Potential Payout"
                          value={payout}
                          precision={2}
                          prefix={<ArrowUpOutlined style={{ color: token.colorSuccess }} />}
                          valueStyle={{ color: token.colorSuccess }}
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic
                          title="Potential Loss"
                          value={amount}
                          precision={2}
                          prefix={<ArrowDownOutlined style={{ color: token.colorError }} />}
                          valueStyle={{ color: token.colorError }}
                        />
                      </Col>
                    </Row>
                    <Progress
                      percent={((payout - amount) / amount * 100).toFixed(0)}
                      strokeColor={token.colorSuccess}
                      trailColor={token.colorError}
                      format={percent => `${percent}% return`}
                      style={{ marginTop: 16 }}
                    />
                  </div>

                  {/* Action Buttons */}
                  <Row gutter={16}>
                    <Col span={12}>
                      <Button
                        type="primary"
                        size="large"
                        block
                        icon={<ArrowUpOutlined />}
                        style={{ 
                          background: '#722ed1',
                          borderColor: '#722ed1',
                          height: 48
                        }}
                        onClick={() => handleSubmit('rise')}
                        loading={isSubmitting}
                        disabled={isSubmitting || !user}
                      >
                        Rise (CALL)
                      </Button>
                    </Col>
                    <Col span={12}>
                      <Button
                        type="primary"
                        size="large"
                        block
                        icon={<ArrowDownOutlined />}
                        style={{ height: 48 }}
                        onClick={() => handleSubmit('fall')}
                        loading={isSubmitting}
                        disabled={isSubmitting || !user}
                      >
                        Fall (PUT)
                      </Button>
                    </Col>
                  </Row>
                </Space>
              </TabPane>
              <TabPane tab="Analysis" key="analysis">
                <div style={{ padding: '16px 0' }}>
                  <Text strong>Market Analysis</Text>
                  <Divider style={{ margin: '12px 0' }} />
                  <Text type="secondary">Coming soon - historical performance and trends</Text>
                </div>
              </TabPane>
            </Tabs>
          </Card>
        </Col>

        {/* Recent Trades */}
        <Col xs={24} md={8}>
          <RecentTrades />
        </Col>
      </Row>
    </ConfigProvider>
  );
};

export default RiseFallTrader;