import React from 'react';
import { Container, Navbar, Nav } from 'react-bootstrap';
import { Link } from "react-router-dom";

const MainNavbar = () => {
  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
      <Container>
        <Navbar.Brand as={Link} to="/" className="text-xl font-bold">BookStore</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <div className="flex items-center gap-4">
              {/* User Section */}
              <div className="dropdown">
                <Nav.Link as={Link} to="/login" className="text-white hover:text-blue-300">User</Nav.Link>
              </div>

              {/* Seller Section */}
              <div className="dropdown">
                <Nav.Link as={Link} to="/slogin" className="text-white hover:text-green-300">Seller</Nav.Link>
              </div>

              {/* Admin Section */}
              <div className="dropdown">
                <Nav.Link as={Link} to="/alogin" className="text-white hover:text-purple-300">Admin</Nav.Link>
              </div>
            </div>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default MainNavbar; 