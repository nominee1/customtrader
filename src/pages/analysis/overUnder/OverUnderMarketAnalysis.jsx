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
  Switch,
  Slider,
  InputNumber,
  List
} from 'antd';
import { 
  LineChartOutlined, 
  QuestionCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  PauseOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  NumberOutlined,
  BellOutlined
} from '@ant-design/icons';
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
const { Text, Title } = Typography;
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

const DigitHistoryChart = ({ digits }) => {
  // Group digits into chunks for better mobile display
  const chunkSize = 5;
  const digitGroups = [];
  for (let i = 0; i < digits.length; i += chunkSize) {
    digitGroups.push(digits.slice(i, i + chunkSize));
  }

  return (
    <Card size="small" title="Recent Digits History">
      <Space direction="vertical" style={{ width: '100%' }}>
        {digitGroups.map((group, groupIndex) => (
          <div key={groupIndex} style={{ display: 'flex', justifyContent: 'center' }}>
            {group.map((digit, index) => (
              <div 
                key={`${groupIndex}-${index}`} 
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: '#1890ff',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: 4,
                  fontWeight: 'bold'
                }}
              >
                {digit}
              </div>
            ))}
          </div>
        ))}
      </Space>
    </Card>
  );
};

const DigitBarIndicator = ({ digit, barrier }) => {
  const isOver = digit > barrier;
  const distance = Math.abs(digit - barrier);
  const percentage = Math.min(100, distance * 20); // Scale for visualization

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center',
      gap: 8,
      width: '100%',
      padding: '8px 0'
    }}>
      <Text strong style={{ width: 24 }}>{digit}</Text>
      <Progress 
        percent={percentage}
        strokeColor={isOver ? '#52c41a' : '#f5222d'}
        showInfo={false}
        strokeWidth={10}
        trailColor="#f0f0f0"
      />
      <Text type="secondary" style={{ width: 24 }}>{barrier}</Text>
      <Text type={isOver ? "success" : "danger"}>
        {isOver ? 'OVER' : 'UNDER'}
      </Text>
    </div>
  );
};

