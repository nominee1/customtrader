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
  Space
} from 'antd';
import { 
  ArrowUpOutlined, 
  ArrowDownOutlined,
  LineChartOutlined,
  DollarOutlined,
  LoadingOutlined,
  RiseOutlined, 
} from '@ant-design/icons';
import { DerivAPI } from '@deriv/deriv-api';

const { Option } = Select;
const { Title, Text } = Typography;

const RiseFallTrader = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [contractResult, setContractResult] = useState(null);
  const [balance, setBalance] = useState(0);
  const [api, setApi] = useState(null);
  const [connection, setConnection] = useState(null);

  // Initialize Deriv API connection
  useEffect(() => {
    const initializeAPI = async () => {
      const derivAPI = new DerivAPI({ app_id: 'YOUR_VALID_APP_ID' });
      const connection = await derivAPI.connection.connect();
      setApi(derivAPI);
      setConnection(connection);
      
      // Get balance
      const account = await derivAPI.account();
      const { balance } = await account.getAccountInfo();
      setBalance(balance);
    };

    initializeAPI();

    return () => {
      if (connection) connection.close();
    };
  }, [connection]);

  const onFinish = async (values) => {
    setLoading(true);
    setContractResult(null);

    try {
      const { symbol, direction, amount, duration } = values;
      
      // Send buy request
      const buy = await api.buy({
        proposal: 1,
        amount: amount.toString(),
        basis: 'stake',
        contract_type: direction === 'rise' ? 'CALL' : 'PUT',
        currency: 'USD',
        duration: duration.toString(),
        duration_unit: 't',
        symbol
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
            buyPrice: update.buy_price
          });
        }

        if (update.status === 'sold') {
          setContractResult(prev => ({
            ...prev,
            status: 'closed',
            profit: update.profit,
            payout: update.payout,
            sellPrice: update.sell_price
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
          <RiseOutlined  />
          <Title level={4} style={{ margin: 0 }}>Rise/Fall </Title>
        </Space>
      }
      style={{ maxWidth: 500, margin: '0 auto' }}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          symbol: 'R_100',
          direction: 'rise',
          amount: 10,
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
          name="direction" 
          label="Contract Direction"
          rules={[{ required: true }]}
        >
          <Radio.Group>
            <Radio.Button value="rise" style={{ color: '#52c41a' }}>
              <ArrowUpOutlined /> Rise
            </Radio.Button>
            <Radio.Button value="fall" style={{ color: '#f5222d' }}>
              <ArrowDownOutlined /> Fall
            </Radio.Button>
          </Radio.Group>
        </Form.Item>

        <Form.Item 
          name="amount" 
          label="Amount (USD)"
          rules={[
            { required: true },
            { type: 'number', min: 1, max: balance }
          ]}
        >
          <InputNumber 
            min={1} 
            max={balance} 
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
            icon={<LineChartOutlined />}
          >
            Place Contract
          </Button>
        </Form.Item>
      </Form>

      {contractResult && (
        <div style={{ marginTop: 24 }}>
          <Divider>Contract Result</Divider>
          <Card size="small">
            {contractResult.status === 'open' ? (
              <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
            ) : (
              <>
                <Statistic 
                  title="Result" 
                  value={contractResult.profit >= 0 ? 'Won' : 'Lost'} 
                  valueStyle={{ 
                    color: contractResult.profit >= 0 ? '#52c41a' : '#f5222d' 
                  }}
                />
                <Statistic 
                  title="Profit/Loss" 
                  value={contractResult.profit} 
                  precision={2} 
                  prefix="$" 
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

export default RiseFallTrader;