import React, { useState, useEffect } from 'react';
import { Card, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FaStar, FaHeart, FaRegHeart } from 'react-icons/fa';
import defaultBookCover from '../assets/default-book-cover.png';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const BookCard = ({ book }) => {
  const { user, isAuthenticated, addToCart } = useAuth();
  const [isInWishlist, setIsInWishlist] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      checkWishlistStatus();
    }
  }, [book._id, isAuthenticated, user]);

  const checkWishlistStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/wishlist/${user.id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const wishlistItems = response.data;
      setIsInWishlist(wishlistItems.some(item => item.itemId === book._id));
    } catch (error) {
      console.error('Error checking wishlist status:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast.error('Please login to add to cart');
      navigate('/login');
      return;
    }
    addToCart(book);
    toast.success('Added to cart');
  };

  const handleWishlist = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add to wishlist');
      navigate('/login');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (isInWishlist) {
        await axios.post(
          `${API_BASE_URL}/api/wishlist/remove`,
          { itemId: book._id },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        setIsInWishlist(false);
        toast.success('Removed from wishlist');
      } else {
        const wishlistItem = {
          itemId: book._id,
          userId: user.id,
          userName: user.name,
          itemImage: book.itemImage,
          title: book.title,
          author: book.author,
          genre: book.genre,
          price: book.price
        };
        await axios.post(
          `${API_BASE_URL}/api/wishlist/add`,
          wishlistItem,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        setIsInWishlist(true);
        toast.success('Added to wishlist');
      }
    } catch (error) {
      console.error('Error updating wishlist:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      } else {
        toast.error(error.response?.data?.message || 'Failed to update wishlist');
      }
    }
  };

  // Construct the image URL with error handling
  const imageUrl = book.itemImage 
    ? `${API_BASE_URL}/uploads/${book.itemImage}`
    : defaultBookCover;

  return (
    <Card className="h-100 shadow-sm">
      <Link to={`/uitem/${book._id}`} className="text-decoration-none">
        <Card.Img 
          variant="top" 
          src={imageUrl}
          alt={book.title}
          style={{ height: '200px', objectFit: 'cover' }}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = defaultBookCover;
          }}
        />
      </Link>
      <Card.Body className="d-flex flex-column">
        <Card.Title className="text-center mb-2">{book.title}</Card.Title>
        <Card.Text className="text-muted mb-1">By {book.author}</Card.Text>
        <Card.Text className="text-muted mb-2">{book.genre}</Card.Text>
        <Card.Text className="text-primary mb-3">₹{book.price}</Card.Text>
        
        <div className="d-flex align-items-center mb-2">
          <div className="me-2">
            {[...Array(5)].map((_, index) => (
              <FaStar
                key={index}
                size={14}
                color={index < Math.round(book.averageRating || 0) ? '#ffc107' : '#e4e5e9'}
                className="me-1"
              />
            ))}
          </div>
          <span className="text-muted small">
            ({book.totalReviews || 0})
          </span>
        </div>

        <div className="mt-auto d-flex gap-2">
          <Button 
            variant="outline-primary" 
            className="flex-grow-1"
            onClick={handleAddToCart}
          >
            Add to Cart
          </Button>
          <Button 
            variant={isInWishlist ? "danger" : "outline-secondary"}
            onClick={handleWishlist}
          >
            {isInWishlist ? <FaHeart /> : <FaRegHeart />}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default BookCard; 