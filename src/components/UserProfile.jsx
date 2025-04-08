import React from 'react';
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
import { useUser } from '../context/AuthContext'; 

const { Title, Text } = Typography;

const UserProfile = () => {
  const { user, loading, error } = useUser(); 

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
              <Avatar size={128} icon={<UserOutlined />} src={user?.profile_image} />
              <Title level={4} style={{ marginTop: 16 }}>
                {user?.fullname || 'Deriv User'}
              </Title>
              <Tag icon={<VerifiedOutlined />} color="green">
                {user?.account_type?.toUpperCase() || 'Standard'}
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
                user?.status?.join(', ') || 'Not verified',
                <Tag color={user?.status?.includes('verified') ? 'green' : 'orange'}>
                  {user?.status?.includes('verified') ? 'Verified' : 'Pending'}
                </Tag>
              )}
              {renderDetailItem(
                <LockOutlined />,
                '2FA',
                user?.two_factor_authentication ? 'Enabled' : 'Disabled',
                <Button type="link" size="small">
                  {user?.two_factor_authentication ? 'Disable' : 'Enable'}
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
                user?.email
              )}
              {renderDetailItem(
                <GlobalOutlined />, 
                'Country', 
                user?.country
              )}
              {renderDetailItem(
                <UserOutlined />, 
                'Account ID', 
                user?.loginid
              )}
              {renderDetailItem(
                <DollarOutlined />, 
                'Currency', 
                user?.currency
              )}
            </List>
          </Card>

          <Card title="Financial Summary" style={{ marginTop: 24 }}>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Statistic
                  title="Account Balance"
                  value={user?.balance}
                  precision={2}
                  prefix={<DollarOutlined />}
                />
              </Col>
              <Col xs={24} sm={12}>
                <Statistic
                  title="Trading Limit"
                  value={user?.daily_transfers?.max || 0}
                  precision={2}
                  prefix={<DollarOutlined />}
                />
              </Col>
            </Row>
            <Divider />
            <Text type="secondary">
              Last login: {user?.last_login ? new Date(user?.last_login).toLocaleString() : 'N/A'}
            </Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default UserProfile;