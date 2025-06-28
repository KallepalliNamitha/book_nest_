// src/components/Navbar.js

import React from 'react';
import { Navbar, Nav, Container, Badge } from 'react-bootstrap';
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from '../context/AuthContext';
import NotificationCenter from '../components/NotificationCenter';

const Unavbar = () => {
  const { user, cart, logout } = useAuth();
  const navigate = useNavigate();
  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="shadow-lg">
      <Container>
        <Navbar.Brand>
          <Link to='/uhome' className="text-white text-decoration-none font-bold text-xl hover:text-blue-300">BookStore</Link>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto d-flex align-items-center gap-3">
            <NotificationCenter />
            <Link to="/uhome" className="text-white text-decoration-none hover:text-blue-300">Home</Link>
            <Link to="/uproducts" className="text-white text-decoration-none hover:text-blue-300">Books</Link>
            <Link to="/wishlist" className="text-white text-decoration-none hover:text-blue-300">Wishlist</Link>
            <Link to="/myorders" className="text-white text-decoration-none hover:text-blue-300">My orders</Link>
            <Link to="/cart" className="text-white text-decoration-none hover:text-blue-300">
              Cart {cartItemCount > 0 && <Badge bg="light" text="dark">{cartItemCount}</Badge>}
            </Link>
            <Link to="/profile" className="text-white text-decoration-none hover:text-blue-300">Profile</Link>
            <button 
              onClick={handleLogout}
              className="text-white text-decoration-none hover:text-red-300 bg-transparent border-0"
            >
              Logout
            </button>
            <span className="text-white ms-3 bg-blue-600 px-3 py-1 rounded-full">
              {user?.name}
            </span>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Unavbar;
