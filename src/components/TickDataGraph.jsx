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
import { Line } from "@ant-design/charts"; // Import Line chart
import { ReloadOutlined } from "@ant-design/icons";

const { Option } = Select;
const { Title, Text } = Typography;

const VolatilityComparisonChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [symbol, setSymbol] = useState("R_10"); // Default to R_10
  const subscriptions = useRef({});

  useEffect(() => {
    derivWebSocket.connect();

    const unsubscribe = derivWebSocket.subscribe((event, data) => {
      if (event === "message") {
        if (data.error) {
          setError(data.error.message);
          setLoading(false);
        } else if (data.tick) {
          // Process tick data
          const roundedValue = parseFloat(data.tick.quote.toFixed(2)); // Round to 2 decimal places
          const lastTwoDigits = parseFloat(roundedValue.toString().slice(-2)); // Extract last two digits
          const tick = {
            time: new Date(data.tick.epoch * 1000).toLocaleTimeString(),
            value: roundedValue, // Use the full rounded value for the Y-axis
            lastTwoDigits, // Use the last two digits for plotting
            symbol: data.tick.symbol || symbol, // Fallback to current symbol
          };
          setData((prevData) => [...prevData, tick].slice(-100)); // Keep only the last 100 points
        } else if (data.subscription) {
          subscriptions.current[data.echo_req.ticks] = data.subscription.id;
        }
      } else if (event === "error") {
        setError("WebSocket error occurred");
        setLoading(false);
      }
    });

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
  }, [symbol]);

  const subscribeToTicks = () => {
    setLoading(true);
    setError(null);
    if (!subscriptions.current[symbol]) {
      derivWebSocket.send({ ticks: symbol, subscribe: 1 });
    }
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
    setSymbol(value);
    setData([]);
    derivWebSocket.send({ ticks: value, subscribe: 1 });
  };

  const config = {
    data,
    xField: "time",
    yField: "value", // Plot the full rounded value on the Y-axis
    seriesField: "symbol",
    smooth: true,
    color: ["#1890ff"], // Single color for the selected symbol
    tooltip: {
      shared: true,
      showCrosshairs: true,
      formatter: (datum) => ({
        name: datum.symbol,
        value: datum.value.toFixed(2), // Show the full rounded value in the tooltip
      }),
    },
    legend: false, // Disable legend since only one line is shown
    yAxis: {
      position: "right", // Move Y-axis to the right
    },
    annotations: [
      {
        type: "text",
        position: ["max", "max"], // Position at the end of the line
        content: data.length > 0 ? data[data.length - 1].value.toFixed(2) : "",
        style: {
          fill: "#1890ff",
          fontSize: 14,
          fontWeight: "bold",
        },
        offsetX: 10,
        offsetY: -10,
      },
    ],
  };

  return (
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
            value={symbol}
            onChange={handleSymbolChange}
            style={{ width: "100%" }}
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
          <Line {...config} />
        </div>
      ) : (
        <Text>Click "Subscribe" to start receiving real-time tick data.</Text>
      )}
    </Card>
  );
};

export default VolatilityComparisonChart;