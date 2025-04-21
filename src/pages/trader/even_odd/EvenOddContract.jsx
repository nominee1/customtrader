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
  Badge,
  Tooltip,
  Alert,
  ConfigProvider,
  theme,
  Tag,
  Spin
} from 'antd';
import { 
  NumberOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import { useUser } from '../../../context/AuthContext';
import { useContracts } from '../../../context/ContractsContext';
import RecentTrades from '../../../components/RecentTrades';
import RequestIdGenerator from '../../../services/uniqueIdGenerator'; 
import Notification from '../../../utils/Notification';

const { Title, Text } = Typography;
const { Option } = Select;

const EvenOddContract = () => {
  const { user, sendAuthorizedRequest, isAuthorized, loading, error } = useUser(); 
  const { addLiveContract } = useContracts();
  const { token } = theme.useToken();
  const [duration, setDuration] = useState(5);
  const [basis, setBasis] = useState('stake');
  const [symbol, setSymbol] = useState('R_10');
  const [amount, setAmount] = useState(10);
  const [payout, setPayout] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState({
    type: '',
    content: '',
    trigger: false,
  });

  const showNotification = (type, content) => {
    setNotification({ type, content, trigger: true });
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, trigger: false }));
    }, 500);
  };

  // Calculate payout based on amount and symbol
  useEffect(() => {
    const payoutMultiplier = symbol.includes('10') ? 0.95 : 
                          symbol.includes('25') ? 0.92 :
                          symbol.includes('50') ? 0.89 : 0.85;
    setPayout((amount * (1 + payoutMultiplier)).toFixed(2));
  }, [amount, symbol]);

  const handleSubmit = async (contractType) => {
    if (!user || !isAuthorized) {
      console.error('User not authorized or no active account');
      showNotification('warning', 'Please select an account and ensure it is authorized.');
      return;
    }

    if (!amount || amount <= 0) {
      console.error('Invalid amount');
      showNotification('warning', 'Please enter a valid amount.');
      return;
    }

    setIsSubmitting(true);

    const req_id = RequestIdGenerator.generateContractId();

    const contractData = {
      buy: 1,
      price: amount,
      parameters: {
        amount: amount,
        basis: basis,
        contract_type: contractType === 'even' ? 'DIGITEVEN' : 'DIGITODD',
        currency: user.currency || 'USD',
        duration: duration,
        duration_unit: 't',
        symbol: symbol,
      },
      loginid: user.loginid, // Ensured to be the activeAccount's loginid
      req_id: req_id,
    };

    try {
      const response = await sendAuthorizedRequest(contractData);

      const contractId = response?.buy?.contract_id;
      if(!contractId) {
        throw new Error('No contract_id returned form purchase');
      }

      const contract = {
        contract_id:contractId,
        type: contractType,
        symbol,
        status:'open',
        details: {
          amount,
          currency:user.currency || 'USD'
        },
      };

      addLiveContract(contract);
      
      showNotification('success', `Successfully purchased ${contractType === 'even' ? 'DIGITEVEN' : 'DIGITODD'} contract`);
    } catch (error) {
      console.error('Error purchasing contract:', error.message);
      showNotification('error', `Failed to purchase contract: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
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
        <Notification
          type={notification.type}
          content={notification.content}
          trigger={notification.trigger}
        />
        <Col xs={24} md={16}>
          {loading ? (
            <Spin tip="Loading account details..." size="large" style={{ display: 'block', margin: '50px auto' }} />
          ) : error ? (
            <Alert
              message="Error"
              description={error}
              type="error"
              showIcon
              style={{ marginBottom: 24 }}
            />
          ) : !user || !isAuthorized ? (
            <Alert
              message="No Active Account"
              description="Please select an account and ensure it is authorized to proceed."
              type="warning"
              showIcon
              style={{ marginBottom: 24 }}
            />
          ) : null}

          <Card
            title={
              <Space>
                <NumberOutlined style={{ color: token.colorPrimary }} />
                <Title level={4} style={{ margin: 0, color: token.colorPrimary }}>Even/Odd Contract</Title>
              </Space>
            }
            style={{ 
              borderRadius: 16,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
            }}
            extra={
              <Tooltip title="Predict whether the last digit of the tick is an even or odd number">
                <InfoCircleOutlined style={{ color: token.colorPrimary }} />
              </Tooltip>
            }
          >
            <Space direction="vertical" size={24} style={{ width: '100%' }}>
              {/* Symbol Selector */}
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

              {/* Tick Duration Selector */}
              <div>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>
                  Duration (Ticks)
                </Text>
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

              {/* Basis Selection */}
              <div>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>
                  Basis
                </Text>
                <Radio.Group 
                  value={basis} 
                  onChange={(e) => setBasis(e.target.value)} 
                  buttonStyle="solid"
                  style={{ width: '100%' }}
                >
                  <Radio.Button value="stake" style={{ width: '50%', textAlign: 'center' }}>
                    Stake
                  </Radio.Button>
                  <Radio.Button value="payout" style={{ width: '50%', textAlign: 'center' }}>
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
                  prefix="$"
                  step={5}
                  disabled={!user || !isAuthorized}
                />
                <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                  Available balance: {(user?.balance || 0).toFixed(2)} {user?.currency || 'USD'}
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
                    style={{ 
                      background: '#722ed1',
                      borderColor: '#722ed1',
                      height: 48
                    }}
                    onClick={() => handleSubmit('odd')}
                    loading={isSubmitting}
                    disabled={isSubmitting || !user || !isAuthorized}
                  >
                    ODD
                  </Button>
                </Col>
                <Col span={12}>
                  <Button
                    type="primary"
                    size="large"
                    block
                    style={{ height: 48 }}
                    onClick={() => handleSubmit('even')}
                    loading={isSubmitting}
                    disabled={isSubmitting || !user || !isAuthorized}
                  >
                    EVEN
                  </Button>
                </Col>
              </Row>
            </Space>
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

export default EvenOddContract;