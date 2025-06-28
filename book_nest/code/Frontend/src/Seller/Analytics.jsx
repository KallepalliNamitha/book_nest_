import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import Snavbar from './Snavbar';
import AnalyticsChart from '../components/AnalyticsChart';
import toast from 'react-hot-toast';

const Analytics = () => {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState(30);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    sales: null,
    inventory: null,
    reviews: null
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const headers = {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        };

        const [salesRes, inventoryRes, reviewsRes] = await Promise.all([
          fetch(`http://localhost:5001/api/analytics/sales/${user._id}?timeRange=${timeRange}`, { headers }),
          fetch(`http://localhost:5001/api/analytics/inventory/${user._id}`, { headers }),
          fetch(`http://localhost:5001/api/analytics/reviews/${user._id}?timeRange=${timeRange}`, { headers })
        ]);

        const [sales, inventory, reviews] = await Promise.all([
          salesRes.json(),
          inventoryRes.json(),
          reviewsRes.json()
        ]);

        setAnalytics({ sales, inventory, reviews });
      } catch (error) {
        console.error('Error fetching analytics:', error);
        toast.error('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchAnalytics();
    }
  }, [user, timeRange]);

  const prepareSalesData = () => {
    if (!analytics.sales) return null;

    const dates = Object.keys(analytics.sales.salesByDay).sort();
    return {
      labels: dates,
      datasets: [{
        label: 'Daily Sales',
        data: dates.map(date => analytics.sales.salesByDay[date]),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }]
    };
  };

  const prepareInventoryData = () => {
    if (!analytics.inventory) return null;

    const genres = Object.keys(analytics.inventory.booksByGenre);
    return {
      labels: genres,
      datasets: [{
        label: 'Books by Genre',
        data: genres.map(genre => analytics.inventory.booksByGenre[genre].count),
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(153, 102, 255, 0.5)'
        ]
      }]
    };
  };

  const prepareReviewData = () => {
    if (!analytics.reviews) return null;

    return {
      labels: ['1★', '2★', '3★', '4★', '5★'],
      datasets: [{
        label: 'Rating Distribution',
        data: Object.values(analytics.reviews.ratingDistribution),
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(255, 159, 64, 0.5)',
          'rgba(255, 205, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(54, 162, 235, 0.5)'
        ]
      }]
    };
  };

  if (loading) {
    return (
      <div>
        <Snavbar />
        <Container className="py-4">
          <div className="text-center">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading analytics...</span>
            </Spinner>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div>
      <Snavbar />
      <Container className="py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Analytics Dashboard</h2>
          <Form.Select
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value))}
            style={{ width: 'auto' }}
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </Form.Select>
        </div>

        {/* Sales Overview */}
        <Row className="mb-4">
          <Col md={3}>
            <Card className="h-100">
              <Card.Body>
                <Card.Title>Total Sales</Card.Title>
                <h3>${analytics.sales?.totalRevenue.toFixed(2)}</h3>
                <p className="text-muted mb-0">{analytics.sales?.totalSales} items sold</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="h-100">
              <Card.Body>
                <Card.Title>Average Order Value</Card.Title>
                <h3>${analytics.sales?.averageOrderValue.toFixed(2)}</h3>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="h-100">
              <Card.Body>
                <Card.Title>Total Books</Card.Title>
                <h3>{analytics.inventory?.totalBooks}</h3>
                <p className="text-muted mb-0">
                  {analytics.inventory?.outOfStock.length} out of stock
                </p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="h-100">
              <Card.Body>
                <Card.Title>Average Rating</Card.Title>
                <h3>{analytics.reviews?.averageRating.toFixed(1)} ★</h3>
                <p className="text-muted mb-0">
                  {analytics.reviews?.totalReviews} reviews
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Charts */}
        <Row className="mb-4">
          <Col md={8}>
            <Card>
              <Card.Body>
                <Card.Title>Sales Trend</Card.Title>
                <AnalyticsChart
                  type="line"
                  data={prepareSalesData()}
                  options={{
                    scales: {
                      y: {
                        beginAtZero: true
                      }
                    }
                  }}
                />
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card>
              <Card.Body>
                <Card.Title>Books by Genre</Card.Title>
                <AnalyticsChart
                  type="pie"
                  data={prepareInventoryData()}
                />
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="mb-4">
          <Col md={6}>
            <Card>
              <Card.Body>
                <Card.Title>Rating Distribution</Card.Title>
                <AnalyticsChart
                  type="bar"
                  data={prepareReviewData()}
                  options={{
                    scales: {
                      y: {
                        beginAtZero: true
                      }
                    }
                  }}
                />
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card>
              <Card.Body>
                <Card.Title>Low Stock Alert</Card.Title>
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Book</th>
                        <th>Quantity</th>
                        <th>Last Restocked</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.inventory?.lowStock.map(book => (
                        <tr key={book.id}>
                          <td>{book.title}</td>
                          <td>{book.quantity}</td>
                          <td>{new Date(book.lastRestocked).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Recent Reviews */}
        <Card>
          <Card.Body>
            <Card.Title>Recent Reviews</Card.Title>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Book</th>
                    <th>User</th>
                    <th>Rating</th>
                    <th>Comment</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.reviews?.recentReviews.map(review => (
                    <tr key={review.id}>
                      <td>{review.bookTitle}</td>
                      <td>{review.userName}</td>
                      <td>{review.rating} ★</td>
                      <td>{review.comment.substring(0, 100)}...</td>
                      <td>{new Date(review.date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
};

export default Analytics; 