import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  Statistic, 
  Tag, 
  Divider, 
  Button, 
  Space, 
  Avatar,
  List,
  Skeleton,
  Alert
} from 'antd';
import { 
  UserOutlined,
  MailOutlined,
  SafetyOutlined,
  DollarOutlined,
  GlobalOutlined,
  VerifiedOutlined,
  EditOutlined,
  LockOutlined
} from '@ant-design/icons';
import { DerivAPI } from '@deriv/deriv-api';

const { Title, Text } = Typography;

const UserProfile = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const api = new DerivAPI({ app_id: 'YOUR_VALID_APP_ID' }); // Replace with your valid app ID
        const account = await api.account();
        
        // Fetch multiple user data points in parallel
        const [accountInfo, settings, limits] = await Promise.all([
          account.getAccountInfo(),
          account.getSettings(),
          account.getLimits()
        ]);

        setUserData({
          ...accountInfo,
          ...settings,
          ...limits
        });
      } catch (err) {
        setError(err.message || 'Failed to fetch user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const renderDetailItem = (icon, title, value, extra = null) => (
    <List.Item>
      <List.Item.Meta
        avatar={icon}
        title={<Text strong>{title}</Text>}
        description={
          <Space>
            <Text>{value || 'Not set'}</Text>
            {extra}
          </Space>
        }
      />
    </List.Item>
  );

  if (loading) return <Skeleton active paragraph={{ rows: 6 }} />;
  if (error) return <Alert message={error} type="error" showIcon />;

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      <Row gutter={[24, 24]}>
        {/* Profile Overview */}
        <Col xs={24} md={8}>
          <Card>
            <Space direction="vertical" align="center" style={{ width: '100%' }}>
              <Avatar size={128} icon={<UserOutlined />} src={userData?.profile_image} />
              <Title level={4} style={{ marginTop: 16 }}>
                {userData?.name || 'Deriv User'}
              </Title>
              <Tag icon={<VerifiedOutlined />} color="green">
                {userData?.account_type.toUpperCase()}
              </Tag>
              <Button type="primary" icon={<EditOutlined />} style={{ marginTop: 16 }}>
                Edit Profile
              </Button>
            </Space>
          </Card>

          <Card title="Account Status" style={{ marginTop: 24 }}>
            <List size="small">
              {renderDetailItem(
                <SafetyOutlined />,
                'Verification',
                userData?.status.join(', ') || 'Not verified',
                <Tag color={userData?.status.includes('verified') ? 'green' : 'orange'}>
                  {userData?.status.includes('verified') ? 'Verified' : 'Pending'}
                </Tag>
              )}
              {renderDetailItem(
                <LockOutlined />,
                '2FA',
                userData?.two_factor_authentication ? 'Enabled' : 'Disabled',
                <Button type="link" size="small">
                  {userData?.two_factor_authentication ? 'Disable' : 'Enable'}
                </Button>
              )}
            </List>
          </Card>
        </Col>

        {/* Account Details */}
        <Col xs={24} md={16}>
          <Card title="Account Information">
            <List itemLayout="horizontal">
              {renderDetailItem(
                <MailOutlined />, 
                'Email', 
                userData?.email
              )}
              {renderDetailItem(
                <GlobalOutlined />, 
                'Country', 
                userData?.country
              )}
              {renderDetailItem(
                <UserOutlined />, 
                'Account ID', 
                userData?.loginid
              )}
              {renderDetailItem(
                <DollarOutlined />, 
                'Currency', 
                userData?.currency
              )}
            </List>
          </Card>

          <Card title="Financial Summary" style={{ marginTop: 24 }}>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Statistic
                  title="Account Balance"
                  value={userData?.balance}
                  precision={2}
                  prefix={<DollarOutlined />}
                />
              </Col>
              <Col xs={24} sm={12}>
                <Statistic
                  title="Trading Limit"
                  value={userData?.daily_transfers?.max}
                  precision={2}
                  prefix={<DollarOutlined />}
                />
              </Col>
            </Row>
            <Divider />
            <Text type="secondary">
              Last login: {new Date(userData?.last_login).toLocaleString()}
            </Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default UserProfile;