import React, { useState, useEffect } from 'react';
import {
    Button,
    Card,
    Select,
    InputNumber,
    Row,
    Col,
    Space,
    Typography,
    Alert,
    ConfigProvider,
    Spin,
    Tooltip,
    Form,
    message,
    Radio,
    Checkbox,
} from 'antd';
import {
    ThunderboltOutlined,
    InfoCircleOutlined,
    DollarOutlined,
    LineChartOutlined,
} from '@ant-design/icons';

import { useUser } from '../../context/AuthContext';
import { useContracts } from '../../context/ContractsContext';
import RequestIdGenerator from '../../services/uniqueIdGenerator';

const { Title, Text } = Typography;
const { Option } = Select;

const volatilityOptions = [
    { value: 'R_10', label: 'Volatility 10 Index' },
    { value: '1HZ10V', label: 'Volatility 10 (1s) Index' },
    { value: 'R_25', label: 'Volatility 25 Index' },
    { value: '1HZ25V', label: 'Volatility 25 (1s) Index' },
    { value: 'R_50', label: 'Volatility 50 Index' },
    { value: '1HZ50V', label: 'Volatility 50 (1s) Index' },
    { value: 'R_75', label: 'Volatility 75 Index' },
    { value: '1HZ75V', label: 'Volatility 75 (1s) Index' },
    { value: 'R_100', label: 'Volatility 100 Index' },
    { value: '1HZ100V', label: 'Volatility 100 (1s) Index' },
];

const growthRates = [
    { value: 1, label: '1%' },
    { value: 2, label: '2%' },
    { value: 3, label: '3%' },
    { value: 4, label: '4%' },
    { value: 5, label: '5%' },
];

