// src/components/Navbar.js

import React from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { Link } from "react-router-dom"
import NotificationCenter from '../components/NotificationCenter';

const Snavbar = () => {
  const get = localStorage.getItem('user')
  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="shadow-lg">
      <Container>
        <Navbar.Brand>
          <Link to='/shome' className="text-white text-decoration-none font-bold text-xl hover:text-blue-300">
            BookStore (Seller)
          </Link>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto d-flex align-items-center gap-3">
            <Link to="/shome" className="text-white text-decoration-none hover:text-blue-300">Home</Link>
            <Link to="/myproducts" className="text-white text-decoration-none hover:text-blue-300">My Products</Link>
            <Link to="/addbook" className="text-white text-decoration-none hover:text-blue-300">Add Books</Link>
            <Link to="/orders" className="text-white text-decoration-none hover:text-blue-300">Orders</Link>
            <Link to="/" className="text-white text-decoration-none hover:text-red-300">Logout</Link>
            <NotificationCenter />
            <span className="text-white ms-3 bg-blue-600 px-3 py-1 rounded-full">
              {JSON.parse(get).name}
            </span>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Snavbar;
