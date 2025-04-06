import { Layout, Typography, Divider, Row, Col } from 'antd';
import { GithubOutlined, TwitterOutlined, LinkedinOutlined } from '@ant-design/icons';

const { Footer: AntFooter } = Layout;
const { Text, Link: AntLink } = Typography;

function Footer() {
  return (
    <AntFooter style={{ background: '#f0f2f5', padding: '24px 50px' }}>
      <Row justify="space-between">
        <Col>
          <Text type="secondary">© 2025 My App. All rights reserved.</Text>
        </Col>
        <Col>
          <Space size="middle">
            <AntLink href="https://github.com" target="_blank">
              <GithubOutlined style={{ fontSize: '18px' }} />
            </AntLink>
            <AntLink href="https://twitter.com" target="_blank">
              <TwitterOutlined style={{ fontSize: '18px' }} />
            </AntLink>
            <AntLink href="https://linkedin.com" target="_blank">
              <LinkedinOutlined style={{ fontSize: '18px' }} />
            </AntLink>
          </Space>
        </Col>
      </Row>
      <Divider style={{ margin: '16px 0' }} />
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Text strong>Product</Text>
          <div style={{ marginTop: '8px' }}>
            <div><AntLink href="/features">Features</AntLink></div>
            <div><AntLink href="/pricing">Pricing</AntLink></div>
          </div>
        </Col>
        <Col span={8}>
          <Text strong>Support</Text>
          <div style={{ marginTop: '8px' }}>
            <div><AntLink href="/help">Help Center</AntLink></div>
            <div><AntLink href="/contact">Contact Us</AntLink></div>
          </div>
        </Col>
        <Col span={8}>
          <Text strong>Legal</Text>
          <div style={{ marginTop: '8px' }}>
            <div><AntLink href="/privacy">Privacy Policy</AntLink></div>
            <div><AntLink href="/terms">Terms of Service</AntLink></div>
          </div>
        </Col>
      </Row>
    </AntFooter>
  );
}

export default Footer;