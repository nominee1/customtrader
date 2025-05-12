// src/components/ChartPage.jsx
import React, { useState, useEffect } from 'react';
import { Select, Card, Space, Typography, Skeleton, Alert } from 'antd';
import CandlestickChart from '../../components/CandlestickChart';
import { publicWebSocket } from '../../services/public_websocket_client';
import '../../assets/css/pages/trader/ChartPage.css';

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

// Utility function for retrying with delay
const retry = async (fn, maxAttempts = 3, delayMs = 3000) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn(attempt, maxAttempts);
    } catch (err) {
      if (attempt === maxAttempts) {
        throw err; // Rethrow error after final attempt
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
};

const ChartPage = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('1HZ10V');
  const [tickData, setTickData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsubscribers = [];
    let isMounted = true;

    const subscribeToAllSymbols = async (attempt, maxAttempts) => {
      setLoading(true);
      setError(null);

      try {
        await publicWebSocket.connect();
        if (!isMounted) return;

        // Initialize tickData for all symbols
        setTickData((prev) => {
          const updated = { ...prev };
          volatilityOptions.forEach((option) => {
            if (!updated[option.value]) updated[option.value] = [];
          });
          return updated;
        });

        // Handle WebSocket messages
        const handleTick = (event, data) => {
          if (!isMounted) return;
          if (event === 'message' && data.msg_type === 'tick') {
            const { symbol: tickSymbol, quote, epoch } = data.tick;
            setTickData((prev) => ({
              ...prev,
              [tickSymbol]: [...(prev[tickSymbol] || []), { price: quote, timestamp: epoch }].slice(-200),
            }));
          } else if (event === 'message' && data.msg_type === 'history') {
            const { ticks_history: symbol, prices, times } = data.echo_req;
            if (prices && times) {
              const historicalTicks = prices.map((price, index) => ({
                price,
                timestamp: times[index],
              }));
              setTickData((prev) => ({
                ...prev,
                [symbol]: historicalTicks.slice(-60),
              }));
            }
            setLoading(false);
          } else if (event === 'error') {
            console.error('WebSocket error event received');
            throw new Error('WebSocket error occurred'); // Trigger retry
          }
        };

        // Subscribe to all symbols
        unsubscribers = [];
        volatilityOptions.forEach((option) => {
          const unsubscribe = publicWebSocket.subscribe(handleTick);
          unsubscribers.push(unsubscribe);
          publicWebSocket.subscribeToTicks(option.value);
        });

        // Fetch historical ticks with batching
        const fetchHistorical = async () => {
          const batchSize = 5;
          for (let i = 0; i < volatilityOptions.length; i += batchSize) {
            if (!isMounted) return;
            const batch = volatilityOptions.slice(i, i + batchSize);
            await Promise.all(
              batch.map((option) => publicWebSocket.fetchHistoricalTicks(option.value, 60))
            );
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        };

        await fetchHistorical();
      } catch (err) {
        console.error(`WebSocket Error (Attempt ${attempt}/${maxAttempts}):`, err);
        if (isMounted) {
          throw err; // Rethrow to trigger retry
        }
      }
    };

    // Wrap subscription with retry logic
    retry(
      async (attempt, maxAttempts) => await subscribeToAllSymbols(attempt, maxAttempts),
      3, // Max attempts
      3000 // Delay in ms
    ).catch((err) => {
      if (isMounted) {
        console.error('Connection error:', err);
        setError('Failed to connect to WebSocket after 3 attempts. Please check your network or app ID.');
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribers.forEach((unsub) => unsub());
      volatilityOptions.forEach((option) => publicWebSocket.unsubscribe(option.value));
      publicWebSocket.close();
    };
  }, []);

  return (
    <div className="chart-page-container">
      <Card
        className="chart-page-card"
        title={
          <Space style={{ width: '100%', justifyContent: 'space-between'}}>
            <Text strong className="chart-page-title">
              Candlestick Chart
            </Text>
            <Select
              className="chart-page-select"
              value={selectedSymbol}
              onChange={setSelectedSymbol}
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
          <Alert
            message="Connection Error"
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        {loading || error ? (
          <div className="chart-page-loading">
            <Skeleton
              className="chart-page-skeleton"
              active
              paragraph={{ rows: 4 }}
            />
            {error && (
              <Text className="chart-page-text">
                Failed to load data. Please try another symbol.
              </Text>
            )}
          </div>
        ) : (
          <CandlestickChart
            symbol={selectedSymbol}
            ticks={tickData[selectedSymbol] || []}
          />
        )}
      </Card>
    </div>
  );
};

export default ChartPage;