const SignalIndicator = ({ signal, strength, size = 'default', showAlert = false }) => {
  const signalConfig = {
    over: { 
      color: '#52c41a', 
      icon: <ArrowUpOutlined />, 
      label: 'OVER',
      explanation: 'The last digit is likely to be above the barrier'
    },
    under: { 
      color: '#f5222d', 
      icon: <ArrowDownOutlined />, 
      label: 'UNDER',
      explanation: 'The last digit is likely to be below the barrier'
    },
    neutral: { 
      color: '#faad14', 
      icon: <PauseOutlined />, 
      label: 'NEUTRAL',
      explanation: 'No clear direction for last digit prediction'
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

  // Handle signals like "over_4" or "under_4"
  const baseSignal = signal?.split('_')[0] || 'neutral';
  const config = signalConfig[baseSignal] || signalConfig.neutral;
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
        border: isSmall ? 'none' : `1px solid ${config.color}`,
        position: 'relative'
      }}>
        {showAlert && strength > 0.7 && (
          <div style={{
            position: 'absolute',
            left: -12,
            top: -4,
            color: config.color,
            animation: 'pulse 1.5s infinite'
          }}>
            <BellOutlined />
          </div>
        )}
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

const OverUnderMarketAnalysis = () => {
  const [symbol, setSymbol] = useState('R_10');
  const [ticks, setTicks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [simpleMode, setSimpleMode] = useState(false);
  const [barrier, setBarrier] = useState(4);
  const [showAlert, setShowAlert] = useState(true);
  const balance = 1000;

  // Memoized combined signal with current barrier
  const combinedSignal = useMemo(() => {
    const signal = combineSignals(ticks, symbol, balance, barrier);
    // Modify signal details to include barrier info
    if (signal.details) {
      signal.details = signal.details.replace(/barrier \d+/, `barrier ${barrier}`);
    }
    return signal;
  }, [ticks, symbol, balance, barrier]);

  // Get last digits from recent ticks
  const lastDigits = useMemo(() => {
    return ticks.map(tick => {
      const priceStr = tick.price.toString();
      return parseInt(priceStr[priceStr.length - 1]);
    }).reverse(); // Show most recent first
  }, [ticks]);

  // Get last digit from latest tick
  const lastDigit = useMemo(() => {
    if (lastDigits.length === 0) return null;
    return lastDigits[0];
  }, [lastDigits]);

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
              return newTicks.slice(-30); // Keep last 30 ticks
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

  // Analysis functions with barrier parameter
  const analyses = [
    {
      key: 'sma',
      name: 'SMA',
      func: () => analyzeSMACrossover(ticks, symbol, 5, 10, barrier),
      explanation: 'Moving average of last digits. Predicts if digits will stay above/below your barrier.'
    },
    {
      key: 'stochastic',
      name: 'Stochastic',
      func: () => analyzeStochastic(ticks, symbol, barrier),
      explanation: 'Shows most frequent digits. Helps identify digit clustering patterns relative to your barrier.'
    },
    {
      key: 'streak',
      name: 'Streak',
      func: () => analyzeTickStreak(ticks, symbol, barrier),
      explanation: 'Identifies consecutive Over/Under sequences. Long streaks often reverse.'
    },
    {
      key: 'volatility',
      name: 'Volatility',
      func: () => analyzeVolatilitySpike(ticks),
      explanation: 'Measures digit fluctuation speed. High volatility means unpredictable digits.'
    },
    {
      key: 'risk',
      name: 'Risk',
      func: () => analyzeRisk(balance, symbol),
      explanation: 'Calculates optimal stake size based on your balance and market conditions.'
    },
    {
      key: 'combined',
      name: 'Summary',
      func: () => combinedSignal,
      explanation: 'Combines all indicators to provide the overall trading recommendation.'
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
                <SignalIndicator 
                  signal={signal} 
                  strength={confidence} 
                  showAlert={showAlert && confidence > 0.7}
                />
              </Space>
            }
            description={details}
            type={
              signal?.startsWith('over') ? 'success' :
              signal?.startsWith('under') ? 'error' :
              signal === 'warning' ? 'warning' : 'info'
            }
            showIcon
          />
          
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <DigitHistoryChart digits={lastDigits} />
            </Col>
          </Row>

          <Collapse ghost>
            <Panel header="Detailed Indicators" key="details">
              <Row gutter={[16, 16]}>
                {Object.entries(individualSignals).map(([key, res]) => (
                  <Col xs={24} sm={12} md={8} key={key}>
                    <Card size="small" title={
                      <Space>
                        <Text>{key.toUpperCase()}</Text>
                        <Tooltip title={analyses.find(a => a.key === key)?.explanation}>
                          <QuestionCircleOutlined style={{ color: '#1890ff' }} />
                        </Tooltip>
                      </Space>
                    }>
                      <Space direction="vertical">
                        <SignalIndicator signal={res?.signal} strength={res?.strength} size="small" />
                        <Text type="secondary">{res?.details || 'No details'}</Text>
                        {(key === 'sma' || key === 'stochastic') && res?.rawData && (
                          <DigitBarIndicator 
                            digit={key === 'stochastic' ? res.rawData.maxDigit : res.rawData.fastSMA} 
                            barrier={barrier} 
                          />
                        )}
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

    const { signal, strength, details, rawData } = result;
    return (
      <Card size="small">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space>
            <SignalIndicator signal={signal} strength={strength} size="small" />
            <Tooltip title={analysis.explanation}>
              <QuestionCircleOutlined style={{ color: '#1890ff' }} />
            </Tooltip>
          </Space>
          <Text>{details}</Text>
          {(analysis.key === 'sma' || analysis.key === 'stochastic') && rawData && (
            <DigitBarIndicator 
              digit={analysis.key === 'stochastic' ? rawData.maxDigit : rawData.fastSMA} 
              barrier={barrier} 
            />
          )}
          {analysis.key === 'streak' && rawData && (
            <DigitHistoryChart digits={rawData.slice(0, 10).map(item => item.digit)} />
          )}
        </Space>
      </Card>
    );
  };

  return (
    <div className="market-analysis-container">
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
      
      <Card
        title={
          <Space>
            <NumberOutlined style={{ color: '#1890ff', fontSize: '20px' }} />
            <span>Over/Under Market Analysis</span>
          </Space>
        }
        extra={
          <Space>
            <Tooltip title="Toggle simple mode">
              <Switch 
                size="small" 
                checked={simpleMode} 
                onChange={setSimpleMode} 
              />
            </Tooltip>
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
                      title="Last Digit"
                      value={lastDigit !== null ? lastDigit : '--'}
                      prefix={<NumberOutlined />}
                    />
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>

          <Card size="small" title="Barrier Configuration">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Row gutter={16}>
                <Col xs={14} sm={16}>
                  <Slider
                    min={0}
                    max={9}
                    value={barrier}
                    onChange={setBarrier}
                    marks={{
                      0: '0',
                      4: '4',
                      9: '9'
                    }}
                  />
                </Col>
                <Col xs={10} sm={8}>
                  <InputNumber
                    min={0}
                    max={9}
                    value={barrier}
                    onChange={setBarrier}
                    style={{ width: '100%' }}
                  />
                </Col>
              </Row>
              <Row>
                <Col span={24}>
                  <Space>
                    <Text>Visual Alerts:</Text>
                    <Switch 
                      size="small" 
                      checked={showAlert} 
                      onChange={setShowAlert} 
                    />
                  </Space>
                </Col>
              </Row>
            </Space>
          </Card>

          {error && (
            <Alert message={error} type="error" showIcon />
          )}

          <Spin spinning={loading} tip="Loading market data...">
            {simpleMode ? (
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Card>
                  <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <SignalIndicator 
                      signal={combinedSignal.signal} 
                      strength={combinedSignal.confidence} 
                      showAlert={showAlert && combinedSignal.confidence > 0.7}
                    />
                    {lastDigit !== null && (
                      <DigitBarIndicator digit={lastDigit} barrier={barrier} />
                    )}
                    <Text>{combinedSignal.details}</Text>
                  </Space>
                </Card>
                
                <DigitHistoryChart digits={lastDigits.slice(0, 10)} />
              </Space>
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
                              combinedSignal.signal?.startsWith('over') ? '#52c41a' :
                              combinedSignal.signal?.startsWith('under') ? '#f5222d' : '#faad14'
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

export default OverUnderMarketAnalysis;