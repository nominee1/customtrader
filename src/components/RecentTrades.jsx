import React, { useEffect, useState, useRef } from 'react';
import { Card, Space, Typography, Row, Col, Tag } from 'antd';
import { HistoryOutlined } from '@ant-design/icons';
import { useUser } from '../context/AuthContext';

const { Text } = Typography;

const RecentTrades = () => {
    const { user, activeAccount, loading: authLoading } = useUser();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [recentTrades, setRecentTrades] = useState([]);
    const ws = useRef(null);
    const [liveContracts, setLiveContracts] = useState([]);

    useEffect(() => {
        if (!user || !activeAccount) return;

        const accountId = activeAccount.loginid;
        setLiveContracts([]);
        setRecentTrades(JSON.parse(localStorage.getItem('recent_trades')) || []);

        ws.current = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=36300');

        ws.current.onopen = () => {
            ws.current.send(JSON.stringify({ authorize: activeAccount.token }));
        };

        ws.current.onmessage = (msg) => {
            const data = JSON.parse(msg.data);

            if (data.msg_type === 'authorize') {
                ws.current.send(JSON.stringify({ portfolio: 1 }));
            }

            if (data.msg_type === 'portfolio') {
                data.portfolio.contracts.forEach((contract) => {
                    ws.current.send(JSON.stringify({
                        proposal_open_contract: 1,
                        contract_id: contract.contract_id,
                    }));
                });
            }

            if (data.msg_type === 'proposal_open_contract') {
                const contract = data.proposal_open_contract;
                const isCompleted = contract.status === 'won' || contract.status === 'lost';

                if (!isCompleted) {
                    setLiveContracts((prev) => {
                        const existing = prev.find((c) => c.contract_id === contract.contract_id);
                        if (existing) return prev.map((c) => c.contract_id === contract.contract_id ? contract : c);
                        return [...prev, contract];
                    });
                } else {
                    setLiveContracts((prev) => prev.filter((c) => c.contract_id !== contract.contract_id));
                    const newTrade = {
                        id: contract.contract_id,
                        asset: contract.underlying,
                        type: contract.status === 'won' ? 'buy' : 'sell',
                        profit: contract.profit,
                        buy_price: contract.buy_price,
                        sell_price: contract.sell_price,
                        entry_tick: contract.entry_tick,
                        exit_tick: contract.exit_tick,
                        entry_tick_time: contract.entry_tick_time,
                        exit_tick_time: contract.exit_tick_time,
                        contract_type: contract.contract_type,
                    };
                    console.log('Completed Trade:', newTrade);
                    setRecentTrades((prev) => {
                        const updated = [newTrade, ...prev].slice(0, 20);
                        localStorage.setItem('recent_trades', JSON.stringify(updated));
                        return updated;
                    });
                }
            }
        };

        return () => {
            ws.current?.close();
            setLiveContracts([]);
            setRecentTrades([]);
        };
    }, [user, activeAccount]);
    
    return (
        <Space direction="vertical" size={24} style={{ width: '100%' }}>
            <Card
                title={
                    <Space>
                        <HistoryOutlined />
                        <Text strong>Live Contracts</Text>
                    </Space>
                }
                style={{
                    borderRadius: 16,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                }}
                loading={authLoading || loading}
            >
                {liveContracts.length > 0 ? (
                    <Space direction="vertical" size={16} style={{ width: '100%' }}>
                        {liveContracts.map((contract) => (
                            <Card key={contract.contract_id} size="small" style={{ borderLeft: '4px solid #1890ff', borderRadius: 8 }}>
                                <Row justify="space-between">
                                    <Col>
                                        <Text>{contract.underlying}</Text> <br />
                                        <Text type="secondary">{contract.contract_type}</Text>
                                    </Col>
                                    <Col>
                                        <Tag color="blue">LIVE</Tag>
                                    </Col>
                                </Row>
                            </Card>
                        ))}
                    </Space>
                ) : (
                    <Text type="secondary">No live contracts.</Text>
                )}
            </Card>

            <Card
                title={
                    <Space>
                        <HistoryOutlined />
                        <Text strong>Recent Trades</Text>
                    </Space>
                }
                style={{
                    borderRadius: 16,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                }}
                loading={authLoading || loading}
            >
                {error ? (
                    <Text type="danger">{error}</Text>
                ) : recentTrades.length > 0 ? (
                    <Space direction="vertical" size={16} style={{ width: '100%' }}>
                        {recentTrades.map((trade) => (
                            <Card
                                key={trade.id}
                                size="small"
                                style={{
                                    borderLeft: `4px solid ${trade.type === 'buy' ? '#52c41a' : '#ff4d4f'}`,
                                    borderRadius: 8,
                                }}
                            >
                                <Row justify="space-between">
                                    <Col>
                                        <Text>{trade.asset}</Text> <br />
                                        <Text type="secondary">
                                            {trade.contract_type}<br />
                                            Entry: {trade.buy_price} | Exit: {trade.sell_price}
                                        </Text>
                                    </Col>
                                    <Col>
                                        <Tag color={trade.type === 'buy' ? 'green' : 'red'}>
                                            {trade.type?.toUpperCase()}
                                        </Tag>
                                    </Col>
                                </Row>
                            </Card>
                        ))}
                    </Space>
                ) : (
                    <Text type="secondary">No recent trades available.</Text>
                )}
            </Card>
        </Space>
    );
};

export default RecentTrades;