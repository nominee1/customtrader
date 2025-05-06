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
} from 'antd';
import {
  LineChartOutlined,
  QuestionCircleOutlined,
  NumberOutlined,
  PauseOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  BellOutlined,
} from '@ant-design/icons';
import { publicWebSocket } from '../../../services/public_websocket_client';
import {
  analyzeSMACrossover,
  analyzeStochastic,
  analyzeTickStreak,
  analyzeVolatilitySpike,
  analyzeRisk,
  combineSignals,
} from './evenOddAnalysis';
import '../../../assets/css/pages/analysis/MarketAnalysis.css';

const { Option } = Select;
const { TabPane } = Tabs;
const { Text } = Typography;
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

// DigitHistoryChart (reused from MatchesDiffers)
const DigitHistoryChart = ({ digits, isEven }) => {
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
                  backgroundColor: digit % 2 === 0 ? '#52c41a' : '#f5222d',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: 4,
                  fontWeight: 'bold',
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

// EvenOddIndicator (new, inspired by DigitBarIndicator)
const EvenOddIndicator = ({ digit }) => {
  const isEven = digit % 2 === 0;
  const strength = isEven ? 80 : 20; // Fixed strength for visualization

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 0' }}>
      <Text strong style={{ width: 24 }}>{digit}</Text>
      <Progress
        percent={strength}
        strokeColor={isEven ? '#52c41a' : '#f5222d'}
        showInfo={false}
        strokeWidth={10}
        trailColor="#f0f0f0"
      />
      <Text type={isEven ? 'success' : 'danger'}>{isEven ? 'EVEN' : 'ODD'}</Text>
    </div>
  );
};

