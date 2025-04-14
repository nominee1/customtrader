import React from 'react';
import { Card, Space, Typography, Row, Col, Tag } from 'antd';
import { HistoryOutlined } from '@ant-design/icons';

const { Text } = Typography;

const RecentTrades = () => {
    
    const recentTrades = [
        { id: 1, asset: 'BTC/USD', type: 'buy' },
        { id: 2, asset: 'ETH/USD', type: 'sell' },
        { id: 3, asset: 'LTC/USD', type: 'buy' },
    ];

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
                            <Row justify="space-between">
                                <Col>
                                    <Text>{trade.asset}</Text>
                                </Col>
                                <Col>
                                    <Tag color={trade.type === 'buy' ? 'green' : 'red'}>
                                        {trade.type.toUpperCase()}
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
    );
};

export default RecentTrades;