import React, { useState } from 'react';
import { 
  Button, 
  Card, 
  Radio, 
  InputNumber, 
  Row, 
  Col, 
  Space, 
  Typography,
  Select
} from 'antd';
import { 
  CloseCircleOutlined, 
  CheckCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  DollarOutlined,
  LineChartOutlined,
  RiseOutlined
} from '@ant-design/icons';
import { useUser } from '../../../context/AuthContext';
const { Title, Text } = Typography;
const { Option } = Select;

const RiseFallTrader = ({ api, onPurchase }) => {
  const { user } = useUser(); 
  const [durationType, setDurationType] = useState('ticks'); 
  const [duration, setDuration] = useState(1);
  const [minutes, setMinutes] = useState(1);
  const [basis, setBasis] = useState('stake');
  const [symbol, setSymbol] = useState('R_10');
  const [price, setPrice] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (contractType) => {
    setIsSubmitting(true);
    
    const contractData = {
      buy: 1,
      price: price,
      parameters: {
        amount: price, 
        basis: basis,
        contract_type: contractType === 'rise' ? 'CALL' : 'PUT',
        currency: 'USD',
        duration: durationType === 'ticks' ? duration : minutes,
        duration_unit: durationType === 'ticks' ? 't' : 'm',
        symbol: symbol === 'R_10' ? 'R_10' : symbol, 
      },
      loginid: user?.loginid,
    };

    console.log('Sending contract:', contractData);
    if (api) {
      api.send(contractData)
        .then(response => {
          onPurchase && onPurchase(response);
        })
        .catch(error => {
          console.error('Contract error:', error);
        })
        .finally(() => {
          setIsSubmitting(false);
        });
    } else {
      // For demo purposes
      setTimeout(() => {
        onPurchase && onPurchase({ 
          contract_id: Math.random().toString(36).substring(7),
          ...contractData 
        });
        setIsSubmitting(false);
      }, 1000);
    }
  };
  
  return (
    <Card 
      title={
        <Space>
          <RiseOutlined />
          <Title level={4} style={{ margin: 0 }}>Rise/Fall</Title>
        </Space>
      }
      style={{ maxWidth: 500, margin: '0 auto' }}
    >
      {/* Symbol Selection */}
      <div style={{ marginBottom: 16 }}>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>Volatility:</Text>
        <Select
          value={symbol}
          onChange={setSymbol}
          style={{ width: '100%' }}
          placeholder="Select a symbol"
        >
          <Option className="Volatility10" value="R_10">Volatility 10 index</Option>
          <Option className="Volatility10s" value="1HZ10V">Volatility 10(1s) index</Option>
          <Option className="Volatility25" value="R_25">Volatility 25 index</Option>
          <Option className="Volatility25s" value="1HZ25V">Volatility 25(1s) index</Option>
          <Option className="Volatility50" value="R_50">Volatility 50 index</Option>
          <Option className="Volatility50s" value="1HZ50V">Volatility 50(1s) index</Option>
          <Option className="Volatility75" value="R_75">Volatility 75 index</Option>
          <Option className="Volatility75s" value="1HZ75V">Volatility 75(1s) index</Option>
          <Option className="Volatility100" value="R_100">Volatility 100 index</Option>
          <Option className="Volatility100s" value="1HZ100V">Volatility 100(1s) index</Option>
        </Select>
      </div>
      
      {/* Duration Type Selection */}
      <div style={{ marginBottom: 16 }}>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>Duration Type:</Text>
        <Radio.Group 
          value={durationType} 
          onChange={(e) => setDurationType(e.target.value)}
          buttonStyle="solid"
        >
          <Radio.Button value="ticks">Ticks</Radio.Button>
          <Radio.Button value="minutes">Minutes</Radio.Button>
        </Radio.Group>
      </div>

      {/* Duration Input - Ticks or Minutes based on selection */}
      {durationType === 'ticks' ? (
        <div style={{ marginBottom: 24 }}>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>Duration (Ticks):</Text>
          <Row justify="space-between" style={{ padding: '0 20px' }}>
            {[...Array(10)].map((_, i) => {
              const tick = i + 1;
              const isActive = tick <= duration;
              const IconComponent = isActive ? CheckCircleOutlined : CloseCircleOutlined;
              
              return (
                <Col key={tick}>
                  <IconComponent
                    style={{ 
                      fontSize: 24,
                      color: isActive ? '#1890ff' : '#d9d9d9',
                      cursor: 'pointer'
                    }}
                    onClick={() => setDuration(tick)}
                    title={`${tick} tick${tick > 1 ? 's' : ''}`}
                  />
                </Col>
              );
            })}
          </Row>
          <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginTop: 8 }}>
            Selected: {duration} tick{duration > 1 ? 's' : ''}
          </Text>
        </div>
      ) : (
        <div style={{ marginBottom: 24 }}>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>Duration (Minutes):</Text>
          <InputNumber
            min={1}
            max={60}
            value={minutes}
            onChange={setMinutes}
            style={{ width: '100%' }}
            addonAfter="minutes"
          />
        </div>
      )}

      {/* Basis Selection */}
      <div style={{ marginBottom: 24 }}>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>Basis:</Text>
        <Radio.Group value={basis} onChange={(e) => setBasis(e.target.value)}>
          <Radio value="stake">
            <DollarOutlined style={{ marginRight: 8 }} />
            Stake
          </Radio>
          <Radio value="payout">
            <LineChartOutlined style={{ marginRight: 8 }} />
            Payout
          </Radio>
        </Radio.Group>
      </div>

      {/* Price Input */}
      <div style={{ marginBottom: 32 }}>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>Amount (USD):</Text>
        <InputNumber
          min={1}
          max={10000}
          value={price}
          onChange={setPrice}
          style={{ width: '100%' }}
          prefix={<DollarOutlined />}
        />
      </div>

      {/* Action Buttons */}

      <Space size="large" style={{ width: '100%', justifyContent: 'center' }}>
        <Button
          type="primary"
          icon={<ArrowUpOutlined />} 
          size="large"
          style={{ width: 120, background: '#722ed1', borderColor: '#722ed1' }}
          onClick={() => handleSubmit('rise')}
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          Rise (CALL)
        </Button>
        <Button
          type="primary"
          icon={<ArrowDownOutlined />} 
          size="large"
          style={{ width: 120 }}
          onClick={() => handleSubmit('fall')}
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          Fall (PUT)
        </Button>
      </Space>
    </Card>
  );
};

export default RiseFallTrader;