// SignalIndicator (aligned with RiseFall)
const SignalIndicator = ({ signal, strength, size = 'default', showAlert = false }) => {
  const signalConfig = {
    even: {
      color: '#52c41a',
      icon: <NumberOutlined />,
      label: 'EVEN',
      explanation: 'The last digit is likely to be even',
    },
    odd: {
      color: '#f5222d',
      icon: <NumberOutlined />,
      label: 'ODD',
      explanation: 'The last digit is likely to be odd',
    },
    neutral: {
      color: '#faad14',
      icon: <PauseOutlined />,
      label: 'NEUTRAL',
      explanation: 'No clear prediction for even/odd',
    },
    warning: {
      color: '#fa541c',
      icon: <WarningOutlined />,
      label: 'WARNING',
      explanation: 'High volatility detected - trade with caution',
    },
    hold: {
      color: '#1890ff',
      icon: <InfoCircleOutlined />,
      label: 'HOLD',
      explanation: 'Not recommended to trade at this time',
    },
  };

  const config = signalConfig[signal] || signalConfig.neutral;
  const isSmall = size === 'small';

  return (
    <Tooltip title={config.explanation}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: isSmall ? '4px 8px' : '8px 12px',
          backgroundColor: isSmall ? 'transparent' : '#fafafa',
          borderRadius: 8,
          border: isSmall ? 'none' : `1px solid ${config.color}`,
          position: 'relative',
        }}
      >
        {showAlert && strength > 0.7 && (
          <div
            style={{
              position: 'absolute',
              left: -12,
              top: -4,
              color: config.color,
              animation: 'pulse 1.5s infinite',
            }}
          >
            <BellOutlined />
          </div>
        )}
        <Badge
          color={config.color}
          text={
            <span
              style={{
                color: isSmall ? config.color : 'inherit',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
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

// AnalysisExplanation (reused from RiseFall)
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

const EvenOddMarketAnalysis = () => {
  const [symbol, setSymbol] = useState('R_10');
  const [ticks, setTicks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [simpleMode, setSimpleMode] = useState(false);
  const [showAlert, setShowAlert] = useState(true);
  const balance = 1000;

  // Memoized combined signal
  const combinedSignal = useMemo(() => combineSignals(ticks, symbol, balance), [ticks, symbol, balance]);

  // Get last digits
  const lastDigits = useMemo(() => {
    return ticks
      .map((tick) => {
        const priceStr = tick.price.toString();
        return parseInt(priceStr[priceStr.length - 1]);
      })
      .reverse();
  }, [ticks]);

  // Get last digit
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
              return newTicks.slice(-30);
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

  // Analysis functions with explanations
  const analyses = [
    {
      key: 'sma',
      name: 'SMA',
      func: () => analyzeSMACrossover(ticks, symbol),
      explanation: 'Moving averages of last digits predict if the next digit will be even or odd.',
    },
    {
      key: 'stochastic',
      name: 'Stochastic',
      func: () => analyzeStochastic(ticks, symbol),
      explanation: 'Analyzes digit frequency to identify even/odd clustering patterns.',
    },
    {
      key: 'streak',
      name: 'Streak',
      func: () => analyzeTickStreak(ticks, symbol),
      explanation: 'Identifies consecutive even/odd sequences. Long streaks often reverse.',
    },
    {
      key: 'volatility',
      name: 'Volatility',
      func: () => analyzeVolatilitySpike(ticks),
      explanation: 'Measures digit fluctuation speed. High volatility means unpredictable digits.',
    },
    {
      key: 'risk',
      name: 'Risk',
      func: () => analyzeRisk(balance, symbol),
      explanation: 'Calculates optimal stake size based on your balance and market conditions.',
    },
    {
      key: 'combined',
      name: 'Summary',
      func: () => combinedSignal,
      explanation: 'Combines all indicators to provide the overall trading recommendation.',
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
              signal === 'even' ? 'success' :
              signal === 'odd' ? 'error' :
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
                    <Card
                      size="small"
                      title={
                        <Space>
                          <Text>{key.toUpperCase()}</Text>
                          <AnalysisExplanation
                            title={analyses.find((a) => a.key === key)?.name}
                            content={analyses.find((a) => a.key === key)?.explanation}
                          />
                        </Space>
                      }
                    >
                      <Space direction="vertical">
                        <SignalIndicator signal={res?.signal} strength={res?.strength} size="small" />
                        <Text type="secondary">{res?.details || 'No details'}</Text>
                        {(key === 'sma' || key === 'stochastic') && res?.rawData && (
                          <EvenOddIndicator
                            digit={key === 'stochastic' ? res.rawData.maxDigit : Math.round(res.rawData.fastSMA)}
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
            <AnalysisExplanation title={analysis.name} content={analysis.explanation} />
          </Space>
          <Text>{details}</Text>
          {(analysis.key === 'sma' || analysis.key === 'stochastic') && rawData && (
            <EvenOddIndicator
              digit={analysis.key === 'stochastic' ? rawData.maxDigit : Math.round(rawData.fastSMA)}
            />
          )}
          {analysis.key === 'streak' && rawData && (
            <DigitHistoryChart
              digits={rawData.slice(0, 10).map((item) => item.digit)}
            />
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
            <LineChartOutlined style={{ color: '#1890ff', fontSize: '20px' }} />
            <span>Even/Odd Market Analysis</span>
          </Space>
        }
        extra={
          <Space>
            <Tooltip title="Toggle simple mode">
              <Switch size="small" checked={simpleMode} onChange={setSimpleMode} />
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
                      valueStyle={{
                        color: lastDigit !== null ? (lastDigit % 2 === 0 ? '#52c41a' : '#f5222d') : 'inherit',
                      }}
                    />
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>

          <Card size="small" title="Alert Configuration">
            <Space>
              <Text>Visual Alerts:</Text>
              <Switch size="small" checked={showAlert} onChange={setShowAlert} />
            </Space>
          </Card>

          {error && <Alert message={error} type="error" showIcon />}

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
                    {lastDigit !== null && <EvenOddIndicator digit={lastDigit} />}
                    <Text>{combinedSignal.details}</Text>
                    <Text type="secondary">
                      <small>Based on {ticks.length} recent ticks</small>
                    </Text>
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
                              combinedSignal.signal === 'even' ? '#52c41a' :
                              combinedSignal.signal === 'odd' ? '#f5222d' : '#faad14'
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

export default EvenOddMarketAnalysis;