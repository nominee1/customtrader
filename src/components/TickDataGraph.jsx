import React, { useState, useEffect, useRef } from "react";
import { publicWebSocket } from "../services/public_websocket_client";
import {
  Card,
  Row,
  Col,
  Select,
  Button,
  Spin,
  Typography,
  Alert,
  Tag,
} from "antd";
import { ReloadOutlined } from "@ant-design/icons";
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
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ChartTitle,
  Tooltip,
  Legend,
  Filler
);

const { Option } = Select;
const { Title, Text } = Typography;

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <Text type="danger">Something went wrong while rendering the chart.</Text>;
    }
    return this.props.children;
  }
}

const VolatilityComparisonChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [symbols, setSymbols] = useState(["1HZ10V"]);
  const [showAviator, setShowAviator] = useState(false);
  const subscriptions = useRef({});
  const lastUpdateTime = useRef({});
  const chartRef = useRef(null);

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const processTickData = (newTick) => {
    setData(prevData => {
      // Get all data for this symbol
      const symbolData = prevData.filter(d => d.symbol === newTick.symbol);
      
      // Always add new tick (we'll trim to 8 points below)
      const updatedData = [
        ...prevData.filter(d => d.symbol !== newTick.symbol),
        ...symbolData,
        {
          ...newTick,
          isLatest: true
        }
      ];
      
      // Mark previous points as not latest
      return updatedData.map((item, index, arr) => ({
        ...item,
        isLatest: index === arr.length - 1 && item.symbol === newTick.symbol
      }));
    });
  };

  // Filter to only show 8 time points per symbol, 5 seconds apart
  const getDisplayData = () => {
    const result = [];
    const timePoints = new Set();
    
    // Process data in reverse to get newest first
    [...data].reverse().forEach(item => {
      if (!timePoints.has(item.time)) {
        timePoints.add(item.time);
        if (timePoints.size <= 8) {
          result.unshift(item); // Add to beginning to maintain order
        }
      }
    });
    
    return result;
  };

  useEffect(() => {
    lastUpdateTime.current = symbols.reduce((acc, symbol) => {
      acc[symbol] = 0;
      return acc;
    }, {});

    publicWebSocket.connect();

    const unsubscribe = publicWebSocket.subscribe((event, data) => {
      if (event === "message") {
        if (data.error) {
          setError(data.error.message);
          setLoading(false);
        } else if (data.tick) {
          const tick = {
            time: formatTime(new Date(data.tick.epoch * 1000)),
            value: data.tick.quote,
            symbol: data.tick.symbol,
            epoch: data.tick.epoch,
            isLatest: false
          };
          processTickData(tick);
        } else if (data.subscription) {
          subscriptions.current[data.echo_req.ticks] = data.subscription.id;
        }
      } else if (event === "error") {
        setError("WebSocket error occurred");
        setLoading(false);
      }
    });

    publicWebSocket.socket.onopen = () => {
      subscribeToTicks();
    };

    return () => {
      const currentSubscriptions = { ...subscriptions.current };
      Object.keys(currentSubscriptions).forEach((symbol) => {
        publicWebSocket.send({ forget: currentSubscriptions[symbol] });
      });
      unsubscribe();
      publicWebSocket.close();
    };
  }, [symbols]);

  const subscribeToTicks = () => {
    setLoading(true);
    setError(null);
    setData([]);
    lastUpdateTime.current = symbols.reduce((acc, symbol) => {
      acc[symbol] = 0;
      return acc;
    }, {});

    symbols.forEach((symbol) => {
      if (!subscriptions.current[symbol]) {
        publicWebSocket.send({
          ticks: symbol,
          subscribe: 1,
        });
      }
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

  const handleSymbolChange = (value) => {
    unsubscribeFromTicks();
    setSymbols(value);
    subscribeToTicks();
  };

  const getSymbolDisplayName = (symbol) => {
    const names = {
      "R_10": "Volatility 10",
      "1HZ10V": "Volatility 10 (1s)",
      "R_25": "Volatility 25",
      "1HZ25V": "Volatility 25 (1s)",
      "R_50": "Volatility 50",
      "1HZ50V": "Volatility 50 (1s)",
      "R_75": "Volatility 75",
      "1HZ75V": "Volatility 75 (1s)",
      "R_100": "Volatility 100",
      "1HZ100V": "Volatility 100 (1s)",
    };
    return names[symbol] || symbol;
  };

  const prepareChartData = () => {
    const displayData = getDisplayData();
    const colorMap = {
      "Volatility 10": 'rgba(24, 144, 255, 1)',
      "Volatility 10 (1s)": 'rgba(24, 144, 255, 1)',
      "Volatility 25": 'rgba(255, 77, 79, 1)',
      "Volatility 25 (1s)": 'rgba(255, 77, 79, 1)',
      "Volatility 50": 'rgba(82, 196, 26, 1)',
      "Volatility 50 (1s)": 'rgba(82, 196, 26, 1)',
      "Volatility 75": 'rgba(250, 173, 20, 1)',
      "Volatility 75 (1s)": 'rgba(250, 173, 20, 1)',
      "Volatility 100": 'rgba(114, 46, 209, 1)',
      "Volatility 100 (1s)": 'rgba(114, 46, 209, 1)',
    };

    const datasets = [];
    const groupedData = {};

    displayData.forEach(item => {
      if (!groupedData[item.symbol]) {
        groupedData[item.symbol] = [];
      }
      groupedData[item.symbol].push(item);
    });

    Object.keys(groupedData).forEach(symbol => {
      const symbolData = groupedData[symbol];
      const displayName = getSymbolDisplayName(symbol);
      
      datasets.push({
        label: displayName,
        data: symbolData.map(item => ({
          x: item.time,
          y: item.value,
          isLatest: item.isLatest
        })),
        borderColor: colorMap[displayName],
        backgroundColor: colorMap[displayName],
        borderWidth: 2,
        tension: 0.1,
        pointRadius: symbolData.map(item => item.isLatest ? 6 : 4),
        pointBackgroundColor: symbolData.map(item => 
          item.isLatest ? 'rgba(255, 77, 79, 1)' : colorMap[displayName]
        ),
        pointBorderColor: 'rgba(255, 255, 255, 1)',
        pointHoverRadius: 7,
        pointHitRadius: 10,
        fill: false,
      });
    });

    return { datasets };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            if (context.parsed.y !== null) {
              label += parseFloat(context.parsed.y).toFixed(4);
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 8
        }
      },
      y: {
        position: 'right',
        grid: {
          drawBorder: false,
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          callback: (value) => parseFloat(value).toFixed(4)
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
    elements: {
      point: {
        pointStyle: (context) => {
          return context.raw.isLatest ? 'diamond' : 'circle';
        }
      }
    }
  };

  const toggleAviator = () => {
    setShowAviator(!showAviator);
  };

  return (
    <ErrorBoundary>
      <Card
        title={
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={4} style={{ margin: 0 }}>Volatility Indices</Title>
            </Col>
            <Col>
              {symbols.length > 0 && !showAviator && (
                <Tag color="blue" style={{ fontSize: '14px', padding: '4px 8px' }}>
                  {symbols.map(s => getSymbolDisplayName(s)).join(", ")}
                </Tag>
              )}
              {showAviator && (
                <Tag color="green" style={{ fontSize: '14px', padding: '4px 8px' }}>
                  Aviator Predictor
                </Tag>
              )}
            </Col>
          </Row>
        }
        extra={
          <Row gutter={8}>
            <Col>
              <Button
                onClick={toggleAviator}
                type={showAviator ? "default" : "primary"}
              >
                {showAviator ? "Show Chart" : "Show Aviator"}
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
              style={{ width: "100%" }}
              maxTagCount={2}
              disabled={loading || showAviator}
              optionLabelProp="label"
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
        </Row>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            closable
            style={{ marginBottom: 16 }}
            onClose={() => setError(null)}
          />
        )}

        {showAviator ? (
          <div style={{ height: "500px", position: 'relative' }}>
            <iframe 
              src="https://predicto-mocha.vercel.app/" 
              style={{ 
                width: '100%', 
                height: '100%', 
                border: 'none', 
                borderRadius: '8px' 
              }} 
              title="Aviator Predictor"
            />
          </div>
        ) : loading ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <Spin size="large" />
            <Text>Loading data...</Text>
          </div>
        ) : data.length > 0 ? (
          <div style={{ height: "500px", position: 'relative' }}>
            <Line 
              ref={chartRef}
              data={prepareChartData()} 
              options={chartOptions} 
            />
          </div>
        ) : (
          <div style={{ 
            height: "500px", 
            display: "flex", 
            justifyContent: "center", 
            alignItems: "center",
            backgroundColor: "#fafafa",
            borderRadius: "8px",
            border: "1px dashed #d9d9d9"
          }}>
            <Text type="secondary" style={{ fontSize: '16px' }}>
              Select indices and click Refresh to view data
            </Text>
          </div>
        )}
      </Card>
    </ErrorBoundary>
  );
};

export default VolatilityComparisonChart;