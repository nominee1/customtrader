import React, { useState, useEffect, useMemo } from 'react';
import { 
  Card, 
  Select, 
  Tabs, 
  Spin, 
  Progress, 
  Typography, 
  Collapse, 
  Space, 
  Row, 
  Col, 
  Statistic, 
  Tooltip, 
  Alert,
  Badge,
  Switch
} from 'antd';
import { 
  LineChartOutlined, 
  QuestionCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  PauseOutlined,
  WarningOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { publicWebSocket } from '../../../services/public_websocket_client';
import {
  analyzeSMACrossover,
  analyzeStochastic,
  analyzeTickStreak,
  analyzeVolatilitySpike,
  analyzeRisk,
  combineSignals,
} from './riseFallAnalysis';
import '../../../assets/css/pages/analysis/MarketAnalysis.css';

const { Option } = Select;
const { TabPane } = Tabs;
const { Title, Text } = Typography;
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

const SignalIndicator = ({ signal, strength, size = 'default' }) => {
  const signalConfig = {
    rise: { 
      color: '#52c41a', 
      icon: <ArrowUpOutlined />, 
      label: 'RISE',
      explanation: 'The market is showing upward momentum'
    },
    fall: { 
      color: '#f5222d', 
      icon: <ArrowDownOutlined />, 
      label: 'FALL',
      explanation: 'The market is showing downward momentum'
    },
    neutral: { 
      color: '#faad14', 
      icon: <PauseOutlined />, 
      label: 'NEUTRAL',
      explanation: 'The market shows no clear direction'
    },
    warning: { 
      color: '#fa541c', 
      icon: <WarningOutlined />, 
      label: 'WARNING',
      explanation: 'High volatility detected - trade with caution'
    },
    hold: { 
      color: '#1890ff', 
      icon: <InfoCircleOutlined />, 
      label: 'HOLD',
      explanation: 'Not recommended to trade at this time'
    }
  };

  const config = signalConfig[signal] || signalConfig.neutral;
  const isSmall = size === 'small';

  return (
    <Tooltip title={config.explanation}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 8,
        padding: isSmall ? '4px 8px' : '8px 12px',
        backgroundColor: isSmall ? 'transparent' : '#fafafa',
        borderRadius: 8,
        border: isSmall ? 'none' : `1px solid ${config.color}`
      }}>
        <Badge 
          color={config.color} 
          text={
            <span style={{ 
              color: isSmall ? config.color : 'inherit',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}>
              {config.icon} {!isSmall && config.label}
            </span>
          }
        />
        {strength > 0 && (
          <Progress 
            percent={Math.round(strength * 100)} 
            strokeColor={config.color}
            size={isSmall ? 'small' : 'default'}
            showInfo={!isSmall}
            format={isSmall ? () => `${Math.round(strength * 100)}%` : null}
            style={{ width: isSmall ? 60 : 120 }}
          />
        )}
      </div>
    </Tooltip>
  );
};

const AnalysisExplanation = ({ title, content }) => (
  <Tooltip 
    title={
      <div style={{ padding: 8 }}>
        <Text strong>{title}</Text>
        <div style={{ marginTop: 4 }}>{content}</div>
      </div>
    }
    overlayStyle={{ maxWidth: 300 }}
    placement="right"
  >
    <QuestionCircleOutlined style={{ color: '#1890ff', marginLeft: 8 }} />
  </Tooltip>
);

