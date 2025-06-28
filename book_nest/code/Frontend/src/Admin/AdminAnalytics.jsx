import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Spinner } from 'react-bootstrap';
import Anavbar from './Anavbar';
import AnalyticsChart from '../components/AnalyticsChart';
import toast from 'react-hot-toast';

const AdminAnalytics = () => {
  const [timeRange, setTimeRange] = useState(30);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `http://localhost:5001/api/analytics/users?timeRange=${timeRange}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch analytics');
        }

        const data = await response.json();
        setAnalytics(data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
        toast.error('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeRange]);

  const prepareUserTrendData = () => {
    if (!analytics) return null;

    return {
      labels: ['Total Users', 'New Users', 'Active Users'],
      datasets: [{
        label: 'User Statistics',
        data: [
          analytics.totalUsers,
          analytics.newUsers,
          analytics.activeUsers
        ],
        backgroundColor: [
          'rgba(54, 162, 235, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(255, 206, 86, 0.5)'
        ]
      }]
    };
  };

  const prepareGenreData = () => {
    if (!analytics) return null;

    const genres = Object.keys(analytics.usersByGenre);
    return {
      labels: genres,
      datasets: [{
        label: 'Users by Preferred Genre',
        data: genres.map(genre => analytics.usersByGenre[genre]),
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }]
    };
  };

  if (loading) {
    return (
      <div>
        <Anavbar />
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
      <Anavbar />
      <Container className="py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Admin Analytics Dashboard</h2>
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

        {/* User Statistics */}
        <Row className="mb-4">
          <Col md={4}>
            <Card className="h-100">
              <Card.Body>
                <Card.Title>Total Users</Card.Title>
                <h3>{analytics?.totalUsers}</h3>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="h-100">
              <Card.Body>
                <Card.Title>New Users</Card.Title>
                <h3>{analytics?.newUsers}</h3>
                <p className="text-muted mb-0">in the last {timeRange} days</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="h-100">
              <Card.Body>
                <Card.Title>Active Users</Card.Title>
                <h3>{analytics?.activeUsers}</h3>
                <p className="text-muted mb-0">in the last {timeRange} days</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Charts */}
        <Row className="mb-4">
          <Col md={6}>
            <Card>
              <Card.Body>
                <Card.Title>User Statistics</Card.Title>
                <AnalyticsChart
                  type="bar"
                  data={prepareUserTrendData()}
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
                <Card.Title>Users by Preferred Genre</Card.Title>
                <AnalyticsChart
                  type="pie"
                  data={prepareGenreData()}
                />
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Top Reviewers */}
        <Card>
          <Card.Body>
            <Card.Title>Top Reviewers</Card.Title>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Reviews</th>
                    <th>Average Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics?.topReviewers.map(reviewer => (
                    <tr key={reviewer.userId}>
                      <td>{reviewer.name}</td>
                      <td>{reviewer.reviewCount}</td>
                      <td>{reviewer.averageRating.toFixed(1)} ★</td>
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

export default AdminAnalytics; 