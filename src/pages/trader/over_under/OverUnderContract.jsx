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
  Slider,
  Row,
  Col,
  Space
} from 'antd';
import { 
  ArrowUpOutlined, 
  ArrowDownOutlined,
  DollarOutlined,
  LoadingOutlined,
  CheckOutlined,
  CloseOutlined,
  LineChartOutlined
} from '@ant-design/icons';
import { DerivAPI } from '@deriv/deriv-api';

const { Option } = Select;
const { Title, Text } = Typography;

const OverUnderTrader = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [contractResult, setContractResult] = useState(null);
  const [balance, setBalance] = useState(0);
  const [api, setApi] = useState(null);
  const [currentSpot, setCurrentSpot] = useState(null);
  const [barrier, setBarrier] = useState(0.5);
  const [history, setHistory] = useState([]);

  // Initialize API
  useEffect(() => {
    const initializeAPI = async () => {
      const derivAPI = new DerivAPI({ app_id: '12345' });
      await derivAPI.connection.connect();
      setApi(derivAPI);
      
      // Get balance
      const account = await derivAPI.account();
      const { balance } = await account.getAccountInfo();
      setBalance(balance);
      
      // Subscribe to spot prices
      const subscription = derivAPI.subscribe({ ticks: 'R_100' });
      subscription.onUpdate((update) => {
        if (update.tick) {
          setCurrentSpot(update.tick.quote);
        }
      });
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
      const { symbol, direction, amount, duration } = values;
      
      // Calculate barrier offset
      const barrierOffset = direction === 'over' ? barrier : -barrier;
      
      // Send buy request
      const buy = await api.buy({
        proposal: 1,
        amount: amount.toString(),
        basis: 'stake',
        contract_type: direction === 'over' ? 'CALL' : 'PUT',
        currency: 'USD',
        duration: duration.toString(),
        duration_unit: 't',
        symbol,
        barrier: currentSpot + barrierOffset
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
            direction,
            symbol,
            barrier: currentSpot + barrierOffset,
            spotAtPurchase: currentSpot
          });
        }

        if (update.status === 'sold') {
          const result = {
            ...contractResult,
            status: 'closed',
            profit: update.profit,
            payout: update.payout,
            sellPrice: update.sell_price,
            spotAtExpiry: update.sell_spot,
            isWin: (direction === 'over' && update.sell_spot > (currentSpot + barrierOffset)) || 
                   (direction === 'under' && update.sell_spot < (currentSpot - barrierOffset))
          };

          setContractResult(result);
          setHistory(prev => [result, ...prev.slice(0, 4)]);
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
          <LineChartOutlined />
          <Title level={4} style={{ margin: 0 }}>Over/Under Contract</Title>
        </Space>
      }
      style={{ maxWidth: 600, margin: '0 auto' }}
      extra={
        <Badge count={history.length} overflowCount={4}>
          <Button 
            type="text" 
            onClick={() => setHistory([])}
            disabled={!history.length}
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
          direction: 'over',
          amount: 5,
          duration: 5
        }}
        onFinish={onFinish}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Account Balance" style={{ marginBottom: 24 }}>
              <Statistic 
                prefix={<DollarOutlined />} 
                value={balance.toFixed(2)} 
                precision={2} 
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Current Spot Price" style={{ marginBottom: 24 }}>
              <Statistic 
                value={currentSpot ? currentSpot.toFixed(4) : '--'} 
                precision={4} 
              />
            </Form.Item>
          </Col>
        </Row>

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
            <Radio.Button value="over" style={{ color: '#52c41a' }}>
              <ArrowUpOutlined /> Over
            </Radio.Button>
            <Radio.Button value="under" style={{ color: '#f5222d' }}>
              <ArrowDownOutlined /> Under
            </Radio.Button>
          </Radio.Group>
        </Form.Item>

        <Form.Item label="Barrier Offset" style={{ marginBottom: 24 }}>
          <Slider
            min={0.1}
            max={2}
            step={0.1}
            value={barrier}
            onChange={setBarrier}
            tooltip={{
              formatter: (value) => `${value} points`, 
            }}
          />
          <Text type="secondary">
            {`Barrier will be set at ${currentSpot ? (currentSpot + (form.getFieldValue('direction') === 'over' ? barrier : -barrier)).toFixed(4) : '--'}`}
          </Text>
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
            icon={<LineChartOutlined />}
          >
            Place Over/Under Contract
          </Button>
        </Form.Item>
      </Form>

      {/* Trade History */}
      {history.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <Text strong>Recent Contracts:</Text>
          <Space direction="vertical" style={{ width: '100%', marginTop: 8 }}>
            {history.map((item, index) => (
              <Badge.Ribbon 
                key={index}
                text={item.isWin ? 'WON' : 'LOST'}
                color={item.isWin ? 'green' : 'red'}
              >
                <Card size="small">
                  <Space>
                    <Text>{item.symbol}</Text>
                    <Text strong>{item.direction.toUpperCase()}</Text>
                    <Text>Barrier: {item.barrier.toFixed(4)}</Text>
                    <Text>Payout: ${item.payout.toFixed(2)}</Text>
                  </Space>
                </Card>
              </Badge.Ribbon>
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
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic 
                      title="Direction" 
                      value={contractResult.direction.toUpperCase()} 
                      valueStyle={{ 
                        color: contractResult.direction === 'over' ? '#52c41a' : '#f5222d'
                      }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic 
                      title="Barrier" 
                      value={contractResult.barrier.toFixed(4)} 
                    />
                  </Col>
                </Row>
                <Row gutter={16} style={{ marginTop: 16 }}>
                  <Col span={12}>
                    <Statistic 
                      title="Entry" 
                      value={contractResult.spotAtPurchase.toFixed(4)} 
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic 
                      title="Exit" 
                      value={contractResult.spotAtExpiry.toFixed(4)} 
                    />
                  </Col>
                </Row>
                <Divider />
                <Statistic 
                  title="Result" 
                  value={contractResult.isWin ? 'WON' : 'LOST'} 
                  valueStyle={{ 
                    color: contractResult.isWin ? '#52c41a' : '#f5222d',
                    fontSize: 24
                  }}
                  prefix={contractResult.isWin ? <CheckOutlined /> : <CloseOutlined />}
                />
                <Statistic 
                  title="Payout" 
                  value={contractResult.payout} 
                  precision={2} 
                  prefix="$" 
                  style={{ marginTop: 16 }}
                />
              </>
            )}
            <Text type="secondary" style={{ display: 'block', marginTop: 16 }}>
              Contract ID: {contractResult.contractId}
            </Text>
          </Card>
        </div>
      )}
    </Card>
  );
};

export default OverUnderTrader;