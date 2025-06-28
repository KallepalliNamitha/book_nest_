import React, { useState } from 'react';
import { Form, Button, Card, Row, Col } from 'react-bootstrap';
import { FaStar } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const ReviewForm = ({ bookId, onReviewSubmitted }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    rating: 0,
    title: '',
    review: ''
  });
  const [hoveredRating, setHoveredRating] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please log in to submit a review');
      return;
    }

    if (formData.rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('http://localhost:5001/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          bookId,
          ...formData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit review');
      }

      toast.success('Review submitted successfully');
      setFormData({ rating: 0, title: '', review: '' });
      onReviewSubmitted();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRatingClick = (rating) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Card className="mb-4">
      <Card.Body>
        <h4 className="mb-3">Write a Review</h4>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Rating</Form.Label>
            <div className="d-flex align-items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <FaStar
                  key={star}
                  size={24}
                  style={{ cursor: 'pointer' }}
                  color={star <= (hoveredRating || formData.rating) ? '#ffc107' : '#e4e5e9'}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => handleRatingClick(star)}
                />
              ))}
              <span className="ms-2 text-muted">
                {formData.rating > 0 ? `${formData.rating} stars` : 'Select rating'}
              </span>
            </div>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Title</Form.Label>
            <Form.Control
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Summarize your review"
              required
              maxLength={100}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Review</Form.Label>
            <Form.Control
              as="textarea"
              name="review"
              value={formData.review}
              onChange={handleInputChange}
              placeholder="Share your thoughts about the book..."
              required
              rows={4}
              maxLength={1000}
            />
            <Form.Text className="text-muted">
              {formData.review.length}/1000 characters
            </Form.Text>
          </Form.Group>

          <div className="d-grid">
            <Button
              type="submit"
              variant="primary"
              disabled={loading || !user}
            >
              {loading ? 'Submitting...' : 'Submit Review'}
            </Button>
          </div>

          {!user && (
            <p className="text-center text-muted mt-2">
              Please log in to submit a review
            </p>
          )}
        </Form>
      </Card.Body>
    </Card>
  );
};

export default ReviewForm; 