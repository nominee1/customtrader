import React, { useEffect } from 'react';
import { message } from 'antd';

const Notification = ({ type, content, trigger }) => {
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (trigger) {
      messageApi.open({
        type,
        content,
      });
    }
  }, [trigger, type, content, messageApi]);

  return <>{contextHolder}</>;
};

export default Notification;