import React from 'react';
import { Card, Space, Typography, Row, Col, Tag } from 'antd';
import { HistoryOutlined } from '@ant-design/icons';
import { useUser } from '../context/AuthContext';

const { Text } = Typography;

const RecentTrades = () => {
    const { recentTrades } = useUser();

    return (
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
                height: '100%',
            }}
        >
            {recentTrades.length > 0 ? (
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
                            <Space direction="vertical" size={4} style={{ width: '100%' }}>
                                <Row justify="space-between">
                                    <Text strong>{trade.type.toUpperCase()}</Text>
                                    <Tag color="blue">{trade.symbol}</Tag>
                                </Row>
                                <Row justify="space-between">
                                    <Text>Amount:</Text>
                                    <Text strong>${trade.amount.toFixed(2)}</Text>
                                </Row>
                                <Row justify="space-between">
                                    <Text>Profit:</Text>
                                    <Text strong type={trade.profit > 0 ? 'success' : 'danger'}>
                                        ${trade.profit.toFixed(2)}
                                    </Text>
                                </Row>
                                <Row justify="space-between">
                                    <Text type="secondary">{trade.time}</Text>
                                </Row>
                            </Space>
                        </Card>
                    ))}
                </Space>
            ) : (
                <Text type="secondary">No recent trades</Text>
            )}
        </Card>
    );
};

export default RecentTrades;