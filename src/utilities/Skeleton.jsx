import { Skeleton } from 'antd';

function ContentLoader() {
  return (
    <>
      <Skeleton active paragraph={{ rows: 4 }} />
      <Skeleton.Button active shape="round" block />
    </>
  );
}