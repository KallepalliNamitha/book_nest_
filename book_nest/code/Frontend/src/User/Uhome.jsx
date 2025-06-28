import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, InputGroup } from 'react-bootstrap';
import { FaSearch } from 'react-icons/fa';
import BookCard from '../components/BookCard';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const Uhome = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/api/books`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.data.status === 'success') {
          setItems(response.data.data.books || []);
          setError(null);
        } else {
          throw new Error('Failed to fetch books');
        }
      } catch (error) {
        console.error('Error fetching books:', error);
        setError('Failed to fetch books. Please try again later.');
        toast.error(error.response?.data?.message || 'Failed to fetch books');
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  // Get unique genres from books
  const genres = ['All', ...new Set(items.map(item => item.genre).filter(Boolean))];

  // Filter books based on search query and genre
  const filteredItems = items.filter((item) => {
    const matchesSearch = !searchQuery || 
                         item.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         item.author?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = selectedGenre === 'All' || item.genre === selectedGenre;
    return matchesSearch && matchesGenre;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Container className="py-5 text-center">
          <LoadingSpinner />
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Container className="py-5">
        {/* Hero Section */}
        <div className="text-center mb-5 p-5 bg-primary text-white rounded-lg shadow">
          <h1 className="display-4 mb-3">Welcome to BookStore{user ? `, ${user.name}` : ''}</h1>
          <p className="lead">Discover your next favorite book from our vast collection</p>
        </div>

        {error && (
          <div className="alert alert-danger mb-4" role="alert">
            {error}
          </div>
        )}

        {/* Search and Filter Section */}
        <div className="mb-5">
          <Row className="g-3">
            <Col md={8}>
              <InputGroup>
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search by title or author..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={4}>
              <Form.Select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
              >
                {genres.map(genre => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </Form.Select>
            </Col>
          </Row>
        </div>

        {/* Books Grid */}
        <Row xs={1} md={2} lg={3} xl={4} className="g-4">
          {filteredItems.map((item) => (
            <Col key={item._id}>
              <BookCard book={item} />
            </Col>
          ))}
        </Row>

        {filteredItems.length === 0 && !error && (
          <div className="text-center mt-5">
            <h3>No books found matching your criteria</h3>
            <p className="text-muted">Try adjusting your filters or search terms</p>
          </div>
        )}
      </Container>
    </div>
  );
};

export default Uhome;