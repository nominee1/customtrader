import React, { useState } from 'react';
import { Card, Row, Col, Switch, Select, Typography, Button, message } from 'antd';

const { Title, Text } = Typography;
const { Option } = Select;

const SettingsPage = () => {
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [theme, setTheme] = useState('light');

    const handleSaveSettings = () => {
        message.success('Settings saved successfully!');
        // Here, you can add logic to save settings to a backend or local storage
    };

    return (
        <div style={{ padding: '24px' }}>
            <Row gutter={[24, 24]}>
                {/* Notifications Settings */}
                <Col xs={24} md={12}>
                    <Card style={{ borderRadius: 8 }}>
                        <Title level={3}>Notifications</Title>
                        <Text>Enable or disable notifications for account activity and updates.</Text>
                        <div style={{ marginTop: 16 }}>
                            <Text>Notifications: </Text>
                            <Switch
                                checked={notificationsEnabled}
                                onChange={(checked) => setNotificationsEnabled(checked)}
                                style={{ marginLeft: 8 }}
                            />
                        </div>
                    </Card>
                </Col>

                {/* Theme Settings */}
                <Col xs={24} md={12}>
                    <Card style={{ borderRadius: 8 }}>
                        <Title level={3}>Theme</Title>
                        <Text>Select your preferred theme for the application.</Text>
                        <div style={{ marginTop: 16 }}>
                            <Text>Theme: </Text>
                            <Select
                                value={theme}
                                onChange={(value) => setTheme(value)}
                                style={{ marginLeft: 8, width: 120 }}
                            >
                                <Option value="light">Light</Option>
                                <Option value="dark">Dark</Option>
                            </Select>
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* Account Settings */}
            <Row gutter={[24, 24]} style={{ marginTop: 32 }}>
                <Col xs={24}>
                    <Card style={{ borderRadius: 8 }}>
                        <Title level={3}>Account</Title>
                        <Text>Manage your account settings and preferences.</Text>
                        <div style={{ marginTop: 16 }}>
                            <Button
                                type="primary"
                                style={{ marginRight: 16 }}
                                onClick={() => message.info('Change Password functionality coming soon!')}
                            >
                                Change Password
                            </Button>
                            <Button
                                type="danger"
                                onClick={() => message.info('Account Deletion functionality coming soon!')}
                            >
                                Delete Account
                            </Button>
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* Save Settings Button */}
            <Row style={{ marginTop: 32 }}>
                <Col span={24} style={{ textAlign: 'center' }}>
                    <Button
                        type="primary"
                        size="large"
                        onClick={handleSaveSettings}
                    >
                        Save Settings
                    </Button>
                </Col>
            </Row>
        </div>
    );
};

export default SettingsPage;