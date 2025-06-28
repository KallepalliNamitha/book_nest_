import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Container, Form, Button, Card, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const Checkout = () => {
  const { cart, cartTotal, user, clearCart } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    flatno: '',
    city: '',
    pincode: '',
    state: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Create orders for each item in the cart
      const orderPromises = cart.map(async (item) => {
        const orderData = {
          ...formData,
          userId: user.id,
          userName: user.name,
          sellerId: item.userId,
          seller: item.userName,
          totalamount: item.price * item.quantity,
          description: item.description,
          booktitle: item.title,
          bookauthor: item.author,
          bookgenre: item.genre,
          itemImage: item.itemImage,
          quantity: item.quantity
        };

        await axios.post('http://localhost:5001/orders/create', orderData);
      });

      await Promise.all(orderPromises);
      
      // Clear the cart after successful order
      clearCart();
      
      toast.success('Order placed successfully!');
      navigate('/myorders');
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order. Please try again.');
    }
  };

  if (cart.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8}>
          <Card>
            <Card.Header>
              <h2 className="mb-0">Checkout</h2>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Flat/House No.</Form.Label>
                  <Form.Control
                    type="text"
                    name="flatno"
                    value={formData.flatno}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>City</Form.Label>
                  <Form.Control
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Pincode</Form.Label>
                  <Form.Control
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>State</Form.Label>
                  <Form.Control
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <div className="d-flex justify-content-between align-items-center">
                  <h4>Total: ₹{cartTotal}</h4>
                  <Button type="submit" variant="primary">
                    Place Order
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Checkout; 