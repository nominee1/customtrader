import React, { useState } from 'react';
import { Button, Card, Radio, InputNumber, Row, Col, Space, Typography } from 'antd';
import { CloseCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

const EvenOddContract = ({ api, onPurchase }) => {
  const [duration, setDuration] = useState(1);
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
        contract_type: contractType === 'even' ? 'DIGITEVEN' : 'DIGITODD',
        currency: 'USD',
        duration: duration,
        duration_unit: 't',
        symbol: 'R_100'
      }
    };

    // Simulate API call - replace with your actual Deriv API call
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
      title="Even/Odd Contract" 
      style={{ maxWidth: 600, margin: '0 auto' }}
      headStyle={{ textAlign: 'center' }}
    >
      {/* Tick Duration Selector (Dots) */}
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

      {/* Basis Selection */}
      <div style={{ marginBottom: 24 }}>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>Basis:</Text>
        <Radio.Group 
          value={basis} 
          onChange={(e) => setBasis(e.target.value)}
          buttonStyle="solid"
        >
          <Radio.Button value="stake">Stake</Radio.Button>
          <Radio.Button value="payout">Payout</Radio.Button>
        </Radio.Group>
      </div>

      {/* Price Input */}
      <div style={{ marginBottom: 32 }}>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>Amount (USD):</Text>
        <InputNumber
          min={1}
          max={1000}
          value={price}
          onChange={setPrice}
          style={{ width: '100%' }}
          precision={2}
          prefix="$"
        />
      </div>

      {/* Action Buttons */}
      <Space size="large" style={{ width: '100%', justifyContent: 'center' }}>
        <Button
          type="primary"
          size="large"
          style={{ width: 120, background: '#722ed1', borderColor: '#722ed1' }}
          onClick={() => handleSubmit('odd')}
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          ODD
        </Button>
        <Button
          type="primary"
          size="large"
          style={{ width: 120 }}
          onClick={() => handleSubmit('even')}
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          EVEN
        </Button>
      </Space>
    </Card>
  );
};

export default EvenOddContract;