import React, { useState, useEffect, useRef } from "react";
import { derivWebSocket } from "../services/websocket_client";
import {
  Card,
  Row,
  Col,
  Select,
  Button,
  Spin,
  Typography,
  Alert,
} from "antd";
import { DualAxes } from "@ant-design/charts";
import { ReloadOutlined } from "@ant-design/icons";

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
  const [symbols, setSymbols] = useState(["R_10"]); // Default to R_10 only
  const subscriptions = useRef({});

  useEffect(() => {
    derivWebSocket.connect();

    const unsubscribe = derivWebSocket.subscribe((event, data) => {
      if (event === "message") {
        console.log("Raw WebSocket data:", data); // Debug raw data
        if (data.error) {
          setError(data.error.message);
          setLoading(false);
        } else if (data.tick) {
          const tick = {
            time: new Date(data.tick.epoch * 1000).toLocaleTimeString(),
            value: data.tick.quote,
            symbol: data.tick.symbol,
          };
          console.log("Processed tick:", tick); // Debug processed tick
          setData((prevData) => [...prevData, tick]);
        } else if (data.subscription) {
          subscriptions.current[data.echo_req.ticks] = data.subscription.id;
        }
      } else if (event === "error") {
        setError("WebSocket error occurred");
        setLoading(false);
      }
    });

    // Wait for WebSocket to open before subscribing
    derivWebSocket.socket.onopen = () => {
      subscribeToTicks();
    };

    return () => {
      const currentSubscriptions = { ...subscriptions.current };
      Object.keys(currentSubscriptions).forEach((symbol) => {
        derivWebSocket.send({ forget: currentSubscriptions[symbol] });
      });
      unsubscribe();
      derivWebSocket.close();
    };
  }, []);

  const subscribeToTicks = () => {
    setLoading(true);
    setError(null);

    symbols.forEach((symbol) => {
      if (!subscriptions.current[symbol]) {
        derivWebSocket.send({
          ticks: symbol,
          subscribe: 1,
        });
      }
    });
    setLoading(false);
  };

  const unsubscribeFromTicks = () => {
    Object.keys(subscriptions.current).forEach((symbol) => {
      derivWebSocket.send({ forget: subscriptions.current[symbol] });
      delete subscriptions.current[symbol];
    });
    setData([]);
  };

  const handleSymbolChange = (value) => {
    unsubscribeFromTicks();
    setSymbols(value);
    setData([]); // Clear data for new symbols
    value.forEach((symbol) => {
      derivWebSocket.send({
        ticks: symbol,
        subscribe: 1,
      });
    });
  };

  // Chart configuration adjusted for single or multiple symbols
  const config = {
    data: [
      data.filter((d) => d.symbol === "R_10"),
      data.filter((d) => d.symbol === "R_100"),
    ],
    xField: "time",
    yField: ["value", "value"],
    geometryOptions: [
      {
        geometry: "line",
        seriesField: "symbol",
        color: "#1890ff", // R_10 in blue
        lineStyle: { lineWidth: 2 },
        smooth: true,
      },
      {
        geometry: "line",
        seriesField: "symbol",
        color: "#ff4d4f", // R_100 in red
        lineStyle: { lineWidth: 2 },
        smooth: true,
      },
    ],
    legend: {
      position: "top",
      itemName: {
        formatter: (text) => (text === "R_10" ? "Volatility 10" : "Volatility 100"),
      },
    },
    tooltip: {
      shared: true,
      showCrosshairs: true,
      formatter: (datum) => ({
        name: datum.symbol === "R_10" ? "Volatility 10" : "Volatility 100",
        value: parseFloat(datum.value).toFixed(4),
      }),
    },
  };

  return (
    <ErrorBoundary>
      <Card
        title={<Title level={4} style={{ margin: 0 }}>Volatility Indices Real-Time Chart</Title>}
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={subscribeToTicks}
            loading={loading}
          >
            Subscribe
          </Button>
        }
      >
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={8}>
            <Select
              mode="multiple"
              value={symbols}
              onChange={handleSymbolChange}
              style={{ width: "100%" }}
              maxTagCount={1}
              disabled={loading}
            >
              <Option value="R_10">Volatility 10 Index</Option>
              <Option value="R_100">Volatility 100 Index</Option>
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

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <Spin size="large" />
            <Text>Subscribing to tick data...</Text>
          </div>
        ) : data.length > 0 ? (
          <div style={{ height: "500px" }}>
            <DualAxes {...config} />
          </div>
        ) : (
          <Text>Click "Subscribe" to start receiving real-time tick data.</Text>
        )}
      </Card>
    </ErrorBoundary>
  );
};

export default VolatilityComparisonChart;