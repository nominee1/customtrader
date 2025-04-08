import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Form, 
  InputNumber, 
  Select, 
  Button, 
  Radio, 
  Statistic,
  Divider,
  Alert,
  Spin,
  Typography,
  Badge,
  Space
} from 'antd';
import { 
  NumberOutlined,
  DollarOutlined,
  LoadingOutlined,
  CheckOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { DerivAPI } from '@deriv/deriv-api';

const { Option } = Select;
const { Title, Text } = Typography;

const EvenOddTrader = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [contractResult, setContractResult] = useState(null);
  const [balance, setBalance] = useState(0);
  const [api, setApi] = useState(null);
  const [lastDigitHistory, setLastDigitHistory] = useState([]);

  // Initialize Deriv API
  useEffect(() => {
    const initializeAPI = async () => {
      const derivAPI = new DerivAPI({ app_id: 'YOUR_VALID_APP_ID' }); // Replace with your valid app ID
      await derivAPI.connection.connect();
      setApi(derivAPI);
      
      // Get balance
      const account = await derivAPI.account();
      const { balance } = await account.getAccountInfo();
      setBalance(balance);
    };

    initializeAPI();

    return () => {
      if (api) api.connection.close();
    };
  }, [api]);

  const onFinish = async (values) => {
    setLoading(true);
    setContractResult(null);

    try {
      const { symbol, prediction, amount, duration } = values;
      
      // Send buy request for Even/Odd contract
      const buy = await api.buy({
        proposal: 1,
        amount: amount.toString(),
        basis: 'stake',
        contract_type: prediction === 'even' ? 'DIGITDIFF' : 'DIGITMATCH',
        currency: 'USD',
        duration: duration.toString(),
        duration_unit: 't',
        symbol,
        barrier: prediction === 'even' ? '0' : '1' // For digit matching
      });

      // Subscribe to updates
      buy.onUpdate((update) => {
        if (update.proposal) {
          console.log('Proposal:', update.proposal);
        }

        if (update.contract_id) {
          setContractResult({
            contractId: update.contract_id,
            status: 'open',
            buyPrice: update.buy_price,
            prediction,
            symbol
          });
        }

        if (update.status === 'sold') {
          const lastDigit = update.sell_spot ? 
            Math.floor((update.sell_spot * 10) % 10) : null;
          
          setLastDigitHistory(prev => [{
            digit: lastDigit,
            result: lastDigit % 2 === 0 ? 'even' : 'odd',
            time: new Date()
          }, ...prev.slice(0, 4)]);

          setContractResult(prev => ({
            ...prev,
            status: 'closed',
            profit: update.profit,
            payout: update.payout,
            sellPrice: update.sell_price,
            lastDigit,
            isWin: (prediction === 'even' && lastDigit % 2 === 0) || 
                   (prediction === 'odd' && lastDigit % 2 === 1)
          }));
          
          setBalance(prev => prev + parseFloat(update.profit || 0));
        }
      });

      await buy.send();

    } catch (error) {
      console.error('Trade error:', error);
      Alert.error(error.message || 'Failed to place trade');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card 
      title={
        <Space>
          <NumberOutlined />
          <Title level={4} style={{ margin: 0 }}>Even/Odd </Title>
        </Space>
      }
      style={{ maxWidth: 500, margin: '0 auto' }}
      extra={
        <Badge count={lastDigitHistory.length} overflowCount={4}>
          <Button 
            type="text" 
            onClick={() => setLastDigitHistory([])}
            disabled={!lastDigitHistory.length}
          >
            Clear History
          </Button>
        </Badge>
      }
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          symbol: 'R_100',
          prediction: 'even',
          amount: 5,
          duration: 5
        }}
        onFinish={onFinish}
      >
        <Form.Item label="Account Balance" style={{ marginBottom: 24 }}>
          <Statistic 
            prefix={<DollarOutlined />} 
            value={balance.toFixed(2)} 
            precision={2} 
          />
        </Form.Item>

        <Form.Item 
          name="symbol" 
          label="Select Index"
          rules={[{ required: true }]}
        >
          <Select>
            <Option value="R_10">Volatility 10 Index (R_10)</Option>
            <Option value="R_100">Volatility 100 Index (R_100)</Option>
          </Select>
        </Form.Item>

        <Form.Item 
          name="prediction" 
          label="Contract Prediction"
          rules={[{ required: true }]}
        >
          <Radio.Group>
            <Radio.Button value="even" style={{ color: '#1890ff' }}>
              Even (Last digit 0,2,4,6,8)
            </Radio.Button>
            <Radio.Button value="odd" style={{ color: '#722ed1' }}>
              Odd (Last digit 1,3,5,7,9)
            </Radio.Button>
          </Radio.Group>
        </Form.Item>

        <Form.Item 
          name="amount" 
          label="Amount (USD)"
          rules={[
            { required: true },
            { type: 'number', min: 0.5, max: balance }
          ]}
        >
          <InputNumber 
            min={0.5} 
            max={balance} 
            step={0.5}
            style={{ width: '100%' }} 
            prefix="$" 
          />
        </Form.Item>

        <Form.Item 
          name="duration" 
          label="Duration (ticks)"
          rules={[
            { required: true },
            { type: 'number', min: 5, max: 100 }
          ]}
        >
          <InputNumber min={5} max={100} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            block 
            size="large"
            loading={loading}
            icon={<NumberOutlined />}
          >
            Place Even/Odd Contract
          </Button>
        </Form.Item>
      </Form>

      {/* Last Digits History */}
      {lastDigitHistory.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <Text strong>Recent Last Digits:</Text>
          <Space size={8} style={{ marginTop: 8, flexWrap: 'wrap' }}>
            {lastDigitHistory.map((item, index) => (
              <Badge 
                key={index}
                count={item.digit}
                style={{ 
                  backgroundColor: item.result === 'even' ? '#1890ff' : '#722ed1',
                  fontSize: 14,
                  width: 32,
                  height: 32,
                  lineHeight: '32px'
                }}
                title={`${item.time.toLocaleTimeString()} - ${item.result}`}
              />
            ))}
          </Space>
        </div>
      )}

      {/* Contract Results */}
      {contractResult && (
        <div style={{ marginTop: 24 }}>
          <Divider>Contract Result</Divider>
          <Card size="small">
            {contractResult.status === 'open' ? (
              <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
            ) : (
              <>
                <Statistic 
                  title="Prediction" 
                  value={contractResult.prediction.toUpperCase()} 
                  valueStyle={{ 
                    color: contractResult.prediction === 'even' ? '#1890ff' : '#722ed1'
                  }}
                />
                <Statistic 
                  title="Last Digit" 
                  value={contractResult.lastDigit} 
                  valueStyle={{ fontSize: 28 }}
                />
                <Statistic 
                  title="Result" 
                  value={contractResult.isWin ? 'WON' : 'LOST'} 
                  valueStyle={{ 
                    color: contractResult.isWin ? '#52c41a' : '#f5222d',
                    fontSize: 20
                  }}
                  prefix={contractResult.isWin ? <CheckOutlined /> : <CloseOutlined />}
                />
                <Statistic 
                  title="Payout" 
                  value={contractResult.payout} 
                  precision={2} 
                  prefix="$" 
                />
              </>
            )}
            <Text type="secondary">Contract ID: {contractResult.contractId}</Text>
          </Card>
        </div>
      )}
    </Card>
  );
};

export default EvenOddTrader;