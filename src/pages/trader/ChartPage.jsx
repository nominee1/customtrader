import React, { useState, useEffect } from 'react';
import { Select, Alert, Spin, Card, Space, Typography } from 'antd';
import CandlestickChart from '../../components/CandlestickChart';
import { publicWebSocket } from '../../services/public_websocket_client';

const { Option } = Select;
const { Text } = Typography;

const volatilityOptions = [
    { value: 'R_10', label: 'Volatility 10 Index' },
    { value: '1HZ10V', label: 'Volatility 10 (1s) Index' },
    { value: 'R_25', label: 'Volatility 25 Index' },
    { value: '1HZ25V', label: 'Volatility 25 (1s) Index' },
    { value: 'R_50', label: 'Volatility 50 Index' },
    { value: '1HZ50V', label: 'Volatility 50 (1s) Index' },
    { value: 'R_75', label: 'Volatility 75 Index' },
    { value: '1HZ75V', label: 'Volatility 75 (1s) Index' },
    { value: 'R_100', label: 'Volatility 100 Index' },
    { value: '1HZ100V', label: 'Volatility 100 (1s) Index' },
];

const ChartPage = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('1HZ10V');
  const [ticks, setTicks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsubscribe;
    let isMounted = true;

    const handleTick = (event, data) => {
      if (!isMounted) return;
      
      if (event === 'message' && data.msg_type === 'tick' && data.tick) {
        const tick = data.tick;
        if (tick.symbol === selectedSymbol) {
          const newTick = {
            price: (parseFloat(tick.ask) + parseFloat(tick.bid)) / 2, // Midpoint
            timestamp: tick.epoch,
            quote: (parseFloat(tick.ask) + parseFloat(tick.bid)) / 2,
          };
          setTicks(prev => [...prev.slice(-199), newTick]); // Keep last 200 ticks
        }
      }
      else if (event === 'error') {
        console.log('WebSocket error occurred');
        setLoading(false);
      }
    };

    const subscribeToSymbol = async () => {
      setLoading(true);
      setError(null);
      setTicks([]);
      
      try {
        await publicWebSocket.connect();
        unsubscribe = publicWebSocket.subscribe(handleTick);
        publicWebSocket.subscribeToTicks(selectedSymbol);
        
        // Fetch historical data (last 60 ticks ~ 1 minute)
        await publicWebSocket.fetchHistoricalTicks(selectedSymbol, 60);
        setLoading(false);
      } catch (err) {
        console.error('WebSocket Error:', err);
        if (isMounted) {
          setError('Failed to connect to WebSocket');
          setLoading(false);
        }
      }
    };

    subscribeToSymbol();

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
      publicWebSocket.unsubscribe(selectedSymbol);
    };
  }, [selectedSymbol]);

  return (
    <div style={{ padding: '20px' }}>
      <Card
        title={
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Text strong>Candlestick Chart</Text>
            <Select
              value={selectedSymbol}
              onChange={setSelectedSymbol}
              style={{ width: 200 }}
              loading={loading}
            >
              {volatilityOptions.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Space>
        }
      >
        {error && (
          <Alert message="Error" description={error} type="error" showIcon />
        )}

        {loading ? (
          <Spin tip="Connecting to market data..." />
        ) : (
          <CandlestickChart 
            symbol={selectedSymbol}
            ticks={ticks}
          />
        )}
      </Card>
    </div>
  );
};

export default ChartPage;