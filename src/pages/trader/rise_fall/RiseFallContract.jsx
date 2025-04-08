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

const { Title, Text } = Typography;
const { Option } = Select;

const RiseFallTrader = ({ api, onPurchase }) => {
  const [durationType, setDurationType] = useState('ticks'); // 'ticks' or 'minutes'
  const [duration, setDuration] = useState(1);
  const [minutes, setMinutes] = useState(1);
  const [basis, setBasis] = useState('stake');
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
        symbol: 'R_100' // You might want to make this configurable too
      }
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