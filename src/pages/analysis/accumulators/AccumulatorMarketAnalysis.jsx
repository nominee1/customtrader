import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Select,
  Tabs,
  Spin,
  Progress,
  Typography,
  Collapse,
  theme,
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
  RiseOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  BellOutlined,
} from '@ant-design/icons';
import { Line } from '@ant-design/charts';
import { publicWebSocket } from '../../../services/public_websocket_client';
import {
  analyzeTickMomentum,
  analyzeRangeStability,
  analyzeVolatilitySpike,
  analyzeRisk,
  analyzeTickCount,
  combineSignals,
} from './accumulatorAnalysis';
import { useUser } from '../../../context/AuthContext';
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

const barrierConfig = {
  'R_10': { '0.01': 0.3872, '0.02': 0.3619, '0.03': 0.3394, '0.04': 0.3229, '0.05': 0.3074 },
  '1HZ10V': { '0.01': 0.389, '0.02': 0.364, '0.03': 0.341, '0.04': 0.325, '0.05': 0.309 },
  'R_25': { '0.01': 0.418, '0.02': 0.3867, '0.03': 0.3627, '0.04': 0.3451, '0.05': 0.3284 },
  '1HZ25V': { '0.01': 72.209, '0.02': 67.472, '0.03': 63.264, '0.04': 60.196, '0.05': 57.305 },
  'R_50': { '0.01': 0.04311, '0.02': 0.04030, '0.03': 0.03784, '0.04': 0.03601, '0.05': 0.03429 },
  '1HZ50V': { '0.01': 51.488, '0.02': 48.143, '0.03': 45.149, '0.04': 42.923, '0.05': 40.911 },
  'R_75': { '0.01': 45.9254, '0.02': 42.94317, '0.03': 40.32410, '0.04': 38.34462, '0.05': 36.49038 },
  '1HZ75V': { '0.01': 1.583, '0.02': 1.480, '0.03': 1.389, '0.04': 1.322, '0.05': 1.259 },
  'R_100': { '0.01': 0.733, '0.02': 0.686, '0.03': 0.642, '0.04': 0.612, '0.05': 0.583 },
  '1HZ100V': { '0.01': 0.203, '0.02': 0.190, '0.03': 0.178, '0.04': 0.169, '0.05': 0.161 },
};

// TickCountChart: Visualizes tick count and reset points
const TickCountChart = ({ ticks, tickCount, resetTimes, upperBarrier, lowerBarrier }) => {
  const data = ticks.map((tick, index) => ({
    tick: index + 1,
    price: parseFloat(tick.price),
    reset: resetTimes.includes(tick.timestamp) ? 'Reset' : null,
  }));

  const config = {
    data,
    xField: 'tick',
    yField: 'price',
    seriesField: 'reset',
    point: {
      size: 5,
      shape: (item) => (item.reset ? 'diamond' : 'circle'),
      style: (item) => ({
        fill: item.reset ? '#f5222d' : '#1890ff',
      }),
    },
    annotations: [
      {
        type: 'line',
        start: ['min', upperBarrier],
        end: ['max', upperBarrier],
        style: { stroke: '#f5222d', lineWidth: 2, lineDash: [4, 4] },
        text: { content: 'Upper Barrier', position: 'end', style: { fill: '#f5222d' } },
      },
      {
        type: 'line',
        start: ['min', lowerBarrier],
        end: ['max', lowerBarrier],
        style: { stroke: '#52c41a', lineWidth: 2, lineDash: [4, 4] },
        text: { content: 'Lower Barrier', position: 'end', style: { fill: '#52c41a' } },
      },
    ],
    height: 200,
    autoFit: true,
  };

  return (
    <Card size="small" title={<Text style={{ color: 'var(--text-color)' }}>Tick Count & Resets</Text>}>
      <Line {...config} />
      <Text type="secondary">Current Tick Count: {tickCount}</Text>
    </Card>
  );
};

