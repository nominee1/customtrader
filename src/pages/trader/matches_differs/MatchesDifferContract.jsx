import React, { useState } from 'react';
import { 
  Button, 
  Card, 
  Radio, 
  InputNumber, 
  Row, 
  Col, 
  Typography,
  Badge,
  Space
} from 'antd';
import { 
  CloseCircleOutlined, 
  CheckCircleOutlined,
  CheckOutlined,
  CloseOutlined,
  DollarOutlined,
  LineChartOutlined,
  NumberOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

const MatchesDiffersTrader = ({ api, onPurchase }) => {
  const [duration, setDuration] = useState(1);
  const [selectedDigit, setSelectedDigit] = useState(5); // Default middle digit
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
        contract_type: contractType === 'matches' ? 'DIGITMATCH' : 'DIGITDIFF',
        currency: 'USD',
        duration: duration,
        duration_unit: 't',
        symbol: 'R_100',
        barrier: selectedDigit.toString() // Use selected digit as barrier
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
          <NumberOutlined />
          <Title level={4} style={{ margin: 0 }}>Matches/Differs</Title>
        </Space>
      }
      style={{ maxWidth: 500, margin: '0 auto' }}
    >
      {/* Tick Duration Selector */}
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

      {/* Digit Selection */}
      <div style={{ marginBottom: 24 }}>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>Last Digit Prediction:</Text>
        <Row justify="space-between" style={{ padding: '0 10px' }}>
          {[...Array(10)].map((_, i) => (
            <Col key={i}>
              <Badge
                count={i}
                style={{
                  backgroundColor: selectedDigit === i ? '#1890ff' : '#f0f0f0',
                  color: selectedDigit === i ? '#fff' : '#000',
                  fontSize: 16,
                  width: 32,
                  height: 32,
                  lineHeight: '32px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  boxShadow: selectedDigit === i ? '0 0 0 2px #1890ff' : 'none'
                }}
                onClick={() => setSelectedDigit(i)}
              />
            </Col>
          ))}
        </Row>
        <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginTop: 8 }}>
          Selected: {selectedDigit}
        </Text>
      </div>

      {/* Basis Selection */}
      <div style={{ marginBottom: 24 }}>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>Basis:</Text>
        <Radio.Group 
          value={basis} 
          onChange={(e) => setBasis(e.target.value)}
          buttonStyle="solid"
        >
          <Radio.Button value="stake">
            <DollarOutlined style={{ marginRight: 8 }} />
            Stake
          </Radio.Button>
          <Radio.Button value="payout">
            <LineChartOutlined style={{ marginRight: 8 }} />
            Payout
          </Radio.Button>
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
      <Row gutter={16}>
        <Col span={12}>
          <Button 
            type="primary" 
            block 
            size="large"
            icon={<CheckOutlined />} 
            loading={isSubmitting}
            onClick={() => handleSubmit('matches')}
            disabled={isSubmitting}
            style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
          >
            Matches {selectedDigit}
          </Button>
        </Col>
        <Col span={12}>
          <Button 
            type="primary" 
            block 
            size="large"
            icon={<CloseOutlined />} 
            loading={isSubmitting}
            onClick={() => handleSubmit('differs')}
            disabled={isSubmitting}
            style={{ backgroundColor: '#f5222d', borderColor: '#f5222d' }}
          >
            Differs {selectedDigit}
          </Button>
        </Col>
      </Row>
    </Card>
  );
};

export default MatchesDiffersTrader;