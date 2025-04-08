import { useEffect} from 'react';
import { derivWebSocket } from '../../services/websocket_client';
import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  Space,
  Divider,
  Tag,
  Avatar,
  Button
} from 'antd';
import {
  LineChartOutlined,
  RiseOutlined,
  NumberOutlined,
  ArrowUpOutlined,
  PhoneOutlined,
  MailOutlined,
  TwitterOutlined,
  InstagramOutlined,
  FacebookOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography; 

const features = [
  {
    icon: <RiseOutlined style={{ fontSize: 32, color: '#1890ff' }} />,
    title: 'Rise/Fall',
    description: 'Predict market direction',
    path: '/trade/rise-fall'
  },
  {
    icon: <NumberOutlined style={{ fontSize: 32, color: '#1890ff' }} />,
    title: 'Even/Odd',
    description: 'Bet on digit outcomes',
    path: '/trade/even-odd'
  },
  {
    icon: <ArrowUpOutlined style={{ fontSize: 32, color: '#1890ff' }} />,
    title: 'Over/Under',
    description: 'Set your price barriers',
    path: '/trade/over-under'
  },
  {
    icon: <LineChartOutlined style={{ fontSize: 32, color: '#1890ff' }} />,
    title: 'Market Analysis',
    description: 'Real-time forex insights',
    path: '/analysis'
  }
];

const testimonials = [
  {
    name: 'James M.',
    content: 'Mulla makes forex trading simple and accessible'
  },
  {
    name: 'Amina S.',
    content: 'The analysis tools help me make better decisions'
  }
];

const MainSection = () => {

  useEffect(() => {
    // Connect to WebSocket
    derivWebSocket.connect();
    
    // Subscribe to messages
    const unsubscribe = derivWebSocket.subscribe((event, data) => {
      console.log('WebSocket event:', event, data);
    });

    return () => {
      // Cleanup
      unsubscribe();
      derivWebSocket.close();
    };
  }, []);

  const handleSendPing = () => {
    derivWebSocket.send({ ping: 1 });
  };

  return (
    <div style={{ padding: '0 24px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Hero Section */}
      <Row align="middle" style={{ padding: '100px 0', textAlign: 'center' }}>
        <Col span={24}>
          <Title level={1} style={{ fontSize: '3rem', marginBottom: 16 }}>
            Your trading made easier
          </Title>
          <Paragraph style={{ fontSize: '1.2rem', maxWidth: 600, margin: '0 auto 32px' }}>
            Simple forex trading with Rise/Fall, Even/Odd, and Over/Under contracts
          </Paragraph>
          <Space size="large">
              <Button onClick={handleSendPing} type="primary" size="large">
                Start Trading
              </Button>
            <Link to="/dashboard">
              <Button size="large">Live Demo</Button>
            </Link>
          </Space>
        </Col>
      </Row>

      {/* Trading Features */}
      <Divider orientation="center">
        <Title level={2}>Our Trading Options</Title>
      </Divider>
      <Row gutter={[24, 24]} style={{ marginBottom: 60 }}>
        {features.map((feature, index) => (
          <Col xs={24} sm={12} md={6} key={index}>
            <Link to={feature.path}>
              <Card 
                hoverable 
                style={{ textAlign: 'center', height: '100%', borderRadius: 8 }}
              >
                <div style={{ marginBottom: 16 }}>{feature.icon}</div>
                <Title level={4}>{feature.title}</Title>
                <Text type="secondary">{feature.description}</Text>
              </Card>
            </Link>
          </Col>
        ))}
      </Row>

      {/* Forex Focus */}
      <Row gutter={[48, 24]} align="middle" style={{ margin: '60px 0' }}>
        <Col xs={24} md={12}>
          <Title level={3}>Forex Trading Simplified</Title>
          <Paragraph>
            Trade major currency pairs with our intuitive platform:
          </Paragraph>
          <Space size={[8, 16]} wrap style={{ marginTop: 16 }}>
            <Tag color="blue">EUR/USD</Tag>
            <Tag color="geekblue">GBP/USD</Tag>
            <Tag color="cyan">USD/JPY</Tag>
            <Tag color="purple">AUD/USD</Tag>
          </Space>
        </Col>
        <Col xs={24} md={12}>
          <div style={{ background: '#f0f2f5', padding: 24, borderRadius: 8 }}>
            <Title level={4} style={{ marginBottom: 16 }}>Sample Analysis</Title>
            <Paragraph>
              <Text strong>EUR/USD:</Text> Current trend analysis and predictions
            </Paragraph>
            <div style={{ 
              height: 150, 
              background: 'linear-gradient(90deg, #1890ff33, #1890ff10)', 
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 16
            }}>
              <Text type="secondary">Live chart component</Text>
            </div>
          </div>
        </Col>
      </Row>

      {/* Testimonials */}
      <Divider orientation="center">
        <Title level={2}>What Traders Say</Title>
      </Divider>
      <Row gutter={[24, 24]} style={{ marginBottom: 60 }}>
        {testimonials.map((testimonial, index) => (
          <Col xs={24} md={12} key={index}>
            <Card style={{ borderRadius: 8 }}>
              <Card.Meta
                avatar={<Avatar size={48}>{testimonial.name.charAt(0)}</Avatar>}
                title={testimonial.name}
              />
              <Paragraph style={{ marginTop: 16 }}>
                "{testimonial.content}"
              </Paragraph>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Contact */}
      <Divider orientation="center">
        <Title level={2}>Connect With Us</Title>
      </Divider>
      <Row gutter={[24, 24]} style={{ marginBottom: 60 }}>
        <Col xs={24} md={8}>
          <Card hoverable>
            <Space direction="vertical" align="center" style={{ width: '100%' }}>
              <PhoneOutlined style={{ fontSize: 24, color: '#1890ff' }} />
              <Text strong>+254 713 975 073</Text>
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card hoverable>
            <Space direction="vertical" align="center" style={{ width: '100%' }}>
              <MailOutlined style={{ fontSize: 24, color: '#1890ff' }} />
              <Text strong>info@mullake.com</Text>
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card hoverable>
            <Space size="middle" align="center" style={{ width: '100%' }}>
              <a href="https://twitter.com/mulla_ke" target="_blank" rel="noopener noreferrer">
                <TwitterOutlined style={{ fontSize: 24, color: '#1DA1F2' }} />
              </a>
              <a href="https://facebook.com/mulla_ke" target="_blank" rel="noopener noreferrer">
                <FacebookOutlined style={{ fontSize: 24, color: '#4267B2' }} />
              </a>
              <a href="https://instagram.com/mulla_ke" target="_blank" rel="noopener noreferrer">
                <InstagramOutlined style={{ fontSize: 24, color: '#E1306C' }} />
              </a>
              <Text strong>@mulla_ke</Text>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default MainSection;