const SignalIndicator = ({ signal, strength, size = 'default', showAlert = false }) => {
  const signalConfig = {
    safe: { color: '#52c41a', icon: <RiseOutlined />, label: 'SAFE', explanation: 'Low risk of barrier breach' },
    risk: { color: '#f5222d', icon: <WarningOutlined />, label: 'RISK', explanation: 'High risk of barrier breach' },
    neutral: { color: '#faad14', icon: <InfoCircleOutlined />, label: 'NEUTRAL', explanation: 'No clear prediction' },
    hold: { color: '#1890ff', icon: <InfoCircleOutlined />, label: 'HOLD', explanation: 'Avoid trading now' },
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
          showZero
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

const AnalysisExplanation = ({ title, content }) => (
  <Tooltip
    title={
      <div style={{ padding: 8 }}>
        <Text strong>{title}</Text>
        <div style={{ marginTop: 4 }}>{content}</div>
      </div>
    }
    style={{ maxWidth: 300 }}
    placement="right"
  >
    <QuestionCircleOutlined style={{ color: '#1890ff', marginLeft: 8 }} />
  </Tooltip>
);

const AccumulatorMarketAnalysis = () => {
  const { balance } = useUser();
  const [symbol, setSymbol] = useState('R_10');
  const [growthRate, setGrowthRate] = useState('0.01');
  const { token } = theme.useToken();
  const [tickData, setTickData] = useState({});
  const [loading, setLoading] = useState(true);
  const [simpleMode, setSimpleMode] = useState(false);
  const [showAlert, setShowAlert] = useState(true);
  const [error, setError] = useState(null);
  const [analysisState, setAnalysisState] = useState({}); // Store tickCount, resetTimes, initialPrice per symbol and growth rate
  const userBalance = balance;

  const formatPrice = (price) => {
    if (typeof price !== 'number' && typeof price !== 'string') return '--';
    const priceStr = price.toString().replace(/,/g, '');
    const [integerPart, decimalPart = ''] = priceStr.split('.');
    const normalizedDecimal = decimalPart.padEnd(2, '0').slice(0, 2);
    return `${integerPart}.${normalizedDecimal}`;
  };

  // Initialize analysis state for new symbol or growth rate
  useEffect(() => {
    setAnalysisState((prev) => ({
      ...prev,
      [symbol]: {
        ...prev[symbol],
        [growthRate]: {
          tickCount: 0,
          resetTimes: [],
          initialPrice: tickData[symbol]?.[0]?.price ? parseFloat(tickData[symbol][0].price) : 0,
        },
      },
    }));
  }, [symbol, growthRate, tickData]);

  // Barrier and tick count logic
  const barrier = barrierConfig[symbol]?.[growthRate] || 1.0;
  const currentState = analysisState[symbol]?.[growthRate] || { tickCount: 0, resetTimes: [], initialPrice: 0 };
  const { tickCount, resetTimes, initialPrice } = currentState;
  const upperBarrier = initialPrice + barrier;
  const lowerBarrier = initialPrice - barrier;

  useEffect(() => {
    let unsubscribers = [];
    let isMounted = true;

    const subscribeToAllSymbols = async () => {
      setLoading(true);
      let retryCount = 0;
      const maxRetries = 5;
      const connectWithRetry = async () => {
        while (retryCount < maxRetries) {
          try {
            await publicWebSocket.connect();
            return true;
          } catch (err) {
            retryCount++;
            console.error(`WebSocket connection failed (attempt ${retryCount}/${maxRetries})`, err);
            await new Promise((res) => setTimeout(res, 1000 * Math.pow(2, retryCount)));
          }
        }
        return false;
      };
      try {
        const connected = await connectWithRetry();
        if (!connected) {
          setError('Unable to connect after multiple attempts. Please try again later.');
          setLoading(false);
          return;
        }
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
            setTickData((prev) => {
              const newTicks = [...(prev[tickSymbol] || []), { price: quote, timestamp: epoch }].slice(-60);
              // Update tick count and reset times for the current symbol and growth rate
              if (tickSymbol === symbol) {
                const currentBarrier = barrierConfig[symbol]?.[growthRate] || 1.0;
                setAnalysisState((prevState) => {
                  const state = prevState[symbol]?.[growthRate] || {
                    tickCount: 0,
                    resetTimes: [],
                    initialPrice: parseFloat(quote),
                  };
                  const price = parseFloat(quote);
                  const currentUpper = state.initialPrice + currentBarrier;
                  const currentLower = state.initialPrice - currentBarrier;

                  if (price >= currentLower && price <= currentUpper) {
                    return {
                      ...prevState,
                      [symbol]: {
                        ...prevState[symbol],
                        [growthRate]: {
                          ...state,
                          tickCount: state.tickCount + 1,
                        },
                      },
                    };
                  } else {
                    return {
                      ...prevState,
                      [symbol]: {
                        ...prevState[symbol],
                        [growthRate]: {
                          tickCount: 0,
                          resetTimes: [...state.resetTimes, epoch],
                          initialPrice: price,
                        },
                      },
                    };
                  }
                });
              }
              return { ...prev, [tickSymbol]: newTicks };
            });
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
              // Initialize tick count for historical data
              if (symbol === symbol) {
                setAnalysisState((prevState) => {
                  const state = prevState[symbol]?.[growthRate] || {
                    tickCount: 0,
                    resetTimes: [],
                    initialPrice: historicalTicks[0]?.price ? parseFloat(historicalTicks[0].price) : 0,
                  };
                  let count = 0;
                  let resets = [];
                  let currentInitial = state.initialPrice;
                  const currentBarrier = barrierConfig[symbol]?.[growthRate] || 1.0;

                  historicalTicks.forEach((tick) => {
                    const price = parseFloat(tick.price);
                    const currentUpper = currentInitial + currentBarrier;
                    const currentLower = currentInitial - currentBarrier;
                    if (price >= currentLower && price <= currentUpper) {
                      count++;
                    } else {
                      if (count > 0) resets.push(tick.timestamp);
                      count = 0;
                      currentInitial = price;
                    }
                  });

                  return {
                    ...prevState,
                    [symbol]: {
                      ...prevState[symbol],
                      [growthRate]: {
                        tickCount: count,
                        resetTimes: resets,
                        initialPrice: currentInitial,
                      },
                    },
                  };
                });
              }
            }
            setLoading(false);
          } else if (event === 'error') {
            console.error('WebSocket error:', data);
            setError('A connection issue occurred while retrieving data.');
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
  }, [symbol, growthRate]);

  const combinedSignal = useMemo(
    () => combineSignals(tickData[symbol] || [], symbol, growthRate, userBalance, upperBarrier, lowerBarrier, tickCount, resetTimes),
    [tickData, symbol, growthRate, userBalance, upperBarrier, lowerBarrier, tickCount, resetTimes]
  );

  const analyses = [
    {
      key: 'momentum',
      name: 'Tick Momentum',
      func: () => analyzeTickMomentum(tickData[symbol] || [], symbol, upperBarrier, lowerBarrier),
      explanation: 'Measures rate of price changes to predict directional trends toward barriers.',
    },
    {
      key: 'range',
      name: 'Range Stability',
      func: () => analyzeRangeStability(tickData[symbol] || [], upperBarrier, lowerBarrier, growthRate),
      explanation: 'Checks if prices stay within barriers for the selected growth rate.',
    },
    {
      key: 'tickCount',
      name: 'Tick Count',
      func: () => analyzeTickCount(tickCount, resetTimes),
      explanation: 'Tracks number of ticks within range and reset events.',
    },
    {
      key: 'volatility',
      name: 'Volatility',
      func: () => analyzeVolatilitySpike(tickData[symbol] || []),
      explanation: 'Detects sudden price movements that increase barrier breach risk.',
    },
    {
      key: 'risk',
      name: 'Risk',
      func: () => analyzeRisk(balance, symbol),
      explanation: 'Calculates optimal stake size based on balance and market conditions.',
    },
    {
      key: 'combined',
      name: 'Summary',
      func: () => combinedSignal,
      explanation: 'Combines indicators to recommend trading or holding.',
    },
  ];

  const renderAnalysis = (analysis) => {
    if (!analysis) return <Text>No data available for analysis.</Text>;

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
            type={signal === 'safe' ? 'success' : signal === 'risk' ? 'error' : 'info'}
            showIcon
          />
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <TickCountChart
                ticks={tickData[symbol] || []}
                tickCount={tickCount}
                resetTimes={resetTimes}
                upperBarrier={upperBarrier}
                lowerBarrier={lowerBarrier}
              />
            </Col>
          </Row>
          <Collapse ghost>
            <Panel header={<Text style={{ color: 'var(--text-color)' }}>Detailed Indicators</Text>} key="details">
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
                        <Text type="secondary" style={{ color: 'var(--text-color)' }}>
                          {res?.details || 'No details'}
                        </Text>
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
          {analysis.key === 'tickCount' && (
            <TickCountChart
              ticks={tickData[symbol]?.slice(0, 10) || []}
              tickCount={tickCount}
              resetTimes={resetTimes}
              upperBarrier={upperBarrier}
              lowerBarrier={lowerBarrier}
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
            <Title level={4} style={{ margin: 0, color: token.colorPrimary }}>
              Accumulator Market Analysis
            </Title>
          </Space>
        }
        extra={
          <Space>
            <Tooltip title="Toggle simple mode">
              <Switch size="small" checked={simpleMode} onChange={setSimpleMode} />
            </Tooltip>
            <Tooltip title="Toggle alerts">
              <Switch size="small" checked={showAlert} onChange={setShowAlert} />
            </Tooltip>
          </Space>
        }
        className="market-analysis-card"
        style={{ padding: simpleMode ? '16px 8px' : 16 }}
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
              <div style={{ marginTop: 16 }}>
                <Select
                  value={growthRate}
                  onChange={setGrowthRate}
                  style={{ width: '100%' }}
                  placeholder="Select Growth Rate"
                >
                  {['0.01', '0.02', '0.03', '0.04', '0.05'].map((rate) => (
                    <Option key={rate} value={rate}>
                      Growth Rate: {(parseFloat(rate) * 100).toFixed(0)}%
                    </Option>
                  ))}
                </Select>
              </div>
            </Col>
            <Col xs={24} md={12}>
              <Card size="small" style={{ padding: '8px 16px' }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic
                      title={<Text style={{ color: 'var(--text-color)' }}>Current Price</Text>}
                      value={
                        tickData[symbol]?.length > 0
                          ? formatPrice(tickData[symbol][tickData[symbol].length - 1].price)
                          : '--'
                      }
                      valueStyle={{
                        color: tickCount === 0 ? '#f5222d' : '#52c41a',
                      }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title={<Text style={{ color: 'var(--text-color)' }}>Range Status</Text>}
                      value={tickCount === 0 ? 'Reset' : 'Within Range'}
                      prefix={<RiseOutlined />}
                      valueStyle={{
                        color: tickCount === 0 ? '#f5222d' : '#52c41a',
                      }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title={<Text style={{ color: 'var--text-color)' }}>Tick Count</Text>}
                      value={tickCount}
                      prefix={<LineChartOutlined />}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title={<Text style={{ color: 'var(--text-color)' }}>Last Reset</Text>}
                      value={
                        resetTimes.length > 0
                          ? new Date(resetTimes[resetTimes.length - 1] * 1000).toLocaleTimeString()
                          : '--'
                      }
                      prefix={<WarningOutlined />}
                    />
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
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
                    <Text>{combinedSignal.details}</Text>
                    <Text type="secondary" style={{ color: 'var(--text-color)' }}>
                      <small>Based on {(tickData[symbol] || []).length} recent ticks</small>
                    </Text>
                  </Space>
                </Card>
                <TickCountChart
                  ticks={tickData[symbol]?.slice(0, 10) || []}
                  tickCount={tickCount}
                  resetTimes={resetTimes}
                  upperBarrier={upperBarrier}
                  lowerBarrier={lowerBarrier}
                />
              </Space>
            ) : (
              <Tabs defaultActiveKey="combined" size="small" tabPosition="top" type="line" style={{ marginTop: 8 }}>
                {analyses.map((analysis) => (
                  <TabPane
                    tab={
                      <Space size={4}>
                        <span>{analysis.name}</span>
                        {analysis.key === 'combined' && (
                          <Badge
                            dot
                            color={
                              combinedSignal.signal === 'safe'
                                ? '#52c41a'
                                : combinedSignal.signal === 'risk'
                                ? '#f5222d'
                                : '#faad14'
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

export default AccumulatorMarketAnalysis;