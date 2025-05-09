import React, { useState, useEffect, useRef, useMemo } from 'react';
import { publicWebSocket } from '../services/public_websocket_client';
import { Card, Row, Col, Select, Button, Spin, Typography, Alert, Tag } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
  Filler,
  AnnotationPlugin,
} from 'chart.js';
import throttle from 'lodash/throttle';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ChartTitle,
  Tooltip,
  Legend,
  Filler,
  AnnotationPlugin
);

const { Option } = Select;
const { Title, Text } = Typography;

const VolatilityComparisonChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [symbols, setSymbols] = useState(['1HZ10V']);
  const [showAviator, setShowAviator] = useState(false);
  const [timeRange, setTimeRange] = useState(60);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [aviatorLoading, setAviatorLoading] = useState(true);
  const subscriptions = useRef({});
  const lastUpdateTime = useRef({});
  const chartRef = useRef(null);

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const processTickData = throttle((newTick) => {
    setData((prevData) => {
      const symbolData = prevData.filter((d) => d.symbol === newTick.symbol).slice(-99);
      const updatedData = [
        ...prevData.filter((d) => d.symbol !== newTick.symbol),
        ...symbolData,
        { ...newTick, isLatest: true },
      ];
      return updatedData.map((item, index, arr) => ({
        ...item,
        isLatest: index === arr.length - 1 && item.symbol === newTick.symbol,
      }));
    });
  }, 1000);

  const getDisplayData = () => {
    const result = [];
    const timePoints = new Set();
    const now = Date.now() / 1000;

    [...data]
      .reverse()
      .filter((item) => now - item.epoch <= timeRange)
      .forEach((item) => {
        if (!timePoints.has(item.time)) {
          timePoints.add(item.time);
          if (timePoints.size <= 8) {
            result.unshift(item);
          }
        }
      });

    return result;
  };

  useEffect(() => {
    publicWebSocket.connect();

    const unsubscribe = publicWebSocket.subscribe((event, data) => {
      if (event === 'message' && data) {
        if (data.error) {
          setError(data.error.message || 'An error occurred');
          setLoading(false);
        } else if (data.tick) {
          const tick = {
            time: formatTime(new Date(data.tick.epoch * 1000)),
            value: data.tick.quote,
            symbol: data.tick.symbol,
            epoch: data.tick.epoch,
            isLatest: false,
          };
          processTickData(tick);
        } else if (data.subscription && data.echo_req?.ticks) {
          subscriptions.current[data.echo_req.ticks] = data.subscription.id;
        }
      } else if (event === 'error') {
        console.log('WebSocket error occurred');
        setLoading(false);
      }
    });

    publicWebSocket.socket.onopen = () => {
      subscribeToTicks();
    };

    publicWebSocket.socket.onclose = () => {
      setError('WebSocket disconnected. Attempting to reconnect...');
      setTimeout(() => {
        if (!publicWebSocket.isConnected?.()) {
          publicWebSocket.connect();
        }
      }, 5000);
    };

    return () => {
      Object.keys(subscriptions.current).forEach((symbol) => {
        publicWebSocket.send({ forget: subscriptions.current[symbol] });
        delete subscriptions.current[symbol];
      });
      unsubscribe();
      publicWebSocket.close();
    };
  }, [symbols]);

  useEffect(() => {
    let interval;
    if (autoRefresh && !showAviator) {
      interval = setInterval(subscribeToTicks, 30000);
    }
    return () => clearInterval(interval);
  }, [autoRefresh, showAviator, symbols]);

  const subscribeToTicks = () => {
    setLoading(true);
    setError(null);
    setData([]);
    Object.keys(subscriptions.current).forEach((symbol) => {
      publicWebSocket.send({ forget: subscriptions.current[symbol] });
      delete subscriptions.current[symbol];
    });

    lastUpdateTime.current = symbols.reduce((acc, symbol) => {
      acc[symbol] = 0;
      return acc;
    }, {});

    symbols.forEach((symbol) => {
      publicWebSocket.send({
        ticks: symbol,
        subscribe: 1,
      });
    });
    setLoading(false);
  };

  const unsubscribeFromTicks = () => {
    Object.keys(subscriptions.current).forEach((symbol) => {
      publicWebSocket.send({ forget: subscriptions.current[symbol] });
      delete subscriptions.current[symbol];
    });
    setData([]);
  };

  const handleSymbolChange = (values) => {
    unsubscribeFromTicks();
    setSymbols(values.length ? values : ['1HZ10V']);
    setData([]);
  };

  const handleTimeRangeChange = (value) => {
    setTimeRange(value);
    setData([]);
    subscribeToTicks();
  };

  const getSymbolDisplayName = (symbol) => {
    const names = {
      R_10: 'Volatility 10',
      '1HZ10V': 'Volatility 10 (1s)',
      R_25: 'Volatility 25',
      '1HZ25V': 'Volatility 25 (1s)',
      R_50: 'Volatility 50',
      '1HZ50V': 'Volatility 50 (1s)',
      R_75: 'Volatility 75',
      '1HZ75V': 'Volatility 75 (1s)',
      R_100: 'Volatility 100',
      '1HZ100V': 'Volatility 100 (1s)',
    };
    return names[symbol] || symbol;
  };

  const chartData = useMemo(() => {
    const displayData = getDisplayData();
    const colorMap = {
      'Volatility 10': 'rgba(24, 144, 255, 1)',
      'Volatility 10 (1s)': 'rgba(24, 144, 255, 1)',
      'Volatility 25': 'rgba(255, 77, 79, 1)',
      'Volatility 25 (1s)': 'rgba(255, 77, 79, 1)',
      'Volatility 50': 'rgba(82, 196, 26, 1)',
      'Volatility 50 (1s)': 'rgba(82, 196, 26, 1)',
      'Volatility 75': 'rgba(250, 173, 20, 1)',
      'Volatility 75 (1s)': 'rgba(250, 173, 20, 1)',
      'Volatility 100': 'rgba(114, 46, 209, 1)',
      'Volatility 100 (1s)': 'rgba(114, 46, 209, 1)',
    };

    const datasets = [];
    const groupedData = {};

    displayData.forEach((item) => {
      if (!groupedData[item.symbol]) groupedData[item.symbol] = [];
      groupedData[item.symbol].push(item);
    });

    Object.keys(groupedData).forEach((symbol) => {
      const symbolData = groupedData[symbol];
      const displayName = getSymbolDisplayName(symbol);
      const ctx = chartRef.current?.canvas?.getContext('2d');
      let gradient;

      if (ctx) {
        gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, colorMap[displayName].replace('1)', '0.3)'));
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      }

      datasets.push({
        label: displayName,
        data: symbolData.map((item) => ({
          x: item.time,
          y: item.value,
          isLatest: item.isLatest,
        })),
        borderColor: colorMap[displayName],
        backgroundColor: gradient || colorMap[displayName],
        borderWidth: 2,
        tension: 0.1,
        pointRadius: symbolData.map((item) => (item.isLatest ? 6 : 4)),
        pointBackgroundColor: symbolData.map((item) =>
          item.isLatest ? 'rgba(255, 77, 79, 1)' : colorMap[displayName]
        ),
        pointBorderColor: 'rgba(255, 255, 255, 1)',
        pointHoverRadius: 7,
        pointHitRadius: 10,
        fill: true,
      });
    });

    return { datasets };
  }, [data, symbols]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { size: 14, weight: 'bold' },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: { size: 14 },
        bodyFont: { size: 12 },
        padding: 10,
        cornerRadius: 4,
        callbacks: {
          label: (context) => {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            if (context.parsed.y !== null) {
              label += parseFloat(context.parsed.y).toFixed(4);
            }
            return label;
          },
        },
      },
      annotation: {
        annotations: {
          latestPoint: {
            type: 'line',
            xMin: (ctx) => {
              const latest = ctx.chart.data.datasets[0]?.data.find((d) => d.isLatest)?.x;
              return latest || undefined;
            },
            xMax: (ctx) => {
              const latest = ctx.chart.data.datasets[0]?.data.find((d) => d.isLatest)?.x;
              return latest || undefined;
            },
            borderColor: 'rgba(255, 77, 79, 0.5)',
            borderWidth: 2,
            borderDash: [5, 5],
            label: {
              content: 'Latest',
              enabled: true,
              position: 'top',
            },
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 8,
          font: { size: 12 },
        },
      },
      y: {
        position: 'right',
        grid: {
          drawBorder: false,
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          callback: (value) => parseFloat(value).toFixed(4),
          font: { size: 12 },
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
  };

  return (
    <Card
      title={
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              Volatility Indices
            </Title>
          </Col>
          <Col>
            {symbols.length > 0 && !showAviator && (
              <Tag color="blue" style={{ fontSize: '14px', padding: '4px 8px' }}>
                {symbols.map(getSymbolDisplayName).join(', ')}
              </Tag>
            )}
            {showAviator && (
              <Tag color="green" style={{ fontSize: '14px', padding: '4px 8px' }}>
                Aviator Predictor
              </Tag>
            )}
            {/* Example balance display next to avatar, update className as requested */}
            {/* <span className="hidden md:inline-block">Balance: ${balance}</span> */}
            {/* Updated to be visible on all screen sizes: */}
            {/* <span className="inline-block">Balance: ${balance}</span> */}
          </Col>
        </Row>
      }
      extra={
        <Row gutter={8}>
          <Col>
            <Button
              onClick={() => setShowAviator(!showAviator)}
              type={showAviator ? 'default' : 'primary'}
            >
              {showAviator ? 'Show Chart' : 'Show Aviator'}
            </Button>
          </Col>
          <Col>
            <Button
              onClick={() => setAutoRefresh(!autoRefresh)}
              type={autoRefresh ? 'primary' : 'default'}
              disabled={showAviator}
            >
              {autoRefresh ? 'Disable Auto-Refresh' : 'Enable Auto-Refresh'}
            </Button>
          </Col>
          <Col>
            <Button
              icon={<ReloadOutlined />}
              onClick={subscribeToTicks}
              loading={loading}
              type="primary"
              disabled={showAviator}
            >
              Refresh
            </Button>
          </Col>
        </Row>
      }
      headStyle={{ borderBottom: '1px solid #f0f0f0' }}
      bodyStyle={{ padding: '24px' }}
      style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)' }}
    >
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={24} md={16}>
          <Select
            mode="multiple"
            value={symbols}
            onChange={handleSymbolChange}
            style={{ width: '100%' }}
            disabled={loading || showAviator}
            optionLabelProp="label"
            maxTagCount={3}
            showSearch
            filterOption={(input, option) =>
              option.label.toLowerCase().includes(input.toLowerCase())
            }
          >
            <Option value="R_10" label="V10">Volatility 10 Index</Option>
            <Option value="1HZ10V" label="V10(1s)">Volatility 10(1s) Index</Option>
            <Option value="R_25" label="V25">Volatility 25 Index</Option>
            <Option value="1HZ25V" label="V25(1s)">Volatility 25(1s) Index</Option>
            <Option value="R_50" label="V50">Volatility 50 Index</Option>
            <Option value="1HZ50V" label="V50(1s)">Volatility 50(1s) Index</Option>
            <Option value="R_75" label="V75">Volatility 75 Index</Option>
            <Option value="1HZ75V" label="V75(1s)">Volatility 75(1s) Index</Option>
            <Option value="R_100" label="V100">Volatility 100 Index</Option>
            <Option value="1HZ100V" label="V100(1s)">Volatility 100(1s) Index</Option>
          </Select>
        </Col>
        <Col xs={24} sm={24} md={8}>
          <Select
            value={timeRange}
            onChange={handleTimeRangeChange}
            style={{ width: '100%' }}
            disabled={loading || showAviator}
          >
            <Option value={60}>Last 1 Minute</Option>
            <Option value={300}>Last 5 Minutes</Option>
            <Option value={600}>Last 10 Minutes</Option>
          </Select>
        </Col>
      </Row>

      {error && (
        <Alert
          message={error}
          description="Please try refreshing or selecting a different index."
          type="error"
          showIcon
          closable
          style={{ marginBottom: 16 }}
          onClose={() => setError(null)}
          action={
            <Button
              size="small"
              danger
              onClick={() => {
                setError(null);
                subscribeToTicks();
              }}
            >
              Retry
            </Button>
          }
        />
      )}

      {showAviator ? (
        <div style={{ height: '500px', position: 'relative' }}>
          {aviatorLoading && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spin size="large" />
              <Text>Loading Aviator Predictor...</Text>
            </div>
          )}
          <iframe
            src={`https://predicto-mocha.vercel.app/?symbol=${symbols[0] || '1HZ10V'}`}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              borderRadius: '8px',
              display: aviatorLoading ? 'none' : 'block',
            }}
            title="Aviator Predictor"
            onLoad={() => setAviatorLoading(false)}
          />
        </div>
      ) : loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
          <Text>Loading data...</Text>
        </div>
      ) : data.length > 0 ? (
        <div style={{ height: '500px', position: 'relative' }}>
          <Line ref={chartRef} data={chartData} options={chartOptions} />
        </div>
      ) : (
        <div
          style={{
            height: '500px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#fafafa',
            borderRadius: '8px',
            border: '1px dashed #d9d9d9',
          }}
        >
          <Text type="secondary" style={{ fontSize: '16px' }}>
            Select indices and click Refresh to view data
          </Text>
        </div>
      )}
    </Card>
  );
};

export default VolatilityComparisonChart;