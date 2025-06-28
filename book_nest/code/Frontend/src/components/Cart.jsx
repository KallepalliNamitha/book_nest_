import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Button, Card, Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import defaultBookCover from '../assets/default-book-cover.png';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const Cart = () => {
  const { cart, cartTotal, removeFromCart, updateCartItemQuantity } = useAuth();

  if (cart.length === 0) {
    return (
      <Container className="py-5 text-center">
        <h2>Your cart is empty</h2>
        <Link to="/uproducts" className="btn btn-primary mt-3">
          Continue Shopping
        </Link>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <h2 className="mb-4">Shopping Cart</h2>
      {cart.map((item) => (
        <Card key={item._id} className="mb-3">
          <Card.Body>
            <Row className="align-items-center">
              <Col md={2}>
                <img
                  src={item.itemImage ? `${API_BASE_URL}/uploads/${item.itemImage}` : defaultBookCover}
                  alt={item.title}
                  className="img-fluid rounded"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = defaultBookCover;
                  }}
                />
              </Col>
              <Col md={4}>
                <h5>{item.title}</h5>
                <p className="text-muted mb-0">by {item.author}</p>
              </Col>
              <Col md={2} className="text-center">
                <div className="d-flex align-items-center justify-content-center">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => updateCartItemQuantity(item._id, item.quantity - 1)}
                  >
                    -
                  </Button>
                  <span className="mx-2">{item.quantity}</span>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => updateCartItemQuantity(item._id, item.quantity + 1)}
                  >
                    +
                  </Button>
                </div>
              </Col>
              <Col md={2} className="text-center">
                <p className="mb-0">₹{item.price * item.quantity}</p>
              </Col>
              <Col md={2} className="text-center">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => removeFromCart(item._id)}
                >
                  Remove
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      ))}
      <div className="d-flex justify-content-between align-items-center mt-4">
        <h4>Total: ₹{cartTotal}</h4>
        <Link to="/checkout" className="btn btn-primary">
          Proceed to Checkout
        </Link>
      </div>
    </Container>
  );
};

export default Cart; 