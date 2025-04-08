import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Typography, Table, Spin, message } from 'antd';
import { DollarCircleOutlined, PlusOutlined, MinusOutlined } from '@ant-design/icons';
import { getAccountBalance, getTransactionHistory } from '../api/derivApi'; 

const { Title, Text } = Typography;

const WalletPage = () => {
    const [balance, setBalance] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch wallet data on component mount
    useEffect(() => {
        const fetchWalletData = async () => {
            try {
                setLoading(true);
                const accountBalance = await getAccountBalance();
                const transactionHistory = await getTransactionHistory();
                setBalance(accountBalance);
                setTransactions(transactionHistory);
            } catch (error) {
                message.error('Failed to load wallet data. Please try again.');
                console.error('Error fetching wallet data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchWalletData();
    }, []);
    

    const columns = [
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
        },
        {
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            render: (amount) => <Text>{amount > 0 ? `+${amount}` : amount}</Text>,
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
        },
    ];

    return (
        <div style={{ padding: '24px' }}>
            <Row gutter={[24, 24]}>
                {/* Account Balance */}
                <Col xs={24} md={12}>
                    <Card style={{ textAlign: 'center', borderRadius: 8 }}>
                        <DollarCircleOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                        <Title level={3} style={{ marginTop: 16 }}>Account Balance</Title>
                        {loading ? (
                            <Spin />
                        ) : (
                            <Title level={2}>{balance ? `$${balance}` : 'N/A'}</Title>
                        )}
                    </Card>
                </Col>

                {/* Deposit and Withdraw Buttons */}
                <Col xs={24} md={12}>
                    <Card style={{ textAlign: 'center', borderRadius: 8 }}>
                        <Title level={3}>Manage Funds</Title>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            style={{ margin: '8px' }}
                            onClick={() => message.info('Deposit functionality coming soon!')}
                        >
                            Deposit
                        </Button>
                        <Button
                            type="danger"
                            icon={<MinusOutlined />}
                            style={{ margin: '8px' }}
                            onClick={() => message.info('Withdraw functionality coming soon!')}
                        >
                            Withdraw
                        </Button>
                    </Card>
                </Col>
            </Row>

            {/* Transaction History */}
            <Row style={{ marginTop: 32 }}>
                <Col span={24}>
                    <Card style={{ borderRadius: 8 }}>
                        <Title level={3}>Transaction History</Title>
                        {loading ? (
                            <Spin />
                        ) : (
                            <Table
                                dataSource={transactions}
                                columns={columns}
                                rowKey="id"
                                pagination={{ pageSize: 5 }}
                            />
                        )}
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default WalletPage;