import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Row, Col, Pagination } from 'react-bootstrap';
import BookCard from '../components/BookCard';
import AdvancedSearch from '../components/AdvancedSearch';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

function Products() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    searchTerm: '',
    genre: '',
    priceRange: { min: '', max: '' },
    rating: 0,
    availability: 'all',
    sortBy: 'relevance'
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    limit: 12
  });

  useEffect(() => {
    fetchBooks();
  }, [filters, pagination.currentPage]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const params = {
        searchTerm: filters.searchTerm,
        genre: filters.genre,
        minPrice: filters.priceRange.min,
        maxPrice: filters.priceRange.max,
        availability: filters.availability,
        sortBy: filters.sortBy,
        page: pagination.currentPage,
        limit: pagination.limit
      };

      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/books`, {
        params,
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.status === 'success') {
        setItems(response.data.data.books || []);
        setPagination(prev => ({
          ...prev,
          totalPages: Math.ceil((response.data.results || 0) / pagination.limit)
        }));
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

  const handleSearch = (newFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, currentPage: 1 })); // Reset to first page on new search
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  // Get unique genres for filter dropdown
  const genres = [...new Set(items.map(item => item.genre).filter(Boolean))];

  // Render pagination controls
  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null;

    let items = [];
    for (let number = 1; number <= pagination.totalPages; number++) {
      items.push(
        <Pagination.Item
          key={number}
          active={number === pagination.currentPage}
          onClick={() => handlePageChange(number)}
        >
          {number}
        </Pagination.Item>
      );
    }

    return (
      <div className="d-flex justify-content-center mt-4">
        <Pagination>
          <Pagination.First
            onClick={() => handlePageChange(1)}
            disabled={pagination.currentPage === 1}
          />
          <Pagination.Prev
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
          />
          {items}
          <Pagination.Next
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages}
          />
          <Pagination.Last
            onClick={() => handlePageChange(pagination.totalPages)}
            disabled={pagination.currentPage === pagination.totalPages}
          />
        </Pagination>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Container className="py-5">
        <h2 className="text-center mb-4">Available Books</h2>
        
        <AdvancedSearch
          onSearch={handleSearch}
          genres={genres}
          initialFilters={filters}
        />

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-5">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            <Row xs={1} md={2} lg={4} className="g-4">
              {items.map((item) => (
                <Col key={item._id}>
                  <BookCard book={item} />
                </Col>
              ))}
            </Row>

            {items.length === 0 && !error && (
              <div className="text-center mt-5">
                <h3>No books found matching your criteria</h3>
                <p className="text-muted">Try adjusting your filters or search terms</p>
              </div>
            )}

            {renderPagination()}
          </>
        )}
      </Container>
    </div>
  );
}

export default Products;

