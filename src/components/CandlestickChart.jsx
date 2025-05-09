import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Card, Typography, Alert, Button, Select, Spin, Radio, Space, Tooltip, Divider } from 'antd';
import Chart from 'react-apexcharts';
import debounce from 'lodash/debounce';
import PropTypes from 'prop-types';
import { LoadingOutlined, ReloadOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;
const { Option } = Select;

const MODES = {
  RISE_FALL: 'riseFall',
  EVEN_ODD: 'evenOdd',
};

const symbolPriceRanges = {
  R_10: { min: 6200, max: 6400 },
  '1HZ10V': { min: 9100, max: 9200 },
  R_25: { min: 2600, max: 2700 },
  '1HZ25V': { min: 598000, max: 599000 },
  R_50: { min: 170, max: 180 },
  '1HZ50V': { min: 237000, max: 238000 },
  R_75: { min: 104000, max: 105000 },
  '1HZ75V': { min: 6300, max: 6400 },
  R_100: { min: 1590, max: 1600 },
  '1HZ100V': { min: 600, max: 610 },
};

const symbolPipSizes = {
  R_10: 3,
  '1HZ10V': 2,
  R_25: 3,
  '1HZ25V': 2,
  R_50: 4,
  '1HZ50V': 2,
  R_75: 4,
  '1HZ75V': 2,
  R_100: 2,
  '1HZ100V': 2,
};

const intervalPipPaddings = {
  5: 25,
  10: 50,
  30: 100,
  60: 200,
};

const TIME_RANGES = {
  '1m': { label: '1 Minute', seconds: 60 },
  '5m': { label: '5 Minutes', seconds: 300 },
  '15m': { label: '15 Minutes', seconds: 900 },
  '1h': { label: '1 Hour', seconds: 3600 },
  '4h': { label: '4 Hours', seconds: 14400 },
  '1d': { label: '1 Day', seconds: 86400 },
};

const CandlestickChart = ({
  symbol,
  ticks,
  initialMode = MODES.RISE_FALL,
  initialInterval = 5,
  onRefresh,
}) => {
  const [mode, setMode] = useState(initialMode);
  const [series, setSeries] = useState([{ data: [] }]);
  const [intervalSeconds, setIntervalSeconds] = useState(initialInterval);
  const [chartError, setChartError] = useState(null);
  const [isChartRendered, setIsChartRendered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [theme] = useState('light');
  const [selectedTimeRange, setSelectedTimeRange] = useState('5m');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [crosshairData, setCrosshairData] = useState(null);
  const chartRef = useRef(null);
  const containerRef = useRef(null);

  // Performance optimization: Memoize expensive calculations
  const candles = useMemo(() => {
    if (!ticks || ticks.length === 0) return [];

    const intervalMs = intervalSeconds * 5000;
    const candlesMap = new Map();

    // Performance optimization: Use for loop instead of forEach
    for (let i = 0; i < ticks.length; i++) {
      const tick = ticks[i];
      const timestamp = Math.floor(tick.timestamp * 1000);
      const price = parseFloat(tick.price);
      const timeBucket = Math.floor(timestamp / intervalMs) * intervalMs;

      if (!candlesMap.has(timeBucket)) {
        candlesMap.set(timeBucket, {
          time: timeBucket,
          open: price,
          high: price,
          low: price,
          close: price,
          lastDigit: parseInt(price.toString().slice(-1)),
        });
      } else {
        const candle = candlesMap.get(timeBucket);
        candle.high = Math.max(candle.high, price);
        candle.low = Math.min(candle.low, price);
        candle.close = price;
        candle.lastDigit = parseInt(price.toString().slice(-1));
      }
    }

    const result = Array.from(candlesMap.values())
      .sort((a, b) => a.time - b.time)
      .slice(-200);

    return result;
  }, [ticks, intervalSeconds]);

  // Debounced chart update with performance optimization
  const debouncedUpdateChart = useRef(
    debounce((candlesData, currentMode, currentSymbol, currentInterval) => {
      try {
        setIsLoading(true);
        
        if (candlesData.length === 0) {
          setSeries([{ data: [] }]);
          setIsLoading(false);
          return;
        }

        const candlestickData = candlesData.map((candle) => ({
          x: new Date(candle.time),
          y: [candle.open, candle.high, candle.low, candle.close],
        }));

        setSeries([{ name: 'Price', type: 'candlestick', data: candlestickData }]);
        setIsLoading(false);

        if (isChartRendered && chartRef.current && candlesData.length > 0) {
          const recentTicks = ticks.slice(-10);
          const recentPrices = recentTicks.map((t) => parseFloat(t.price));
          const priceRange = symbolPriceRanges[currentSymbol];
          
          let minPrice, maxPrice;
          if (recentPrices.length >= 5 && (!priceRange || currentInterval === 1)) {
            minPrice = Math.min(...recentPrices);
            maxPrice = Math.max(...recentPrices);
          } else if (priceRange) {
            minPrice = priceRange.min;
            maxPrice = priceRange.max;
          } else {
            const allPrices = candlesData.flatMap((c) => [c.open, c.high, c.low, c.close]);
            minPrice = Math.min(...allPrices);
            maxPrice = Math.max(...allPrices);
          }

          const pipSize = symbolPipSizes[currentSymbol] || 2;
          const pipValue = Math.pow(10, -pipSize);
          const pipPadding = intervalPipPaddings[currentInterval] || 50;
          const padding = pipPadding * pipValue;

          chartRef.current.updateOptions({
            yaxis: {
              min: minPrice - padding,
              max: maxPrice + padding,
            },
          });

          const lastCandleTime = candlesData[candlesData.length - 1].time;
          chartRef.current.zoomX(
            new Date(lastCandleTime - TIME_RANGES[selectedTimeRange].seconds * 1000).getTime(),
            new Date(lastCandleTime).getTime()
          );
        }
      } catch (error) {
        console.error('Chart update error:', error);
        setChartError(`Error updating chart: ${error.message}`);
        setIsLoading(false);
      }
    }, intervalSeconds === 5 ? 250 : 500)
  ).current;

  // Handle crosshair movement
  const handleCrosshairMove = useCallback((e, chartContext, config) => {
    if (
      config.dataPointIndex >= 0 &&
      series[0]?.data?.[config.dataPointIndex]
    ) {
      const point = series[0].data[config.dataPointIndex];
      if (point?.y && point.y.length === 4) {
        setCrosshairData({
          price: point.y[3],
          time: new Date(point.x).toLocaleTimeString(),
        });
      }
    }
  }, [series]);


  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Update chart when dependencies change
  useEffect(() => {
    debouncedUpdateChart(candles, mode, symbol, intervalSeconds);
  }, [candles, mode, symbol, intervalSeconds, selectedTimeRange, debouncedUpdateChart]);

  // Cleanup
  useEffect(() => {
    return () => {
      debouncedUpdateChart.cancel();
    };
  }, [debouncedUpdateChart]);

  const getColorForMode = (digit, currentMode) => {
    switch (currentMode) {
      case MODES.EVEN_ODD:
        return digit % 2 === 0 ? '#52c41a' : '#f5222d';
      case MODES.RISE_FALL:
      default:
        return '#1890ff';
    }
  };

  const chartOptions = useMemo(() => ({
    chart: {
      type: 'candlestick',
      height: isFullscreen ? '80vh' : 500,
      animations: {
        enabled: true,
        easing: 'easeout',
        speed: 300,
        animateGradually: {
          enabled: true,
          delay: 150
        },
      },
      zoom: {
        enabled: true,
        type: 'x',
        autoScaleYaxis: true,
      },
      events: {
        mounted: (chart) => {
          chartRef.current = chart;
          setIsChartRendered(true);
        },
        mouseMove: handleCrosshairMove,
      },
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true,
        }
      },
    },
    theme: {
      mode: theme,
    },
    title: {
      text: `${symbol} - ${intervalSeconds}s Candles`,
      align: 'left',
      style: {
        fontSize: '16px',
        fontWeight: 'bold',
        color: theme === 'dark' ? '#FFF' : '#333',
      },
    },
    xaxis: {
      type: 'datetime',
      labels: {
        format: intervalSeconds <= 5 ? 'HH:mm:ss' : 'HH:mm',
        datetimeUTC: false,
        style: {
          colors: theme === 'dark' ? '#FFF' : '#333',
        },
      },
      range: TIME_RANGES[selectedTimeRange].seconds * 1000,
    },
    yaxis: {
      tooltip: { enabled: true },
      labels: {
        formatter: (val) => typeof val === 'number' ? val.toFixed(symbolPipSizes[symbol] || 2) : val,
        style: {
          colors: theme === 'dark' ? '#FFF' : '#333',
        },
      },
    },
    crosshair: {
      show: true,
      width: 1,
      position: 'back',
      opacity: 0.9,
      stroke: {
        color: theme === 'dark' ? '#FFF' : '#666',
        width: 1,
        dashArray: 0,
      },
      fill: {
        type: 'solid',
        color: theme === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
      },
    },
    tooltip: {
      enabled: true,
      shared: true,
      intersect: false,
      x: {
        format: intervalSeconds <= 5 ? 'HH:mm:ss' : 'HH:mm',
      },
      custom: ({ seriesIndex, dataPointIndex, w }) => {
        const data = w.globals.initialSeries[seriesIndex]?.data[dataPointIndex];
        if (!data) return '<div>No data</div>';

        const lastDigit = parseInt(data.y[3].toString().slice(-1));
        let infoText = '';

        switch (mode) {
          case MODES.EVEN_ODD:
            infoText = `${lastDigit} (${lastDigit % 2 === 0 ? 'Even' : 'Odd'})`;
            break;
          case MODES.RISE_FALL:
            { const direction = data.y[3] > data.y[0] ? 'Rise' : data.y[3] < data.y[0] ? 'Fall' : 'Neutral';
            infoText = `${direction}`;
            break; }
          default:
            infoText = `${lastDigit}`;
        }

        return `
          <div style="
            padding: 8px;
            background: ${theme === 'dark' ? '#1f1f1f' : 'white'};
            border: 1px solid ${theme === 'dark' ? '#333' : '#ddd'};
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            color: ${theme === 'dark' ? '#EEE' : '#333'};
          ">
            <div style="font-weight: 500; margin-bottom: 4px;">
              ${new Date(data.x).toLocaleTimeString()}
            </div>
            <div style="display: grid; grid-template-columns: 80px 1fr; gap: 4px;">
              <span>Open:</span><span>${data.y[0].toFixed(symbolPipSizes[symbol] || 2)}</span>
              <span>High:</span><span>${data.y[1].toFixed(symbolPipSizes[symbol] || 2)}</span>
              <span>Low:</span><span>${data.y[2].toFixed(symbolPipSizes[symbol] || 2)}</span>
              <span>Close:</span><span>${data.y[3].toFixed(symbolPipSizes[symbol] || 2)}</span>
              <span>Info:</span><span style="color: ${getColorForMode(lastDigit, mode)};">
                ${infoText}
              </span>
            </div>
          </div>
        `;
      },
    },
    plotOptions: {
      candlestick: {
        colors: { upward: '#52c41a', downward: '#f5222d' },
        wick: { useFillColor: true },
      },
    },
    responsive: [{
      breakpoint: 768,
      options: {
        chart: {
          height: 400,
        },
        title: {
          style: {
            fontSize: '14px',
          },
        },
      },
    }],
  }), [isFullscreen, handleCrosshairMove, theme, symbol, intervalSeconds, selectedTimeRange, mode]);

  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    onRefresh?.();
  }, [onRefresh]);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <Card
        title={
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Text strong>
              {symbol} - {intervalSeconds}s Candles
            </Text>
            <Radio.Group
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              buttonStyle="solid"
              size="small"
            >
              <Radio.Button value={MODES.RISE_FALL}>Rise/Fall</Radio.Button>
              <Radio.Button value={MODES.EVEN_ODD}>Even/Odd</Radio.Button>
            </Radio.Group>
          </Space>
        }
        extra={
          <Space>
            <Select
              value={selectedTimeRange}
              onChange={setSelectedTimeRange}
              size="small"
              style={{ width: 120 }}
            >
              {Object.entries(TIME_RANGES).map(([key, { label }]) => (
                <Option key={key} value={key}>{label}</Option>
              ))}
            </Select>
            <Select
              value={intervalSeconds}
              onChange={setIntervalSeconds}
              size="small"
              style={{ width: 120 }}
            >
              <Option value={5}>5 seconds</Option>
              <Option value={10}>10 seconds</Option>
              <Option value={30}>30 seconds</Option>
              <Option value={60}>1 minute</Option>
            </Select>
            <Tooltip title="Refresh Data">
              <Button 
                icon={<ReloadOutlined spin={isLoading} />} 
                size="small" 
                onClick={handleRefresh}
                disabled={isLoading}
              />
            </Tooltip>
          </Space>
        }
        bodyStyle={{ padding: isFullscreen ? '24px' : '16px' }}
      >
        {chartError ? (
          <Alert
            message="Chart Error"
            description={
              <>
                {chartError}
                <Divider />
                <Button 
                  type="primary" 
                  onClick={() => {
                    setChartError(null);
                    handleRefresh();
                  }}
                  icon={<ReloadOutlined />}
                >
                  Retry
                </Button>
              </>
            }
            type="error"
            showIcon
            closable
            onClose={() => setChartError(null)}
          />
        ) : candles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin 
              indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} 
              tip="Loading chart data..."
            />
            <div style={{ marginTop: 16 }}>
              <Button type="primary" onClick={handleRefresh} loading={isLoading}>
                {isLoading ? 'Loading' : 'Load Data'}
              </Button>
            </div>
          </div>
        ) : (
          <>
            {crosshairData && (
              <div style={{
                position: 'absolute',
                top: 20,
                right: 20,
                zIndex: 10,
                background: theme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)',
                padding: '8px 16px',
                borderRadius: 4,
                border: `1px solid ${theme === 'dark' ? '#333' : '#ddd'}`,
              }}>
                <Text strong>{crosshairData.time}</Text>
                <br />
                <Text>Price: {crosshairData.price.toFixed(symbolPipSizes[symbol] || 2)}</Text>
              </div>
            )}
            <Chart
              options={chartOptions}
              series={series}
              type="candlestick"
              height={isFullscreen ? 'calc(80vh - 100px)' : 500}
            />
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginTop: 8,
              flexWrap: 'wrap',
            }}>
              <Text type="secondary">
                Showing {candles.length} candles (updated at {new Date().toLocaleTimeString()})
              </Text>
              <Text type="secondary">
                Crosshair: {crosshairData ? 'Active' : 'Hover over chart'}
              </Text>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

CandlestickChart.propTypes = {
  symbol: PropTypes.string.isRequired,
  ticks: PropTypes.arrayOf(
    PropTypes.shape({
      price: PropTypes.number.isRequired,
      timestamp: PropTypes.number.isRequired,
    })
  ).isRequired,
  initialMode: PropTypes.oneOf(Object.values(MODES)),
  targetDigit: PropTypes.number,
  barrier: PropTypes.number,
  initialInterval: PropTypes.number,
  onRefresh: PropTypes.func,
};

CandlestickChart.defaultProps = {
  initialMode: MODES.RISE_FALL,
  targetDigit: 5,
  barrier: 4,
  initialInterval: 5,
  onRefresh: () => {},
};

export default CandlestickChart;