const RiseFallMarketAnalysis = () => {
  const [symbol, setSymbol] = useState('R_10');
  const [ticks, setTicks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [simpleMode, setSimpleMode] = useState(false);
  const balance = 1000; // Mock; replace with context or API

  // Memoized combined signal to prevent unnecessary recalculations
  const combinedSignal = useMemo(() => combineSignals(ticks, symbol, balance), [ticks, symbol, balance]);

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
              return newTicks.slice(-30); // Keep last 30 ticks for better analysis
            });
            setLoading(false);
          } else if (event === 'error') {
            setError('WebSocket error occurred');
            setLoading(false);
          }
        });

        publicWebSocket.send({ ticks: symbol, subscribe: 1 });
      } catch (err) {
        console.error('Websocket Error:', err);
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
      if (publicWebSocket.ws && publicWebSocket.ws.readyState === WebSocket.OPEN) {
        publicWebSocket.send({ forget: symbol });
      }
    };
  }, [symbol]);

  // Analysis functions
  const analyses = [
    {
      key: 'sma',
      name: 'SMA',
      func: () => analyzeSMACrossover(ticks, symbol),
      explanation: 'Moving averages show the trend direction by smoothing price data. A crossover suggests a potential change in trend.'
    },
    {
      key: 'stochastic',
      name: 'Stochastic',
      func: () => analyzeStochastic(ticks, symbol),
      explanation: 'Measures momentum by comparing closing prices to recent price range. Overbought/oversold conditions may indicate reversals.'
    },
    {
      key: 'streak',
      name: 'Streak',
      func: () => analyzeTickStreak(ticks, symbol),
      explanation: 'Identifies consecutive price movements in the same direction. Long streaks often precede reversals.'
    },
    {
      key: 'volatility',
      name: 'Volatility',
      func: () => analyzeVolatilitySpike(ticks),
      explanation: 'Measures price fluctuations. High volatility means larger price swings, increasing risk.'
    },
    {
      key: 'risk',
      name: 'Risk',
      func: () => analyzeRisk(balance, symbol),
      explanation: 'Calculates appropriate position size based on your account balance and current market conditions.'
    },
    {
      key: 'combined',
      name: 'Summary',
      func: () => combinedSignal,
      explanation: 'Combines all indicators to provide the overall trading recommendation with confidence level.'
    },
  ];

  // Render analysis result
  const renderAnalysis = (analysis) => {
    if (!analysis) {
      return <Text>No data available for analysis.</Text>;
    }

    const result = analysis.func();
    if (!result) return null;

    if (analysis.key === 'combined') {
      const { signal, confidence, details, individualSignals } = result;
      return (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Alert
            message={
              <Space>
                <Text strong>Recommendation:</Text>
                <SignalIndicator signal={signal} strength={confidence} />
              </Space>
            }
            description={details}
            type={
              signal === 'rise' ? 'success' :
              signal === 'fall' ? 'error' :
              signal === 'warning' ? 'warning' : 'info'
            }
            showIcon
          />
          
          <Collapse ghost>
            <Panel header="Detailed Indicators" key="details">
              <Row gutter={[16, 16]}>
                {Object.entries(individualSignals).map(([key, res]) => (
                  <Col xs={24} sm={12} md={8} key={key}>
                    <Card size="small" title={
                      <Space>
                        <Text>{key.toUpperCase()}</Text>
                        <AnalysisExplanation 
                          title={analyses.find(a => a.key === key)?.name || key} 
                          content={analyses.find(a => a.key === key)?.explanation} 
                        />
                      </Space>
                    }>
                      <Space direction="vertical">
                        <SignalIndicator signal={res?.signal} strength={res?.strength} size="small" />
                        <Text type="secondary">{res?.details || 'No details'}</Text>
                      </Space>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Panel>
          </Collapse>
        </Space>
      );
    }

    const { signal, strength, details } = result;
    return (
      <Card size="small">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space>
            <SignalIndicator signal={signal} strength={strength} size="small" />
            <AnalysisExplanation title={analysis.name} content={analysis.explanation} />
          </Space>
          <Text>{details}</Text>
        </Space>
      </Card>
    );
  };

  return (
    <div className="market-analysis-container">
      <Card
        title={
          <Space>
            <LineChartOutlined style={{ color: '#1890ff', fontSize: '20px' }} />
            <span>Rise/Fall Market Analysis</span>
          </Space>
        }
        extra={
          <Space>
            <Text>Simple Mode</Text>
            <Switch 
              size="small" 
              checked={simpleMode} 
              onChange={setSimpleMode} 
            />
          </Space>
        }
        className="market-analysis-card"
        bodyStyle={{ padding: simpleMode ? '16px 8px' : 16 }}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Select
                value={symbol}
                onChange={setSymbol}
                style={{ width: '100%' }}
                placeholder="Select Symbol"
                optionLabelProp="label"
              >
                {volatilityOptions.map((option) => (
                  <Option 
                    key={option.value} 
                    value={option.value}
                    label={
                      <Space>
                        <Text strong>{option.value}</Text>
                        <Text type="secondary">{option.label}</Text>
                      </Space>
                    }
                  >
                    <div>
                      <Text strong>{option.value}</Text>
                      <div style={{ fontSize: 12 }}>{option.label}</div>
                    </div>
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} md={12}>
              <Card size="small" bodyStyle={{ padding: '8px 16px' }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic
                      title="Current Price"
                      value={ticks.length > 0 ? ticks[ticks.length - 1].price : '--'}
                      precision={2}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Last Change"
                      value={
                        ticks.length > 1 ? 
                        (ticks[ticks.length - 1].price - ticks[ticks.length - 2].price).toFixed(2) : 
                        '--'
                      }
                      valueStyle={{
                        color: ticks.length > 1 ? 
                          (ticks[ticks.length - 1].price > ticks[ticks.length - 2].price ? 
                            '#52c41a' : '#f5222d') : 'inherit'
                      }}
                      prefix={
                        ticks.length > 1 ? 
                          (ticks[ticks.length - 1].price > ticks[ticks.length - 2].price ? 
                            <ArrowUpOutlined /> : <ArrowDownOutlined />) : null
                      }
                    />
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>

          {error && (
            <Alert message={error} type="error" showIcon />
          )}

          <Spin spinning={loading} tip="Loading market data...">
            {simpleMode ? (
              <Card 
                style={{ width: '100%' }}
                bodyStyle={{ padding: 16 }}
              >
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  <SignalIndicator 
                    signal={combinedSignal.signal} 
                    strength={combinedSignal.confidence} 
                  />
                  <Text>{combinedSignal.details}</Text>
                  <Text type="secondary">
                    <small>Based on {ticks.length} recent ticks</small>
                  </Text>
                </Space>
              </Card>
            ) : (
              <Tabs 
                defaultActiveKey="combined"
                size="small"
                tabPosition="top"
                type="line"
                style={{ marginTop: 8 }}
              >
                {analyses.map((analysis) => (
                  <TabPane 
                    tab={
                      <Space size={4}>
                        <span>{analysis.name}</span>
                        {analysis.key === 'combined' && (
                          <Badge 
                            dot 
                            color={
                              combinedSignal.signal === 'rise' ? '#52c41a' :
                              combinedSignal.signal === 'fall' ? '#f5222d' : '#faad14'
                            }
                          />
                        )}
                      </Space>
                    } 
                    key={analysis.key}
                  >
                    {renderAnalysis(analysis)}
                  </TabPane>
                ))}
              </Tabs>
            )}
          </Spin>
        </Space>
      </Card>
    </div>
  );
};

export default RiseFallMarketAnalysis;