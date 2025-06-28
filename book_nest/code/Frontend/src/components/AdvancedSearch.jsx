import React, { useState, useEffect } from 'react';
import { Form, Button, Collapse, Row, Col, InputGroup, Badge } from 'react-bootstrap';
import { FaFilter, FaSort, FaTimes } from 'react-icons/fa';

const AdvancedSearch = ({ 
  onSearch, 
  genres, 
  initialFilters = {},
  sortOptions = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'priceAsc', label: 'Price: Low to High' },
    { value: 'priceDesc', label: 'Price: High to Low' },
    { value: 'newest', label: 'Newest Arrivals' },
    { value: 'bestSelling', label: 'Best Selling' }
  ]
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState({
    searchTerm: '',
    genre: '',
    priceRange: { min: '', max: '' },
    rating: 0,
    availability: 'all',
    sortBy: 'relevance',
    ...initialFilters
  });
  const [activeFilters, setActiveFilters] = useState([]);

  useEffect(() => {
    // Update active filters list
    const newActiveFilters = [];
    if (filters.searchTerm) newActiveFilters.push({ key: 'searchTerm', label: `Search: ${filters.searchTerm}` });
    if (filters.genre) newActiveFilters.push({ key: 'genre', label: `Genre: ${filters.genre}` });
    if (filters.priceRange.min) newActiveFilters.push({ key: 'minPrice', label: `Min Price: ₹${filters.priceRange.min}` });
    if (filters.priceRange.max) newActiveFilters.push({ key: 'maxPrice', label: `Max Price: ₹${filters.priceRange.max}` });
    if (filters.rating > 0) newActiveFilters.push({ key: 'rating', label: `Rating: ${filters.rating}★+` });
    if (filters.availability !== 'all') newActiveFilters.push({ key: 'availability', label: `Availability: ${filters.availability}` });
    if (filters.sortBy !== 'relevance') {
      const sortOption = sortOptions.find(opt => opt.value === filters.sortBy);
      newActiveFilters.push({ key: 'sortBy', label: `Sort: ${sortOption?.label}` });
    }
    setActiveFilters(newActiveFilters);
  }, [filters, sortOptions]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFilters(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSearch = (e) => {
    e?.preventDefault();
    onSearch(filters);
  };

  const clearFilter = (filterKey) => {
    if (filterKey.includes('.')) {
      const [parent, child] = filterKey.split('.');
      setFilters(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: ''
        }
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        [filterKey]: filterKey === 'rating' ? 0 : filterKey === 'availability' ? 'all' : ''
      }));
    }
  };

  const clearAllFilters = () => {
    setFilters({
      searchTerm: '',
      genre: '',
      priceRange: { min: '', max: '' },
      rating: 0,
      availability: 'all',
      sortBy: 'relevance'
    });
  };

  return (
    <div className="mb-4">
      <Form onSubmit={handleSearch}>
        <Row className="g-3">
          <Col md={6}>
            <InputGroup>
              <Form.Control
                placeholder="Search by title, author, ISBN..."
                name="searchTerm"
                value={filters.searchTerm}
                onChange={handleInputChange}
              />
              <Button variant="primary" type="submit">
                Search
              </Button>
            </InputGroup>
          </Col>
          <Col md={3}>
            <Form.Select
              name="sortBy"
              value={filters.sortBy}
              onChange={handleInputChange}
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Form.Select>
          </Col>
          <Col md={3}>
            <Button
              variant="outline-secondary"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-100"
            >
              <FaFilter className="me-2" />
              Advanced Filters
            </Button>
          </Col>
        </Row>

        <Collapse in={showAdvanced}>
          <div className="mt-3">
            <Row className="g-3">
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Genre</Form.Label>
                  <Form.Select
                    name="genre"
                    value={filters.genre}
                    onChange={handleInputChange}
                  >
                    <option value="">All Genres</option>
                    {genres.map(genre => (
                      <option key={genre} value={genre}>{genre}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Price Range</Form.Label>
                  <InputGroup>
                    <Form.Control
                      placeholder="Min"
                      type="number"
                      name="priceRange.min"
                      value={filters.priceRange.min}
                      onChange={handleInputChange}
                    />
                    <InputGroup.Text>to</InputGroup.Text>
                    <Form.Control
                      placeholder="Max"
                      type="number"
                      name="priceRange.max"
                      value={filters.priceRange.max}
                      onChange={handleInputChange}
                    />
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Availability</Form.Label>
                  <Form.Select
                    name="availability"
                    value={filters.availability}
                    onChange={handleInputChange}
                  >
                    <option value="all">All</option>
                    <option value="inStock">In Stock</option>
                    <option value="outOfStock">Out of Stock</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </div>
        </Collapse>
      </Form>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="mt-3">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            {activeFilters.map(filter => (
              <Badge
                key={filter.key}
                bg="secondary"
                className="d-flex align-items-center gap-2 py-2 px-3"
                style={{ cursor: 'pointer' }}
                onClick={() => clearFilter(filter.key)}
              >
                {filter.label}
                <FaTimes size={12} />
              </Badge>
            ))}
            <Button
              variant="link"
              className="text-danger text-decoration-none p-0 ms-2"
              onClick={clearAllFilters}
            >
              Clear All
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch; 