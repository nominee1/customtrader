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
} from './overUnderAnalysis';
import CandlestickChart from './OverUnderCandlestickChart';
import '../../../assets/css/pages/analysis/MarketAnalysis.css';
import { useUser } from '../../../context/AuthContext';

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

const DigitHistoryChart = ({ digits, barrier }) => {
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
                  backgroundColor: digit > barrier ? '#52c41a' : '#f5222d',
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

const DigitBarIndicator = ({ digit, barrier }) => {
  const isOver = digit > barrier;
  const distance = Math.abs(digit - barrier);
  const percentage = Math.min(100, distance * 20);

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center',
      gap: 8,
      width: '100%',
      padding: '8px 0',
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
      <Text type={isOver ? 'success' : 'danger'}>
        {isOver ? 'OVER' : 'UNDER'}
      </Text>
    </div>
  );
};

const SignalIndicator = ({ signal, strength, barrier, size = 'default', showAlert = false }) => {
  const signalConfig = {
    over: { 
      color: '#52c41a', 
      icon: <ArrowUpOutlined />, 
      label: `OVER ${barrier}`,
      explanation: `The last digit is likely to be above ${barrier}`,
    },
    under: { 
      color: '#f5222d', 
      icon: <ArrowDownOutlined />, 
      label: `UNDER ${barrier}`,
      explanation: `The last digit is likely to be below ${barrier}`,
    },
    neutral: { 
      color: '#faad14', 
      icon: <PauseOutlined />, 
      label: 'NEUTRAL',
      explanation: 'No clear direction for last digit prediction',
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
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 8,
        padding: isSmall ? '4px 8px' : '8px 12px',
        backgroundColor: isSmall ? 'transparent' : '#fafafa',
        borderRadius: 8,
        border: isSmall ? 'none' : `1px solid ${config.color}`,
        position: 'relative',
      }}>
        {showAlert && strength > 0.7 && (
          <div style={{
            position: 'absolute',
            left: -12,
            top: -4,
            color: config.color,
            animation: 'pulse 1.5s infinite',
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
              gap: 4,
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
  <Tooltip title={<div style={{ padding: 8 }}><Text strong>{title}</Text><div style={{ marginTop: 4 }}>{content}</div></div>} overlayStyle={{ maxWidth: 300 }} placement="right">
    <QuestionCircleOutlined style={{ color: '#1890ff', marginLeft: 8 }} />
  </Tooltip>
);

const OverUnderMarketAnalysis = () => {
  const { balance } = useUser();
  const [symbol, setSymbol] = useState('R_10');
  const [tickData, setTickData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [simpleMode, setSimpleMode] = useState(false);
  const [barrier, setBarrier] = useState(4);
  const [showAlert, setShowAlert] = useState(true);
  const userBalance = balance;

  useEffect(() => {
    let unsubscribers = [];
    let isMounted = true;

    const subscribeToAllSymbols = async () => {
      setLoading(true);
      setError(null);
      try {
        await publicWebSocket.connect();
        if (!isMounted) return;

        setTickData((prev) => {
          const updated = { ...prev };
          volatilityOptions.forEach((option) => {
            if (!updated[option.value]) updated[option.value] = [];
          });
          return updated;
        });

        const handleTick = (event, data) => {
          if (!isMounted) return;
          if (event === 'message' && data.msg_type === 'tick') {
            const { symbol: tickSymbol, quote, epoch } = data.tick;
            setTickData((prev) => ({
              ...prev,
              [tickSymbol]: [...(prev[tickSymbol] || []), { price: quote, timestamp: epoch }].slice(-60),
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
            setError('WebSocket error occurred');
            setLoading(false);
          }
        };

        volatilityOptions.forEach((option) => {
          const unsubscribe = publicWebSocket.subscribe(handleTick);
          unsubscribers.push(unsubscribe);
          publicWebSocket.subscribeToTicks(option.value);
        });

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
        console.error('WebSocket Error:', err);
        if (isMounted) {
          setError('Failed to connect to WebSocket. Please check your network or app ID.');
          setLoading(false);
        }
      }
    };

    subscribeToAllSymbols();

    return () => {
      isMounted = false;
      unsubscribers.forEach((unsub) => unsub());
      volatilityOptions.forEach((option) => publicWebSocket.unsubscribe(option.value));
      publicWebSocket.close();
    };
  }, []);

  const lastDigits = useMemo(() => {
    const ticks = tickData[symbol] || [];
    return ticks.map((tick) => {
      const priceStr = tick.price.toString();
      return parseInt(priceStr[priceStr.length - 1]);
    }).reverse();
  }, [tickData, symbol]);

  const lastDigit = useMemo(() => {
    if (lastDigits.length === 0) return null;
    return lastDigits[0];
  }, [lastDigits]);

  const combinedSignal = useMemo(() => {
    const signal = combineSignals(tickData[symbol] || [], symbol, userBalance, barrier);
    if (signal.details) {
      signal.details = signal.details.replace(/barrier \d+/, `barrier ${barrier}`);
    }
    return signal;
  }, [tickData, symbol, userBalance, barrier]);

  const analyses = [
    {
      key: 'sma',
      name: 'SMA',
      func: () => analyzeSMACrossover(tickData[symbol] || [], symbol, 5, 10, barrier),
      explanation: 'Moving average of last digits. Predicts if digits will stay above/below your barrier.',
    },
    {
      key: 'stochastic',
      name: 'Stochastic',
      func: () => analyzeStochastic(tickData[symbol] || [], symbol, barrier),
      explanation: 'Shows most frequent digits. Helps identify digit clustering patterns relative to your barrier.',
    },
    {
      key: 'streak',
      name: 'Streak',
      func: () => analyzeTickStreak(tickData[symbol] || [], symbol, barrier),
      explanation: 'Identifies consecutive Over/Under sequences. Long streaks often reverse.',
    },
    {
      key: 'volatility',
      name: 'Volatility',
      func: () => analyzeVolatilitySpike(tickData[symbol] || []),
      explanation: 'Measures digit fluctuation speed. High volatility means unpredictable digits.',
    },
    {
      key: 'risk',
      name: 'Risk',
      func: () => analyzeRisk(userBalance, symbol),
      explanation: 'Calculates optimal stake size based on your balance and market conditions.',
    },
    {
      key: 'combined',
      name: 'Summary',
      func: () => combinedSignal,
      explanation: 'Combines all indicators to provide the overall trading recommendation.',
    },
  ];

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
                  barrier={barrier}
                  showAlert={showAlert && confidence > 0.7}
                />
              </Space>
            }
            description={details}
            type={
              signal === 'over' ? 'success' :
              signal === 'under' ? 'error' :
              signal === 'warning' ? 'warning' : 'info'
            }
            showIcon
          />
          
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <CandlestickChart ticks={tickData[symbol] || []} simpleMode={simpleMode} symbol={symbol} barrier={barrier} />
            </Col>
            <Col span={24}>
              <DigitHistoryChart digits={lastDigits} barrier={barrier} />
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
                        <AnalysisExplanation title={analyses.find(a => a.key === key)?.name} content={analyses.find(a => a.key === key)?.explanation} />
                      </Space>
                    }>
                      <Space direction="vertical">
                        <SignalIndicator signal={res?.signal} strength={res?.strength} barrier={barrier} size="small" />
                        <Text type="secondary">{res?.details || 'No details'}</Text>
                        {(key === 'sma' || key === 'stochastic') && res?.rawData && (
                          <DigitBarIndicator 
                            digit={key === 'stochastic' ? res.rawData.maxDigit : Math.round(res.rawData.fastSMA)} 
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
            <SignalIndicator signal={signal} strength={strength} barrier={barrier} size="small" />
            <AnalysisExplanation title={analysis.name} content={analysis.explanation} />
          </Space>
          <Text>{details}</Text>
          {(analysis.key === 'sma' || analysis.key === 'stochastic') && rawData && (
            <DigitBarIndicator 
              digit={analysis.key === 'stochastic' ? rawData.maxDigit : Math.round(rawData.fastSMA)} 
              barrier={barrier} 
            />
          )}
          {analysis.key === 'streak' && rawData && (
            <DigitHistoryChart digits={rawData.slice(0, 10).map(item => item.digit)} barrier={barrier} />
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
                      value={tickData[symbol]?.length > 0 ? tickData[symbol][tickData[symbol].length - 1].price : '--'}
                      precision={2}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Last Digit"
                      value={lastDigit !== null ? lastDigit : '--'}
                      prefix={<NumberOutlined />}
                      valueStyle={{ color: lastDigit !== null ? (lastDigit > barrier ? '#52c41a' : '#f5222d') : 'inherit' }}
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
                    marks={{ 0: '0', 4: '4', 9: '9' }}
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
                  <Text>
                    Recent digits: {lastDigits.slice(0, 10).filter(d => d > barrier).length}/10 over barrier,{' '}
                    {lastDigits.slice(0, 10).filter(d => d <= barrier).length}/10 under barrier
                  </Text>
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
                      barrier={barrier}
                      showAlert={showAlert && combinedSignal.confidence > 0.7}
                    />
                    {lastDigit !== null && (
                      <DigitBarIndicator digit={lastDigit} barrier={barrier} />
                    )}
                    <Text>{combinedSignal.details}</Text>
                    <Text type="secondary"><small>Based on {(tickData[symbol] || []).length} recent ticks</small></Text>
                  </Space>
                </Card>
                <CandlestickChart ticks={tickData[symbol] || []} simpleMode={simpleMode} symbol={symbol} barrier={barrier} />
                <DigitHistoryChart digits={lastDigits.slice(0, 10)} barrier={barrier} />
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
                              combinedSignal.signal === 'over' ? '#52c41a' :
                              combinedSignal.signal === 'under' ? '#f5222d' : '#faad14'
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