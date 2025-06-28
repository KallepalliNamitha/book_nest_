import React from 'react';
import { Card, Row, Col, Button } from 'react-bootstrap';
import { FaStar, FaThumbsUp } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const ReviewList = ({ reviews, onLikeReview }) => {
  const { user } = useAuth();

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleLike = async (reviewId) => {
    if (!user) {
      toast.error('Please log in to like reviews');
      return;
    }
    onLikeReview(reviewId);
  };

  const renderRatingStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <FaStar
        key={index}
        size={16}
        color={index < rating ? '#ffc107' : '#e4e5e9'}
        className="me-1"
      />
    ));
  };

  if (!reviews || reviews.length === 0) {
    return (
      <Card className="mb-4">
        <Card.Body className="text-center">
          <p className="mb-0">No reviews yet. Be the first to review this book!</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <div>
      {reviews.map((review) => (
        <Card key={review._id} className="mb-3">
          <Card.Body>
            <Row>
              <Col>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h5 className="mb-1">{review.title}</h5>
                    <div className="mb-2">
                      {renderRatingStars(review.rating)}
                    </div>
                  </div>
                  <div className="text-muted small">
                    {formatDate(review.createdAt)}
                  </div>
                </div>
                <p className="mb-3">{review.review}</p>
                <div className="d-flex align-items-center">
                  <Button
                    variant="link"
                    className="p-0 text-muted text-decoration-none"
                    onClick={() => handleLike(review._id)}
                    disabled={!user}
                  >
                    <FaThumbsUp
                      className={`me-1 ${review.likes.includes(user?._id) ? 'text-primary' : ''}`}
                    />
                    {review.likes.length > 0 && (
                      <span className="me-2">{review.likes.length}</span>
                    )}
                    Helpful
                  </Button>
                  {review.verified && (
                    <span className="ms-3 badge bg-success">Verified Purchase</span>
                  )}
                </div>
                <div className="mt-2 text-muted small">
                  By {review.userId.name}
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      ))}
    </div>
  );
};

export default ReviewList; 