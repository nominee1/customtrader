import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

// Simple spinner
function PageLoader() {
  return (
    <div style={{ textAlign: 'center', padding: 50 }}>
      <Spin size="large" />
    </div>
  );
}

// Custom icon spinner
function CustomSpinner() {
  return (
    <Spin 
      indicator={<LoadingOutlined style={{ fontSize: 48, color: '#1890ff' }} spin />} 
    />
  );
}