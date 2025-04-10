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
  Alert,
  Progress,
  Badge,
  ConfigProvider,
  theme
} from 'antd';
import { 
  UserOutlined,
  MailOutlined,
  SafetyOutlined,
  DollarOutlined,
  GlobalOutlined,
  VerifiedOutlined,
  EditOutlined,
  LockOutlined,
  IdcardOutlined,
  CalendarOutlined,
  TransactionOutlined
} from '@ant-design/icons';
import { useUser } from '../context/AuthContext'; 

const { Title, Text } = Typography;
const { useToken } = theme;

const UserProfile = () => {
  const { user, loading, error } = useUser();
  const { token } = useToken();
  const { colorPrimary, colorSuccess, colorWarning, colorError } = token;

  const renderDetailItem = (icon, title, value, extra = null, isVerified = false) => (
    <List.Item style={{ padding: '12px 0' }}>
      <List.Item.Meta
        avatar={
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            background: `${colorPrimary}10`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {React.cloneElement(icon, { 
              style: { 
                color: colorPrimary,
                fontSize: 18 
              } 
            })}
          </div>
        }
        title={<Text strong style={{ fontSize: 15 }}>{title}</Text>}
        description={
          <Space direction="vertical" size={2}>
            <Text style={{ fontSize: 15 }}>{value || 'Not set'}</Text>
            {extra && (
              <Space size={4}>
                {extra}
                {isVerified && (
                  <VerifiedOutlined style={{ color: colorSuccess }} />
                )}
              </Space>
            )}
          </Space>
        }
      />
    </List.Item>
  );

  if (loading) return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <Skeleton active paragraph={{ rows: 8 }} />
    </div>
  );

  if (error) return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <Alert message={error} type="error" showIcon banner />
    </div>
  );

  return (
    <ConfigProvider
      theme={{
        components: {
          Card: {
            borderRadiusLG: 16,
            headerBg: 'transparent',
          },
          Tag: {
            colorPrimary: colorPrimary,
            colorSuccess: colorSuccess,
            colorWarning: colorWarning,
            colorError: colorError,
          }
        }
      }}
    >
      <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
        <Row gutter={[24, 24]}>
          {/* Profile Overview */}
          <Col xs={24} md={8}>
            <Card
              style={{ 
                borderRadius: 16,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
              }}
            >
              <Space direction="vertical" align="center" style={{ width: '100%' }}>
                <Badge 
                  count={user?.status?.includes('verified') ? 'Verified' : null} 
                  color={colorSuccess}
                  offset={[-20, 90]}
                  style={{ fontWeight: 600 }}
                >
                  <Avatar 
                    size={128} 
                    icon={<UserOutlined />} 
                    src={user?.profile_image}
                    style={{ 
                      background: colorPrimary,
                      color: 'white',
                      fontSize: 48
                    }}
                  />
                </Badge>
                <Title level={4} style={{ marginTop: 16, marginBottom: 0 }}>
                  {user?.fullname || 'Deriv User'}
                </Title>
                <Tag 
                  icon={<VerifiedOutlined />} 
                  color={user?.account_type === 'premium' ? colorPrimary : 'default'}
                  style={{ 
                    marginTop: 8,
                    textTransform: 'uppercase',
                    fontWeight: 600
                  }}
                >
                  {user?.account_type || 'Standard'}
                </Tag>
                <Button 
                  type="primary" 
                  icon={<EditOutlined />} 
                  style={{ 
                    marginTop: 24,
                    width: '100%'
                  }}
                >
                  Edit Profile
                </Button>
              </Space>
            </Card>

            <Card 
              title="Account Security" 
              style={{ 
                marginTop: 24,
                borderRadius: 16,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
              }}
            >
              <List size="large">
                {renderDetailItem(
                  <SafetyOutlined />,
                  'Verification Status',
                  user?.status?.join(', ') || 'Not verified',
                  <Tag color={user?.status?.includes('verified') ? colorSuccess : colorWarning}>
                    {user?.status?.includes('verified') ? 'Verified' : 'Pending'}
                  </Tag>,
                  user?.status?.includes('verified')
                )}
                {renderDetailItem(
                  <LockOutlined />,
                  'Two-Factor Authentication',
                  user?.two_factor_authentication ? 'Enabled' : 'Disabled',
                  <Button 
                    type={user?.two_factor_authentication ? 'default' : 'primary'} 
                    size="small"
                    style={{
                      background: user?.two_factor_authentication ? 'transparent' : `${colorPrimary}10`,
                      color: user?.two_factor_authentication ? colorError : colorPrimary,
                      borderColor: user?.two_factor_authentication ? colorError : colorPrimary
                    }}
                  >
                    {user?.two_factor_authentication ? 'Disable' : 'Enable'}
                  </Button>
                )}
                <Divider style={{ margin: '12px 0' }} />
                <div style={{ padding: '0 16px' }}>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>Account Strength</Text>
                  <Progress 
                    percent={user?.status?.includes('verified') ? 85 : 45} 
                    strokeColor={user?.status?.includes('verified') ? colorSuccess : colorWarning}
                    trailColor="#f0f0f0"
                    showInfo={false}
                  />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {user?.status?.includes('verified') ? 'Strong' : 'Medium'} security level
                  </Text>
                </div>
              </List>
            </Card>
          </Col>

          {/* Account Details */}
          <Col xs={24} md={16}>
            <Card 
              title="Personal Information"
              style={{ 
                borderRadius: 16,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
              }}
            >
              <List itemLayout="horizontal">
                {renderDetailItem(
                  <MailOutlined />, 
                  'Email Address', 
                  user?.email,
                  <Tag color={user?.email_verified ? colorSuccess : colorWarning}>
                    {user?.email_verified ? 'Verified' : 'Unverified'}
                  </Tag>
                )}
                {renderDetailItem(
                  <GlobalOutlined />, 
                  'Country of Residence', 
                  user?.country
                )}
                {renderDetailItem(
                  <IdcardOutlined />, 
                  'Account ID', 
                  user?.loginid
                )}
                {renderDetailItem(
                  <DollarOutlined />, 
                  'Account Currency', 
                  user?.currency
                )}
              </List>
            </Card>

            <Card 
              title="Financial Summary" 
              style={{ 
                marginTop: 24,
                borderRadius: 16,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
              }}
            >
              <Row gutter={[24, 24]}>
                <Col xs={24} sm={12}>
                  <Statistic
                    title={
                      <Space>
                        <DollarOutlined style={{ color: colorPrimary }} />
                        <Text>Account Balance</Text>
                      </Space>
                    }
                    value={user?.balance}
                    precision={2}
                    valueStyle={{ 
                      fontSize: 28,
                      fontWeight: 600,
                      color: colorPrimary
                    }}
                  />
                </Col>
                <Col xs={24} sm={12}>
                  <Statistic
                    title={
                      <Space>
                        <TransactionOutlined style={{ color: colorPrimary }} />
                        <Text>Daily Trading Limit</Text>
                      </Space>
                    }
                    value={user?.daily_transfers?.max || 0}
                    precision={2}
                    valueStyle={{ 
                      fontSize: 28,
                      fontWeight: 600 
                    }}
                  />
                </Col>
              </Row>
              <Divider style={{ margin: '16px 0' }} />
              <Space>
                <CalendarOutlined style={{ color: colorPrimary }} />
                <Text type="secondary">
                  Last login: {user?.last_login ? new Date(user?.last_login).toLocaleString() : 'N/A'}
                </Text>
              </Space>
            </Card>

            {/* Recent Activity */}
            <Card 
              title="Recent Activity"
              style={{ 
                marginTop: 24,
                borderRadius: 16,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
              }}
            >
              <div style={{ 
                height: 200, 
                background: 'linear-gradient(90deg, #6C5CE710, #6C5CE705)', 
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Text type="secondary">Recent activity chart will appear here</Text>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </ConfigProvider>
  );
};

export default UserProfile;