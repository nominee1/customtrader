import React,{ useEffect, useState } from 'react';
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
  Button,
  ConfigProvider,
  Carousel
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
  FacebookOutlined,
  PlayCircleOutlined,
  RocketOutlined,
  BarChartOutlined,
  SafetyOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography; 

const features = [
  {
    icon: <RiseOutlined />,
    title: 'Rise/Fall',
    description: 'Predict market direction',
    path: '/trade/rise-fall'
  },
  {
    icon: <NumberOutlined />,
    title: 'Even/Odd',
    description: 'Bet on digit outcomes',
    path: '/trade/even-odd'
  },
  {
    icon: <ArrowUpOutlined />,
    title: 'Over/Under',
    description: 'Set your price barriers',
    path: '/trade/over-under'
  },
  {
    icon: <BarChartOutlined />,
    title: 'Market Analysis',
    description: 'Real-time insights',
    path: '/analysis'
  }
];

const volatilityIndices = [
  "Volatility 10 Index",
  "Volatility 25 Index",
  "Volatility 50 Index",
  "Volatility 75 Index",
  "Volatility 100 Index",
  "Volatility 10 (1s) Index",
  "Volatility 25 (1s) Index",
  "Volatility 50 (1s) Index",
  "Volatility 75 (1s) Index",
  "Volatility 100 (1s) Index"
];

const educationalResources = [
  "Beginner's Guide to Volatility Trading",
  "Risk Management Strategies",
  "Market Analysis Techniques",
  "Trading Psychology Fundamentals"
];

const testimonials = [
  {
    name: 'James M.',
    content: 'Mulla makes forex trading simple and accessible even for beginners like me',
    role: 'Beginner Trader'
  },
  {
    name: 'Amina S.',
    content: 'The analysis tools help me make better decisions in volatile markets',
    role: 'Day Trader'
  },
  {
    name: 'David K.',
    content: 'Best platform for volatility index trading with tight spreads',
    role: 'Professional Trader'
  }
];

