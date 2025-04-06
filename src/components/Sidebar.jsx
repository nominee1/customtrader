import { Layout, Menu } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import {
  PieChartOutlined,
  DesktopOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  BarChartOutlined
} from '@ant-design/icons';

const { Sider } = Layout;

function Sidebar({ collapsed }) {
  const location = useLocation();

  return (
    <Sider 
      collapsible 
      collapsed={collapsed}
      width={250}
      style={{
        background: '#fff',
        boxShadow: '2px 0 8px 0 rgba(29, 35, 41, 0.05)',
      }}
    >
      <div style={{ 
        height: 64, 
        padding: '16px', 
        textAlign: 'center',
        borderBottom: '1px solid rgba(0, 0, 0, 0.1)'
      }}>
        {collapsed ? '⚡' : 'My App'}
      </div>
      
      <Menu
        theme="light"
        mode="inline"
        selectedKeys={[location.pathname.split('/')[1] || 'dashboard']}
        items={[
          {
            key: 'dashboard',
            icon: <PieChartOutlined />,
            label: <Link to="/dashboard">Graph</Link>,
          },
          {
            key: 'reports',
            icon: <DesktopOutlined />,
            label: 'Reports',
            children: [
              {
                key: 'reports-sales',
                label: <Link to="/reports/sales">Account</Link>,
              },
              {
                key: 'reports-inventory',
                label: <Link to="/reports/inventory">Trade</Link>,
              },
            ],
          },
          {
            key: 'users',
            icon: <UserOutlined />,
            label: 'Users',
            children: [
              {
                key: 'users-list',
                label: <Link to="/users/list">All Users</Link>,
              },
              {
                key: 'users-roles',
                label: <Link to="/users/roles">Roles</Link>,
              },
            ],
          }
        ]}
      />
    </Sider>
  );
}

export default Sidebar;