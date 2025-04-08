import React from 'react';
import { 
  Result, 
  Button, 
  Space, 
  Typography,
  Row,
  Col,
  Card
} from 'antd';
import { 
  HomeOutlined, 
  BugOutlined,
  RocketOutlined 
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <Row justify="center" align="middle" style={{ minHeight: '100vh', padding: '24px' }}>
      <Col xs={24} sm={20} md={16} lg={12}>
        <Card bordered={false} style={{ boxShadow: '0 3px 10px rgba(0, 0, 0, 0.1)' }}>
          <Result
            status="404"
            title={
              <Title level={2} style={{ color: '#ff4d4f' }}>
                Page Not Found
              </Title>
            }
            subTitle={
              <Text type="secondary">
                Oops! The page you're looking for doesn't exist or has been moved.
              </Text>
            }
            extra={
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Paragraph type="secondary" style={{ textAlign: 'center' }}>
                  Here are some helpful links instead:
                </Paragraph>
                
                <Space wrap style={{ justifyContent: 'center' }}>
                  <Button 
                    type="primary" 
                    icon={<HomeOutlined />} 
                    onClick={() => navigate('/')}
                  >
                    Go Home
                  </Button>
                  <Button 
                    icon={<RocketOutlined />} 
                    onClick={() => navigate('/dashboard')}
                  >
                    Dashboard
                  </Button>
                  <Button 
                    icon={<BugOutlined />} 
                    onClick={() => window.open('https://github.com/your-repo/issues', '_blank')}
                  >
                    Report Issue
                  </Button>
                </Space>
              </Space>
            }
          />
          
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <Text type="secondary">
              Still need help? Contact our <a href="/support">support team</a>.
            </Text>
          </div>
        </Card>
      </Col>
    </Row>
  );
};

export default NotFoundPage;