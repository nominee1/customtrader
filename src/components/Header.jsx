import { Layout, Button, Typography, Drawer } from 'antd';
import { Link } from 'react-router-dom';

import '../assets/css/components/Header.css';
import logo from'../assets/images/logo.png';

const { Header } = Layout
const AppHeader = () => {


  return (
    <Header className="header">
      <div className="header-container">
        <div className="logo">
          <img 
            src={logo}
            className="logo-img"
            alt="Logo"
          />
        </div>
        <div className="header-buttons">
            <Link to="/login">
              <Button className="header-button" variant="outlined">
                Login
              </Button>
            </Link>
            <Link to="/signup">
              <Button className="header-button" type="primary">
                Sign Up
              </Button>
            </Link>
          </div>

      </div>
    </Header>
  );
};

export default AppHeader;