const AccumulatorContract = () => {
    const { user, sendAuthorizedRequest, isAuthorized, loading, error, balance } = useUser();
    const { addLiveContract } = useContracts();

    const [form] = Form.useForm();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [basis, setBasis] = useState('stake');

    // Ensure amount does not exceed balance
    useEffect(() => {
        if (user && balance) {
            const currentAmount = form.getFieldValue('amount') || 10;
            if (currentAmount > balance) {
                form.setFieldsValue({ amount: balance });
            }
        }
    }, [user, balance, form]);

    const handleSubmit = async (values) => {
        if (!user || !isAuthorized) {
            message.warning('Please select an account and ensure it is authorized.');
            return;
        }
        setIsSubmitting(true);
        const requestId = RequestIdGenerator.generateContractId();
        const contractData = {
            buy: 1,
            price: values.amount,
            parameters: {
                symbol: values.symbol,
                amount: values.amount,
                basis: basis,
                contract_type: 'ACCU',
                growth_rate: values.growth_rate * 0.01,
                currency: user.currency || 'USD',
                limit_order: {
                    take_profit: values.profit
                }
            },
            loginid: user.loginid,
            req_id: requestId,
        };
        try {
            const response = await sendAuthorizedRequest(contractData);
            const contractId = response?.buy?.contract_id;
            if (!contractId) throw new Error('No contract id returned from purchase');
            addLiveContract && addLiveContract(response.buy);
            message.success('Accumulator contract purchased successfully!');
            form.resetFields();
        } catch (err) {
            message.error(`Failed to purchase contract: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ConfigProvider>
            <Row gutter={[24, 24]}>
                <Col xs={24}>
                    {loading ? (
                        <Spin tip="Loading account details..." size="large" style={{ display: 'block', margin: '50px auto' }} />
                    ) : error ? (
                        <Alert
                            message="Error"
                            description={error}
                            type="error"
                            showIcon
                            style={{ marginBottom: 24 }}
                        />
                    ) : !user || !isAuthorized ? (
                        <Alert
                            message="No Active Account"
                            description="Please select an account and ensure it is authorized to proceed."
                            type="warning"
                            showIcon
                            style={{ marginBottom: 24 }}
                        />
                    ) : null}

                    <Card
                        title={
                            <Space>
                                <ThunderboltOutlined style={{ color: '#722ed1' }} />
                                <Title level={4} style={{ margin: 0, color: '#722ed1' }}>Accumulator Contract</Title>
                            </Space>
                        }
                        style={{
                            borderRadius: 16,
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                        }}
                        extra={
                            <Tooltip title="Accumulator contracts allow you to accumulate profit over a series of ticks.">
                                <InfoCircleOutlined style={{ color: '#722ed1' }} />
                            </Tooltip>
                        }
                    >
                        <Form
                            form={form}
                            layout="vertical"
                            initialValues={{
                                symbol: 'R_10',
                                growth_rate: 1,
                                amount: 10,
                                profit: 0,
                            }}
                            onFinish={handleSubmit}
                        >
                        {/* Basis Selection */}
                        <Form.Item label="Basis">
                            <Radio.Group 
                                value={basis} 
                                onChange={(e) => setBasis(e.target.value)} 
                                buttonStyle="solid"
                                disabled={!user || !isAuthorized}
                                style={{ width: '100%' }}
                            >
                                <Radio.Button value="stake" style={{ width: '50%', textAlign: 'center' }}>
                                    <DollarOutlined style={{ marginRight: 8 }} />
                                    Stake
                                </Radio.Button>
                                <Radio.Button value="payout" style={{ width: '50%', textAlign: 'center' }}>
                                    <DollarOutlined style={{ marginRight: 8 }} />
                                    Payout
                                </Radio.Button>
                            </Radio.Group>
                        </Form.Item>

                        <Form.Item
                                label="Volatility Index"
                                name="symbol"
                                rules={[{ required: true, message: 'Please select a volatility index' }]}
                            >
                                <Select
                                    placeholder="Select a volatility index"
                                    optionLabelProp="label"
                                    disabled={!user || !isAuthorized}
                                >
                                    {volatilityOptions.map(option => (
                                        <Option key={option.value} value={option.value} label={option.label}>
                                            {option.label}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>

                            <Form.Item
                                label="Growth rate (%)"
                                name="growth_rate"
                                rules={[{ required: true, message: 'Please select a growth rate' }]}
                            >
                                <Select disabled={!user || !isAuthorized}>
                                    {growthRates.map(option => (
                                        <Option key={option.value} value={option.value}>
                                            {option.label}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>

                            <Form.Item
                                label={`Amount (${user?.currency || 'USD'})`}
                                name="amount"
                                rules={[
                                    { required: true, message: 'Please enter an amount' },
                                    { type: 'number', min: 1, message: 'Amount must be at least 1' },
                                    { type: 'number', max: balance || 1000, message: 'Amount exceeds balance' },
                                ]}
                            >
                                <InputNumber
                                    min={1}
                                    max={balance || 1000}
                                    style={{ width: '100%' }}
                                    precision={2}
                                    prefix={<DollarOutlined />}
                                    step={5}
                                    disabled={!user || !isAuthorized}
                                />
                            </Form.Item>
                            {user && balance !== undefined && (
                                <Text type="secondary">
                                    Available balance: {balance.toFixed(2)} {user.currency}
                                </Text>
                            )}

                            <Form.Item name="enable_profit" valuePropName="checked" initialValue={false}>
                              <Checkbox disabled={!user || !isAuthorized}>Enable Take Profit</Checkbox>
                            </Form.Item>

                            <Form.Item noStyle shouldUpdate={(prev, curr) => prev.enable_profit !== curr.enable_profit}>
                              {({ getFieldValue }) =>
                                getFieldValue('enable_profit') ? (
                                  <Form.Item
                                    label={`Take Profit (${user?.currency || 'USD'})`}
                                    name="profit"
                                    rules={[
                                      {
                                        validator: (_, value) => {
                                          if (value == null) return Promise.reject(new Error('Please enter a take profit value'));
                                          if (value < 1 || value > balance) return Promise.reject(new Error(`Profit must be between 1 and ${balance?.toFixed(2)}`));
                                          return Promise.resolve();
                                        },
                                      },
                                    ]}
                                  >
                                    <InputNumber
                                      min={1}
                                      max={balance || 1000}
                                      style={{ width: '100%' }}
                                      precision={2}
                                      prefix={<DollarOutlined />}
                                      step={5}
                                      disabled={!user || !isAuthorized}
                                    />
                                  </Form.Item>
                                ) : null
                              }
                            </Form.Item>

                            <Button
                                type="primary"
                                size="large"
                                block
                                style={{
                                    background: '#722ed1',
                                    borderColor: '#722ed1',
                                    height: 48
                                }}
                                htmlType="submit"
                                loading={isSubmitting}
                                disabled={isSubmitting || !user || !isAuthorized}
                            >
                                Purchase Accumulator
                            </Button>
                        </Form>
                    </Card>
                </Col>
            </Row>
        </ConfigProvider>
    );
};

export default AccumulatorContract;
