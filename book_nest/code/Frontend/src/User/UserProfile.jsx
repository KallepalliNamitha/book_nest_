import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const API_BASE_URL = 'http://localhost:5001/api/auth';

const UserProfile = () => {
  const { user, updateUserProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: ''
    },
    preferences: {
      favoriteGenres: [],
      notificationPreferences: {
        email: true,
        phone: false
      }
    }
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        setError('');
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await axios.get(`${API_BASE_URL}/me`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.data.status === 'success') {
          const userData = response.data.data.user;
          setFormData({
            name: userData.name || '',
            email: userData.email || '',
            phone: userData.phone || '',
            address: userData.address || {
              street: '',
              city: '',
              state: '',
              pincode: ''
            },
            preferences: userData.preferences || {
              favoriteGenres: [],
              notificationPreferences: {
                email: true,
                phone: false
              }
            }
          });
        } else {
          throw new Error('Failed to fetch user data');
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setError('Failed to load user profile. Please try again.');
        // Only show toast for network errors or unexpected errors
        if (!error.message.includes('No authentication token found')) {
          toast.error('Failed to load user profile');
        }
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleNotificationChange = (type) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        notificationPreferences: {
          ...prev.preferences.notificationPreferences,
          [type]: !prev.preferences.notificationPreferences[type]
        }
      }
    }));
  };

  const handleGenreChange = (genre) => {
    setFormData(prev => {
      const genres = prev.preferences.favoriteGenres;
      const updatedGenres = genres.includes(genre)
        ? genres.filter(g => g !== genre)
        : [...genres, genre];

      return {
        ...prev,
        preferences: {
          ...prev.preferences,
          favoriteGenres: updatedGenres
        }
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.patch(`${API_BASE_URL}/updateMe`, formData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.status === 'success') {
        toast.success('Profile updated successfully');
        setIsEditing(false);
        if (updateUserProfile) {
          updateUserProfile(response.data.data.user);
        }
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.response?.data?.message || 'Failed to update profile');
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <LoadingSpinner />
      </Container>
    );
  }

  const genres = [
    'Fiction', 'Non-Fiction', 'Mystery', 'Science Fiction',
    'Fantasy', 'Romance', 'Thriller', 'Biography',
    'History', 'Science', 'Technology', 'Business'
  ];

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8}>
          <Card>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="mb-0">Profile Settings</h2>
                <Button
                  variant={isEditing ? "secondary" : "primary"}
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </Button>
              </div>

              {error && <Alert variant="danger">{error}</Alert>}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </Form.Group>

                <h4 className="mt-4 mb-3">Address</h4>
                <Form.Group className="mb-3">
                  <Form.Label>Street</Form.Label>
                  <Form.Control
                    type="text"
                    name="address.street"
                    value={formData.address.street}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>City</Form.Label>
                  <Form.Control
                    type="text"
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>State</Form.Label>
                  <Form.Control
                    type="text"
                    name="address.state"
                    value={formData.address.state}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Pincode</Form.Label>
                  <Form.Control
                    type="text"
                    name="address.pincode"
                    value={formData.address.pincode}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </Form.Group>

                <h4 className="mt-4 mb-3">Preferences</h4>
                <Form.Group className="mb-3">
                  <Form.Label>Favorite Genres</Form.Label>
                  <div className="d-flex flex-wrap gap-2">
                    {genres.map(genre => (
                      <Form.Check
                        key={genre}
                        type="checkbox"
                        id={`genre-${genre}`}
                        label={genre}
                        checked={formData.preferences.favoriteGenres.includes(genre)}
                        onChange={() => handleGenreChange(genre)}
                        disabled={!isEditing}
                      />
                    ))}
                  </div>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Notification Preferences</Form.Label>
                  <div>
                    <Form.Check
                      type="checkbox"
                      id="email-notifications"
                      label="Email Notifications"
                      checked={formData.preferences.notificationPreferences.email}
                      onChange={() => handleNotificationChange('email')}
                      disabled={!isEditing}
                    />
                    <Form.Check
                      type="checkbox"
                      id="phone-notifications"
                      label="Phone Notifications"
                      checked={formData.preferences.notificationPreferences.phone}
                      onChange={() => handleNotificationChange('phone')}
                      disabled={!isEditing}
                    />
                  </div>
                </Form.Group>

                {isEditing && (
                  <div className="d-grid gap-2">
                    <Button
                      variant="primary"
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? 'Updating...' : 'Save Changes'}
                    </Button>
                  </div>
                )}
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default UserProfile; 