const MainSection = () => {
  const [isHovering, setIsHovering] = useState(null);

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
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#6C5CE7',
          borderRadius: 8,
          colorBgContainer: '#FFFFFF',
        },
        components: {
          Button: {
            colorPrimary: '#6C5CE7',
            colorPrimaryHover: '#8577EF',
            colorPrimaryActive: '#5649CB',
          },
          Card: {
            borderRadiusLG: 16,
          }
        },
      }}
    >
      <div style={{ 
        padding: '0 24px', 
        maxWidth: 1200, 
        margin: '0 auto',
        overflowX: 'hidden'
      }}>
        {/* Hero Section */}
        <Row align="middle" justify="center" style={{ 
          padding: '100px 0', 
          textAlign: 'center',
          background: 'linear-gradient(135deg, #6C5CE7 0%, #00CEFF 100%)',
          borderRadius: 24,
          margin: '24px 0',
          color: 'white'
        }}>
          <Col span={24}>
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
              <Title level={1} style={{ 
                fontSize: '3.5rem', 
                marginBottom: 16,
                color: 'white',
                fontWeight: 800,
                lineHeight: 1.2
              }}>
                Trade Volatility Indices with Confidence
              </Title>
              <Paragraph style={{ 
                fontSize: '1.3rem', 
                margin: '0 auto 32px',
                color: 'rgba(255,255,255,0.9)',
                maxWidth: 700
              }}>
                Simple yet powerful platform for trading volatility indices with educational resources to help you grow
              </Paragraph>
              <Space size="large" style={{ marginTop: 16 }}>
                <Button 
                  type="primary" 
                  size="large"
                  style={{
                    background: '#FF7675',
                    borderColor: '#FF7675',
                    fontWeight: 600,
                    height: 48,
                    padding: '0 32px'
                  }}
                  icon={<RocketOutlined />}
                  onClick={handleSendPing}
                >
                  Start Trading
                </Button>
                <Link to="/dashboard">
                  <Button 
                    size="large"
                    style={{
                      color: 'white',
                      borderColor: 'white',
                      fontWeight: 600,
                      height: 48,
                      padding: '0 32px',
                      background: 'rgba(255,255,255,0.1)'
                    }}
                  >
                    Live Demo
                  </Button>
                </Link>
              </Space>
            </div>
          </Col>
        </Row>

        {/* Trading Features */}
        <Divider orientation="center">
          <Title level={2} style={{ color: '#6C5CE7' }}>Trading Made Simple</Title>
        </Divider>
        <Row gutter={[24, 24]} style={{ marginBottom: 80 }}>
          {features.map((feature, index) => (
            <Col xs={24} sm={12} md={6} key={index}>
              <Link to={feature.path}>
                <Card 
                  hoverable 
                  style={{ 
                    textAlign: 'center', 
                    height: '100%', 
                    borderRadius: 16,
                    borderTop: `4px solid ${['#6C5CE7', '#00CEFF', '#FF7675', '#6C5CE7'][index]}`,
                    boxShadow: '0 4px 12px rgba(108, 92, 231, 0.1)',
                    transition: 'transform 0.3s, box-shadow 0.3s',
                    transform: isHovering === index ? 'translateY(-8px)' : 'none'
                  }}
                  onMouseEnter={() => setIsHovering(index)}
                  onMouseLeave={() => setIsHovering(null)}
                >
                  <div style={{ 
                    marginBottom: 16,
                    transition: 'transform 0.3s',
                    transform: isHovering === index ? 'scale(1.1)' : 'none'
                  }}>
                    {React.cloneElement(feature.icon, { 
                      style: { 
                        fontSize: 42,
                        color: ['#6C5CE7', '#00CEFF', '#FF7675', '#6C5CE7'][index] 
                      } 
                    })}
                  </div>
                  <Title level={4} style={{ color: '#2D3436' }}>{feature.title}</Title>
                  <Text type="secondary">{feature.description}</Text>
                  <div style={{ 
                    marginTop: 16,
                    color: '#6C5CE7',
                    fontWeight: 500,
                    transition: 'all 0.3s',
                    opacity: isHovering === index ? 1 : 0.7
                  }}>
                    Learn more →
                  </div>
                </Card>
              </Link>
            </Col>
          ))}
        </Row>

        {/* Volatility Indices & Education */}
        <Row gutter={[48, 48]} align="middle" style={{ margin: '80px 0' }}>
          <Col xs={24} md={12}>
            <Title level={3}>Popular Volatility Indices</Title>
            <Paragraph style={{ fontSize: 16 }}>
              Trade with tight spreads on these popular volatility indices:
            </Paragraph>
            <Row gutter={[8, 12]} style={{ marginTop: 24 }}>
              {volatilityIndices.map((symbol, i) => (
                <Col xs={24} sm={12} key={i}>
                  <div style={{
                    padding: 16,
                    background: i % 2 === 0 ? '#F1F3FE' : '#E8FAFF',
                    borderRadius: 12,
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'transform 0.2s',
                    ':hover': {
                      transform: 'translateX(4px)'
                    }
                  }}>
                    <div style={{
                      width: 8,
                      height: 8,
                      background: ['#6C5CE7', '#00CEFF', '#FF7675', '#6C5CE7', '#00CEFF'][i % 5],
                      borderRadius: '50%',
                      marginRight: 12,
                      flexShrink: 0
                    }}/>
                    <Text strong style={{ fontSize: 15 }}>{symbol}</Text>
                  </div>
                </Col>
              ))}
            </Row>
          </Col>
          <Col xs={24} md={12}>
            <div style={{ 
              background: 'linear-gradient(135deg, #6C5CE710 0%, #00CEFF10 100%)', 
              padding: 32, 
              borderRadius: 16,
              border: '1px solid #6C5CE720',
              height: '100%'
            }}>
              <Title level={3} style={{ color: '#6C5CE7', marginBottom: 24 }}>
                <SafetyOutlined style={{ marginRight: 12 }} />
                Educational Resources
              </Title>
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                {educationalResources.map((item, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: 16,
                    background: 'white',
                    borderRadius: 12,
                    boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    ':hover': {
                      transform: 'translateX(8px)',
                      boxShadow: '0 4px 16px rgba(108, 92, 231, 0.15)'
                    }
                  }}>
                    <PlayCircleOutlined style={{ 
                      color: '#6C5CE7', 
                      fontSize: 22,
                      marginRight: 16 
                    }}/>
                    <Text style={{ fontSize: 15 }}>{item}</Text>
                  </div>
                ))}
              </Space>
            </div>
          </Col>
        </Row>

        {/* Testimonials Carousel */}
        <Divider orientation="center">
          <Title level={2} style={{ color: '#6C5CE7' }}>Success Stories</Title>
        </Divider>
        <div style={{ marginBottom: 80 }}>
          <Carousel 
            autoplay 
            dotPosition="top"
            effect="fade"
            style={{ 
              borderRadius: 16,
              overflow: 'hidden'
            }}
          >
            {testimonials.map((testimonial, index) => (
              <div key={index}>
                <Card 
                  bordered={false}
                  style={{ 
                    background: index % 2 === 0 ? '#F9F5FF' : '#F0F9FF',
                    borderRadius: 16
                  }}
                >
                  <Row align="middle" gutter={[48, 24]}>
                    <Col xs={24} md={8} style={{ textAlign: 'center' }}>
                      <Avatar 
                        size={120} 
                        style={{ 
                          background: ['#6C5CE7', '#00CEFF', '#FF7675'][index],
                          fontSize: 36,
                          marginBottom: 16
                        }}
                      >
                        {testimonial.name.charAt(0)}
                      </Avatar>
                      <Title level={4} style={{ marginBottom: 4 }}>{testimonial.name}</Title>
                      <Text type="secondary">{testimonial.role}</Text>
                    </Col>
                    <Col xs={24} md={16}>
                      <Paragraph style={{ 
                        fontSize: 18,
                        lineHeight: 1.8,
                        margin: 0
                      }}>
                        <blockquote style={{ 
                          borderLeft: `4px solid ${['#6C5CE7', '#00CEFF', '#FF7675'][index]}`,
                          paddingLeft: 24,
                          margin: 0
                        }}>
                          "{testimonial.content}"
                        </blockquote>
                      </Paragraph>
                    </Col>
                  </Row>
                </Card>
              </div>
            ))}
          </Carousel>
        </div>

        {/* Final CTA */}
        <Row justify="center" style={{ 
          background: 'linear-gradient(135deg, #6C5CE710 0%, #00CEFF10 100%)',
          borderRadius: 16,
          padding: '64px 24px',
          marginBottom: 80,
          textAlign: 'center'
        }}>
          <Col span={24} style={{ maxWidth: 800 }}>
            <Title level={2} style={{ color: '#6C5CE7', marginBottom: 16 }}>
              Ready to Start Trading?
            </Title>
            <Paragraph style={{ fontSize: 18, marginBottom: 32 }}>
              Join thousands of traders who trust our platform for volatility index trading
            </Paragraph>
            <Button 
              type="primary" 
              size="large"
              style={{
                height: 50,
                padding: '0 40px',
                fontWeight: 600,
                fontSize: 16
              }}
              onClick={handleSendPing}
            >
              Create Free Account
            </Button>
          </Col>
        </Row>

        {/* Contact Section */}
        <Divider orientation="center">
          <Title level={2} style={{ color: '#6C5CE7' }}>Need Help?</Title>
        </Divider>
        <Row gutter={[24, 24]} style={{ marginBottom: 60 }}>
          <Col xs={24} md={8}>
            <Card 
              hoverable
              style={{ 
                borderRadius: 16,
                textAlign: 'center',
                transition: 'all 0.3s',
                ':hover': {
                  transform: 'translateY(-8px)'
                }
              }}
            >
              <PhoneOutlined style={{ 
                fontSize: 36, 
                color: '#6C5CE7',
                marginBottom: 16
              }} />
              <Title level={4} style={{ marginBottom: 8 }}>Phone Support</Title>
              <Text strong style={{ fontSize: 16 }}>+254 713 975 073</Text>
              <Paragraph type="secondary" style={{ marginTop: 8 }}>
                24/7 dedicated support
              </Paragraph>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card 
              hoverable
              style={{ 
                borderRadius: 16,
                textAlign: 'center',
                transition: 'all 0.3s',
                ':hover': {
                  transform: 'translateY(-8px)'
                }
              }}
            >
              <MailOutlined style={{ 
                fontSize: 36, 
                color: '#00CEFF',
                marginBottom: 16
              }} />
              <Title level={4} style={{ marginBottom: 8 }}>Email Us</Title>
              <Text strong style={{ fontSize: 16 }}>info@mullake.com</Text>
              <Paragraph type="secondary" style={{ marginTop: 8 }}>
                Typically responds within 1 hour
              </Paragraph>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card 
              hoverable
              style={{ 
                borderRadius: 16,
                textAlign: 'center',
                transition: 'all 0.3s',
                ':hover': {
                  transform: 'translateY(-8px)'
                }
              }}
            >
              <div style={{ marginBottom: 16 }}>
                <Space size="large">
                  <TwitterOutlined style={{ fontSize: 28, color: '#1DA1F2' }} />
                  <FacebookOutlined style={{ fontSize: 28, color: '#4267B2' }} />
                  <InstagramOutlined style={{ fontSize: 28, color: '#E1306C' }} />
                </Space>
              </div>
              <Title level={4} style={{ marginBottom: 8 }}>Social Media</Title>
              <Text strong style={{ fontSize: 16 }}>@mulla_ke</Text>
              <Paragraph type="secondary" style={{ marginTop: 8 }}>
                Follow us for updates
              </Paragraph>
            </Card>
          </Col>
        </Row>
      </div>
    </ConfigProvider>
  );
};

export default MainSection;