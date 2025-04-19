import React from 'react';
import { Layout, Button, Typography } from 'antd';
import { Link } from 'react-router-dom';
import '../assets/css/components/Header.css';

const { Header } = Layout;
const { Text } = Typography;

const AppHeader = () => {
  return (
    <Header className="header">
      <div className="header-container">
        <div className="logo">
          <Text className="logo-text">Mulla</Text>
        </div>
        <div className="header-buttons">
          <Link to="/login">
            <Button className="header-button" variant="outlined" >Login</Button>
          </Link>
          <Link to="/signup">
            <Button className="header-button" type="primary">Sign Up</Button>
          </Link>
        </div>
      </div>
    </Header>
  );
};

export default AppHeader;