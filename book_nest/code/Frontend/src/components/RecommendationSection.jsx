import React, { useState, useEffect } from 'react';
import { Row, Col } from 'react-bootstrap';
import axios from 'axios';
import BookCard from './BookCard';
import LoadingSpinner from './LoadingSpinner';

const RecommendationSection = ({ type, title }) => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        let endpoint;
        
        switch (type) {
          case 'personalized':
            endpoint = '/api/books/recommendations/personalized';
            break;
          case 'trending':
            endpoint = '/api/books/recommendations/trending';
            break;
          case 'genre':
            endpoint = '/api/books/recommendations/genre';
            break;
          default:
            endpoint = '/api/books/recommendations';
        }

        const response = await axios.get(`http://localhost:5001${endpoint}`);
        setBooks(response.data);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
        setError('Failed to load recommendations');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [type]);

  if (loading) {
    return (
      <div className="text-center py-4">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }

  if (!books || books.length === 0) {
    return null;
  }

  return (
    <section className="mb-5">
      <h2 className="text-center mb-4 text-3xl font-bold text-gray-800">{title}</h2>
      <Row xs={1} md={2} lg={4} className="g-4">
        {books.map((book) => (
          <Col key={book._id}>
            <BookCard book={book} />
          </Col>
        ))}
      </Row>
    </section>
  );
};

export default RecommendationSection; 