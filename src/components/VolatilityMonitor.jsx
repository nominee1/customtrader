import React, { useEffect, useState } from 'react';
import { Table, Typography, Tag, Input, Checkbox, Button, Tooltip, Spin, Row, Col, Alert } from 'antd';
import { publicWebSocket } from "../services/public_websocket_client";

const { Title } = Typography;

const volatilitySymbols = [
  { name: "Volatility 10 Index", code: "R_10" },
  { name: "Volatility 10 (1s) Index", code: "1HZ10V" },
  { name: "Volatility 25 Index", code: "R_25" },
  { name: "Volatility 25 (1s) Index", code: "1HZ25V" },
  { name: "Volatility 50 Index", code: "R_50" },
  { name: "Volatility 50 (1s) Index", code: "1HZ50V" },
  { name: "Volatility 75 Index", code: "R_75" },
  { name: "Volatility 75 (1s) Index", code: "1HZ75V" },
  { name: "Volatility 100 Index", code: "R_100" },
  { name: "Volatility 100 (1s) Index", code: "1HZ100V" },
];

const VolatilityMonitor = () => {
  const [tickData, setTickData] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleColumns, setVisibleColumns] = useState(['name', 'quote', 'bid', 'ask', 'percentageChange', 'timestamp']);
  const [selectedSymbols, setSelectedSymbols] = useState([]); // State for selected symbols

  const columnOptions = [
    { label: 'Symbol', value: 'name' },
    { label: 'Quote', value: 'quote' },
    { label: 'Bid', value: 'bid' },
    { label: 'Ask', value: 'ask' },
    { label: 'Change (%)', value: 'percentageChange' },
    { label: 'Last Update', value: 'timestamp' },
  ];

  useEffect(() => {
    publicWebSocket .connect();

    const unsubscribers = [];

    const updateTick = (symbol, newTick) => {
      setTickData((prev) => {
        const prevQuote = prev[symbol]?.quote ? parseFloat(prev[symbol].quote) : null;
        const currentQuote = newTick.quote ? parseFloat(newTick.quote) : null;

        const percentageChange =
          prevQuote && currentQuote
            ? (((currentQuote - prevQuote) / prevQuote) * 100).toFixed(2)
            : null;

        return {
          ...prev,
          [symbol]: {
            ...newTick,
            quote: currentQuote != null ? currentQuote.toFixed(2) : null,
            bid: newTick.bid != null ? parseFloat(newTick.bid).toFixed(2) : null,
            ask: newTick.ask != null ? parseFloat(newTick.ask).toFixed(2) : null,
            percentageChange,
            timestamp: new Date().toLocaleTimeString(),
          },
        };
      });
    };

    const handleTick = (event, data) => {
      if (event === 'message' && data.msg_type === 'tick') {
        const { symbol, quote, bid, ask } = data.tick;
        updateTick(symbol, { quote, bid, ask });
      }
    };

    const subscribeToSymbols = () => {
      volatilitySymbols.forEach(({ code }) => {
        const unsubscribe = publicWebSocket .subscribe(handleTick);
        unsubscribers.push(unsubscribe);

        publicWebSocket .send({
          ticks: code,
          subscribe: 1,
        });
      });
    };

    const onOpen = () => {
      subscribeToSymbols();
      setLoading(false);
    };

    const unsubscribeFromOpen = publicWebSocket .subscribe((event, data) => {
      if (event === 'open') {
        onOpen(data);
      }
    });

    return () => {
      unsubscribers.forEach((unsub) => unsub());
      unsubscribeFromOpen();
    };
  }, []);

  const handleRowSelection = {
    onChange: (selectedRowKeys) => {
      setSelectedSymbols(selectedRowKeys); // Update selected symbols
    },
  };

  const handleSetAlert = (symbol) => {
    const price = prompt(`Set an alert price for ${symbol}:`);
    if (price) {
      // Save alert logic here
    }
  };

  const columns = [
    {
      title: 'Symbol',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: (
        <Tooltip title="The latest price of the symbol">
          Quote
        </Tooltip>
      ),
      dataIndex: 'quote',
      key: 'quote',
      sorter: (a, b) => parseFloat(a.quote) - parseFloat(b.quote),
      render: (quote) => (quote ? parseFloat(quote).toFixed(2) : '—'),
    },
    {
      title: (
        <Tooltip title="The highest price a buyer is willing to pay">
          Bid
        </Tooltip>
      ),
      dataIndex: 'bid',
      key: 'bid',
      render: (bid) => (bid ? parseFloat(bid).toFixed(2) : '—'),
    },
    {
      title: (
        <Tooltip title="The lowest price a seller is willing to accept">
          Ask
        </Tooltip>
      ),
      dataIndex: 'ask',
      key: 'ask',
      render: (ask) => (ask ? parseFloat(ask).toFixed(2) : '—'),
    },
    {
      title: (
        <Tooltip title="The percentage change from the previous price">
          Change (%)
        </Tooltip>
      ),
      dataIndex: 'percentageChange',
      key: 'percentageChange',
      render: (percentageChange) =>
        percentageChange != null ? (
          <Tag color={percentageChange > 0 ? 'green' : 'red'}>
            {percentageChange}%
          </Tag>
        ) : (
          '—'
        ),
    },
    {
      title: (
        <Tooltip title="The last time the data was updated">
          Last Update
        </Tooltip>
      ),
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp) => timestamp || '—',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (text, record) => (
        <Button onClick={() => handleSetAlert(record.key)}>Set Alert</Button>
      ),
    },
  ];

  const dataSource = volatilitySymbols.map(({ name, code }) => ({
    key: code,
    name,
    ...tickData[code],
  }));

  const filteredDataSource = dataSource.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredColumns = columns.filter((col) => visibleColumns.includes(col.key));

  const comparisonData = selectedSymbols.map((symbol) => ({
    key: symbol,
    name: volatilitySymbols.find((item) => item.code === symbol)?.name || symbol,
    ...tickData[symbol],
  }));

  return (
    <div style={{ padding: '20px' }}>
      <Title level={3} style={{ textAlign: 'center' }}>
        📊 Volatility Index Monitor
      </Title>

      {/* Instructional Message */}
      <Alert
        message="Tip: Select symbols from the table below to compare their data side-by-side."
        type="info"
        showIcon
        style={{ marginBottom: '20px' }}
      />

      <Input
        placeholder="Search symbols..."
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ marginBottom: '20px', maxWidth: '300px' }}
      />

      <Checkbox.Group
        options={columnOptions}
        value={visibleColumns}
        onChange={(checkedValues) => setVisibleColumns(checkedValues)}
        style={{ marginBottom: '20px' }}
      />

      {loading ? (
        <Spin size="large" style={{ display: 'block', margin: '50px auto' }} />
      ) : (
        <Table
          rowSelection={{
            type: 'checkbox',
            ...handleRowSelection,
          }}
          dataSource={filteredDataSource}
          columns={filteredColumns}
          bordered
          pagination={{ pageSize: 5 }}
          scroll={{ x: 800 }}
          style={{ marginTop: '20px' }}
        />
      )}

      {/* Comparison Table */}
      {selectedSymbols.length > 0 && (
        <div style={{ marginTop: '40px' }}>
          <Title level={4}>Symbol Comparison</Title>
          <Table
            dataSource={comparisonData}
            columns={columns}
            bordered
            pagination={false}
            scroll={{ x: 800 }}
          />
        </div>
      )}
    </div>
  );
};

export default VolatilityMonitor;