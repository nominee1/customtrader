import React from 'react';
import { Layout, Row, Col, Typography } from 'antd';

const { Footer } = Layout;
const { Text } = Typography;

const AppFooter = () => {
  return (
    <Footer style={{ textAlign: 'center', background: '#f0f2f5' }}>
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Text>
            © {new Date().getFullYear()} Mulla. Your trading made easier.
          </Text>
        </Col>
      </Row>
    </Footer>
  );
};

export default AppFooter;