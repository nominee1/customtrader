import React, { useEffect, useState } from 'react';
import { Card, Space, Typography, Row, Col, Tag } from 'antd';
import { HistoryOutlined } from '@ant-design/icons';
import { useUser } from '../context/AuthContext';

const { Text } = Typography;

const RecentTrades = () => {
    const { user, activeAccount, loading: authLoading, sendAuthorizedRequest } = useUser();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [recentTrades, setRecentTrades] = useState([]);

    useEffect(() => {
        const fetchRecentTrades = async () => {
            if (!user || !activeAccount) return;
            
            setLoading(true);
            try {
                const response = await sendAuthorizedRequest({
                    transaction: 1, 
                    subscribe: 1
                });
                // Assuming the response contains trades data
                setRecentTrades(response?.data || []);
            } catch (error) {
                console.error('Error fetching recent trades:', error);
                setError('Failed to fetch recent trades.');
            } finally {
                setLoading(false);
            }
        }
        fetchRecentTrades();
    }, [user, activeAccount, sendAuthorizedRequest]);  
    
    // Remove the hardcoded recentTrades array since we're using state now

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