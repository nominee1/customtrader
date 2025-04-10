import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Switch, 
  Select, 
  Typography, 
  Button, 
  message, 
  Divider,
  Tabs,
  Form,
  Input,
  Modal,
  Avatar,
  Upload,
  Badge,
  ConfigProvider,
  theme,
  Space
} from 'antd';
import { 
  BellOutlined,
  MoonOutlined,
  SunOutlined,
  LockOutlined,
  DeleteOutlined,
  UserOutlined,
  MailOutlined,
  SafetyOutlined,
  CloudUploadOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useUser } from '../context/AuthContext';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { useToken } = theme;

const SettingsPage = () => {
  const { user } = useUser();
  const { token } = useToken();
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    notifications: true,
    emailNotifications: true,
    soundNotifications: false,
    theme: 'light',
    twoFactorAuth: false
  });
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [, setAvatarLoading] = useState(false); // Remove unused 'avatarLoading'

  useEffect(() => {
    // Load saved settings from localStorage or API
    const savedSettings = JSON.parse(localStorage.getItem('userSettings')) || {};
    setSettings(prev => ({ ...prev, ...savedSettings }));
  }, []);

  const handleSaveSettings = () => {
    localStorage.setItem('userSettings', JSON.stringify(settings));
    message.success('Settings saved successfully!');
  };

  const handleProfileUpdate = async () => {
    try {
      // API call to update profile would go here
      message.success('Profile updated successfully!');
      setProfileModalVisible(false);
    } catch {
      message.error('Failed to update profile. Please try again.');
    }
  };

  const handleAvatarChange = (info) => {
    if (info.file.status === 'uploading') {
      setAvatarLoading(true);
      return;
    }
    if (info.file.status === 'done') {
      setAvatarLoading(false);
      message.success('Avatar updated successfully!');
    }
  };

  const handleAccountDeletion = () => {
    // API call to delete account would go here
    message.warning('Account deletion requested. Confirmation email sent.');
    setDeleteModalVisible(false);
  };

  return (
    <ConfigProvider
      theme={{
        components: {
          Card: {
            borderRadiusLG: 16,
          },
          Button: {
            colorPrimary: token.colorPrimary,
            colorPrimaryHover: `${token.colorPrimary}dd`,
          }
        }
      }}
    >
      <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          tabBarExtraContent={
            <Button 
              type="primary" 
              onClick={handleSaveSettings}
              icon={<CheckCircleOutlined />}
            >
              Save Changes
            </Button>
          }
        >
          <TabPane 
            tab={
              <span>
                <UserOutlined />
                General
              </span>
            } 
            key="general"
          >
            <Row gutter={[24, 24]}>
              {/* Profile Settings */}
              <Col xs={24} md={12}>
                <Card
                  title="Profile Information"
                  style={{ 
                    borderRadius: 16,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                  }}
                >
                  <Space direction="vertical" align="center" style={{ width: '100%' }}>
                    <Badge 
                      count={
                        <Upload
                          showUploadList={false}
                          onChange={handleAvatarChange}
                          customRequest={({ onSuccess }) => {
                            setTimeout(() => {
                              onSuccess("ok");
                            }, 1000);
                          }}
                        >
                          <Button 
                            type="text" 
                            icon={<CloudUploadOutlined />} 
                            style={{ color: token.colorPrimary }}
                          />
                        </Upload>
                      }
                      offset={[-20, 90]}
                    >
                      <Avatar 
                        size={128} 
                        src={user?.avatar} 
                        icon={<UserOutlined />}
                        style={{ 
                          background: token.colorPrimary,
                          color: 'white',
                          fontSize: 48
                        }}
                      />
                    </Badge>
                    <Title level={4} style={{ marginTop: 16, marginBottom: 0 }}>
                      {user?.fullname || 'User'}
                    </Title>
                    <Text type="secondary">{user?.email}</Text>
                    <Button 
                      type="default"
                      style={{ marginTop: 16 }}
                      onClick={() => setProfileModalVisible(true)}
                    >
                      Edit Profile
                    </Button>
                  </Space>
                </Card>
              </Col>

              {/* Theme Settings */}
              <Col xs={24} md={12}>
                <Card
                  title="Appearance"
                  style={{ 
                    borderRadius: 16,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                  }}
                >
                  <Space direction="vertical" size={16} style={{ width: '100%' }}>
                    <div>
                      <Text strong>Theme</Text>
                      <Select
                        value={settings.theme}
                        onChange={(value) => setSettings({ ...settings, theme: value })}
                        style={{ width: '100%', marginTop: 8 }}
                        suffixIcon={settings.theme === 'light' ? <SunOutlined /> : <MoonOutlined />}
                      >
                        <Option value="light">
                          <Space>
                            <SunOutlined />
                            Light Mode
                          </Space>
                        </Option>
                        <Option value="dark">
                          <Space>
                            <MoonOutlined />
                            Dark Mode
                          </Space>
                        </Option>
                        <Option value="system">
                          <Space>
                            <SettingOutlined />
                            System Default
                          </Space>
                        </Option>
                      </Select>
                    </div>

                    <div>
                      <Text strong>Accent Color</Text>
                      <Select
                        defaultValue="primary"
                        style={{ width: '100%', marginTop: 8 }}
                      >
                        <Option value="primary">Primary ({token.colorPrimary})</Option>
                        <Option value="blue">Blue</Option>
                        <Option value="purple">Purple</Option>
                        <Option value="red">Red</Option>
                      </Select>
                    </div>
                  </Space>
                </Card>
              </Col>
            </Row>
          </TabPane>

          <TabPane 
            tab={
              <span>
                <BellOutlined />
                Notifications
              </span>
            } 
            key="notifications"
          >
            <Card
              style={{ 
                borderRadius: 16,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
              }}
            >
              <Space direction="vertical" size={24} style={{ width: '100%' }}>
                <div>
                  <Text strong>Notification Preferences</Text>
                  <Divider style={{ margin: '12px 0' }} />
                  <Space direction="vertical" size={16}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text>Enable Notifications</Text>
                      <Switch
                        checked={settings.notifications}
                        onChange={(checked) => setSettings({ ...settings, notifications: checked })}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text>Email Notifications</Text>
                      <Switch
                        checked={settings.emailNotifications}
                        onChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
                        disabled={!settings.notifications}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text>Sound Notifications</Text>
                      <Switch
                        checked={settings.soundNotifications}
                        onChange={(checked) => setSettings({ ...settings, soundNotifications: checked })}
                        disabled={!settings.notifications}
                      />
                    </div>
                  </Space>
                </div>

                <div>
                  <Text strong>Notification Types</Text>
                  <Divider style={{ margin: '12px 0' }} />
                  <Space direction="vertical" size={16}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text>Trade Alerts</Text>
                      <Switch defaultChecked />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text>Deposit/Withdrawal Notifications</Text>
                      <Switch defaultChecked />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text>Market Updates</Text>
                      <Switch defaultChecked />
                    </div>
                  </Space>
                </div>
              </Space>
            </Card>
          </TabPane>

          <TabPane 
            tab={
              <span>
                <SafetyOutlined />
                Security
              </span>
            } 
            key="security"
          >
            <Card
              style={{ 
                borderRadius: 16,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
              }}
            >
              <Space direction="vertical" size={24} style={{ width: '100%' }}>
                <div>
                  <Text strong>Two-Factor Authentication</Text>
                  <Divider style={{ margin: '12px 0' }} />
                  <Space direction="vertical" size={8}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text>Enable 2FA</Text>
                      <Switch
                        checked={settings.twoFactorAuth}
                        onChange={(checked) => setSettings({ ...settings, twoFactorAuth: checked })}
                      />
                    </div>
                    <Text type="secondary">
                      {settings.twoFactorAuth 
                        ? 'Two-factor authentication is currently enabled'
                        : 'Add an extra layer of security to your account'}
                    </Text>
                    {!settings.twoFactorAuth && (
                      <Button type="primary" size="small">
                        Set Up 2FA
                      </Button>
                    )}
                  </Space>
                </div>

                <div>
                  <Text strong>Password</Text>
                  <Divider style={{ margin: '12px 0' }} />
                  <Button 
                    icon={<LockOutlined />}
                    onClick={() => message.info('Password change functionality coming soon!')}
                  >
                    Change Password
                  </Button>
                </div>

                <div>
                  <Text strong>Active Sessions</Text>
                  <Divider style={{ margin: '12px 0' }} />
                  <Space direction="vertical" size={8}>
                    <Text>Current session (this device)</Text>
                    <Text type="secondary">{new Date().toLocaleString()}</Text>
                    <Button type="link" danger size="small">
                      Log out all other devices
                    </Button>
                  </Space>
                </div>
              </Space>
            </Card>
          </TabPane>

          <TabPane 
            tab={
              <span>
                <ExclamationCircleOutlined />
                Danger Zone
              </span>
            } 
            key="danger"
          >
            <Card
              style={{ 
                borderRadius: 16,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                borderColor: token.colorError
              }}
            >
              <Space direction="vertical" size={24} style={{ width: '100%' }}>
                <div>
                  <Text strong type="danger">Delete Account</Text>
                  <Divider style={{ margin: '12px 0' }} />
                  <Space direction="vertical" size={8}>
                    <Text>Permanently delete your account and all associated data.</Text>
                    <Text type="secondary">This action cannot be undone.</Text>
                    <Button 
                      type="primary" 
                      danger 
                      icon={<DeleteOutlined />}
                      onClick={() => setDeleteModalVisible(true)}
                    >
                      Delete Account
                    </Button>
                  </Space>
                </div>

                <div>
                  <Text strong type="danger">Export Data</Text>
                  <Divider style={{ margin: '12px 0' }} />
                  <Button type="default">
                    Request Data Export
                  </Button>
                </div>
              </Space>
            </Card>
          </TabPane>
        </Tabs>

        {/* Edit Profile Modal */}
        <Modal
          title="Edit Profile"
          visible={profileModalVisible}
          onCancel={() => setProfileModalVisible(false)}
          footer={[
            <Button key="back" onClick={() => setProfileModalVisible(false)}>
              Cancel
            </Button>,
            <Button 
              key="submit" 
              type="primary" 
              onClick={() => form.submit()}
            >
              Save Changes
            </Button>,
          ]}
        >
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              name: user?.fullname,
              email: user?.email
            }}
            onFinish={handleProfileUpdate}
          >
            <Form.Item
              label="Full Name"
              name="name"
              rules={[{ required: true, message: 'Please input your name!' }]}
            >
              <Input prefix={<UserOutlined />} />
            </Form.Item>
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: 'Please input your email!' },
                { type: 'email', message: 'Please enter a valid email!' }
              ]}
            >
              <Input prefix={<MailOutlined />} />
            </Form.Item>
          </Form>
        </Modal>

        {/* Delete Account Modal */}
        <Modal
          title="Confirm Account Deletion"
          visible={deleteModalVisible}
          onCancel={() => setDeleteModalVisible(false)}
          footer={[
            <Button key="back" onClick={() => setDeleteModalVisible(false)}>
              Cancel
            </Button>,
            <Button 
              key="submit" 
              type="primary" 
              danger
              onClick={handleAccountDeletion}
            >
              Delete Account
            </Button>,
          ]}
        >
          <Space direction="vertical" size={16}>
            <Text strong>Are you sure you want to delete your account?</Text>
            <Text type="secondary">
              This will permanently remove all your data including:
            </Text>
            <ul>
              <li>Trade history</li>
              <li>Account balance</li>
              <li>Personal information</li>
            </ul>
            <Text type="warning">
              This action cannot be undone. Please be certain.
            </Text>
          </Space>
        </Modal>
      </div>
    </ConfigProvider>
  );
};

export default SettingsPage;