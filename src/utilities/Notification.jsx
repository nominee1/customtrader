import { notification } from 'antd';

// Success
notification.success({
  message: 'Success!',
  description: 'Your action was completed successfully.',
  placement: 'topRight',
  duration: 4.5,
});

// Error
notification.error({
  message: 'Error',
  description: 'Failed to process your request.',
});

// Custom
notification.open({
  message: 'Custom Notification',
  description: (
    <div>
      <p>This supports <strong>HTML</strong> content!</p>
      <Button size="small">Action</Button>
    </div>
  ),
  icon: <SmileOutlined style={{ color: '#108ee9' }} />,
});