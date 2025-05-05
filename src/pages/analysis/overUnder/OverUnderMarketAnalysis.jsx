import React, { useState, useEffect } from 'react';
import { Card, Select, Tabs, Spin, Progress, Typography, Collapse, Space } from 'antd';
import { LineChartOutlined } from '@ant-design/icons';
import { publicWebSocket } from '../../../services/public_websocket_client';
import {
  analyzeSMACrossover,
  analyzeStochastic,
  analyzeTickStreak,
  analyzeVolatilitySpike,
  analyzeRisk,
  combineSignals,
} from './overUnderAnalysis';
import '../../../assets/css/pages/analysis/MarketAnalysis.css';

const { Option } = Select;
const { TabPane } = Tabs;
const { Paragraph } = Typography;
const { Panel } = Collapse;

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

const OverUnderMarketAnalysis = () => {
  const [symbol, setSymbol] = useState('R_10');
  const [ticks, setTicks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const balance = 1000; // Mock; replace with context or API

  // WebSocket subscription
  useEffect(() => {
    let unsubscribe;
    let isMounted = true;

    const subscribeToTicks = async () => {
      setLoading(true);
      setError(null);
      try {
        await publicWebSocket.connect();
        if (!isMounted) return;

        unsubscribe = publicWebSocket.subscribe((event, data) => {
          if (event === 'message' && data.tick) {
            setTicks((prev) => {
              const newTicks = [...prev, { price: data.tick.quote, timestamp: data.tick.epoch }];
              return newTicks.slice(-20); // Keep last 20 ticks
            });
            setLoading(false);
          } else if (event === 'error') {
            setError('WebSocket error occurred');
            setLoading(false);
          }
        });

        publicWebSocket.send({ ticks: symbol, subscribe: 1 });
      } catch (err) {
        console.error('Websoket error:', err);
        if (isMounted) {
          setError('Failed to connect to WebSocket');
          setLoading(false);
        }
      }
    };

    subscribeToTicks();

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
      // Only send 'forget' if WebSocket is connected
      if (publicWebSocket.ws && publicWebSocket.ws.readyState === WebSocket.OPEN) {
        publicWebSocket.send({ forget: symbol });
      }
    };
  }, [symbol]);

  // Analysis functions
  const analyses = [
    {
      key: 'sma',
      name: 'SMA Crossover',
      func: () => analyzeSMACrossover(ticks, symbol),
    },
    {
      key: 'stochastic',
      name: 'Stochastic Oscillator',
      func: () => analyzeStochastic(ticks, symbol),
    },
    {
      key: 'streak',
      name: 'Tick Streak',
      func: () => analyzeTickStreak(ticks, symbol),
    },
    {
      key: 'volatility',
      name: 'Volatility Spike',
      func: () => analyzeVolatilitySpike(ticks),
    },
    {
      key: 'risk',
      name: 'Risk Analysis',
      func: () => analyzeRisk(balance, symbol),
    },
    {
      key: 'combined',
      name: 'Combined Signals',
      func: () => combineSignals(ticks, symbol, balance),
    },
  ];

  // Render analysis result
  const renderAnalysis = (analysis) => {
    if (!analysis || !analysis.func) {
      return <Paragraph>No data available for analysis.</Paragraph>;
    }

    const result = analysis.func();
    if (!result) {
      return <Paragraph>No analysis result available.</Paragraph>;
    }

    if (analysis.key === 'combined') {
      const { signal, confidence, details, individualSignals } = result;
      return (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Paragraph>
            <strong>Signal:</strong> {signal ? signal.toUpperCase() : 'N/A'}
          </Paragraph>
          <Paragraph>
            <strong>Confidence:</strong>
            <Progress percent={confidence ? (confidence * 100).toFixed(0) : 0} size="small" />
          </Paragraph>
          <Paragraph>{details || 'No details available'}</Paragraph>
          <Collapse>
            {individualSignals &&
              Object.entries(individualSignals).map(([key, sig]) => (
                <Panel header={key.toUpperCase()} key={key}>
                  <Paragraph>
                    <strong>Signal:</strong> {sig?.signal ? sig.signal.toUpperCase() : 'N/A'}
                  </Paragraph>
                  {sig?.strength ? (
                    <Paragraph>
                      <strong>Strength:</strong>
                      <Progress percent={(sig.strength * 100).toFixed(0)} size="small" />
                    </Paragraph>
                  ) : null}
                  <Paragraph>{sig?.details || 'No details available'}</Paragraph>
                </Panel>
              ))}
          </Collapse>
        </Space>
      );
    }

    const { signal, strength, details } = result;
    return (
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Paragraph>
          <strong>Signal:</strong> {signal ? signal.toUpperCase() : 'N/A'}
        </Paragraph>
        {strength ? (
          <Paragraph>
            <strong>Strength:</strong>
            <Progress percent={(strength * 100).toFixed(0)} size="small" />
          </Paragraph>
        ) : null}
        <Paragraph>{details || 'No details available'}</Paragraph>
      </Space>
    );
  };

  return (
    <div className="market-analysis-container">
      <Card
        title={
          <Space>
            <LineChartOutlined style={{ color: '#1890ff', fontSize: '20px' }} />
            <span>Over/Under Market Analysis</span>
          </Space>
        }
        className="market-analysis-card"
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Select
            value={symbol}
            onChange={setSymbol}
            style={{ width: 200 }}
            placeholder="Select Symbol"
          >
            {volatilityOptions.map((option) => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>

          {error && (
            <Paragraph type="danger" style={{ color: '#ff4d4f' }}>
              {error}
            </Paragraph>
          )}

          <Spin spinning={loading} tip="Loading tick data...">
            <Tabs defaultActiveKey="sma">
              {analyses.map((analysis) => (
                <TabPane tab={analysis.name} key={analysis.key}>
                  {renderAnalysis(analysis)}
                </TabPane>
              ))}
            </Tabs>
          </Spin>
        </Space>
      </Card>
    </div>
  );
};

export default OverUnderMarketAnalysis;