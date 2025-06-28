// Wishlist.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchWishlist();
  }, [isAuthenticated, user]);

  const fetchWishlist = async () => {
    try {
      if (user) {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `${API_BASE_URL}/api/wishlist/${user.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        setWishlist(response.data);
      }
    } catch (error) {
      console.error('Error fetching wishlist items:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      } else {
        toast.error('Failed to load wishlist items');
      }
    }
  };

  const removeFromWishlist = async (itemId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/api/wishlist/remove`,
        { itemId },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      toast.success('Item removed from wishlist');
      fetchWishlist(); // Refresh the wishlist
    } catch (error) {
      console.error('Error removing item from wishlist:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      } else {
        toast.error('Failed to remove item from wishlist');
      }
    }
  };

  if (!isAuthenticated) {
    return null; // Component will redirect in useEffect
  }

  if (wishlist.length === 0) {
    return (
      <div className="container mx-auto p-8 text-center">
        <h2 className="text-3xl font-semibold mb-4">Your Wishlist is Empty</h2>
        <Link to="/uproducts" className="btn btn-primary">
          Browse Books
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <h2 className="text-3xl font-semibold mb-4 text-center">My Wishlist</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {wishlist.map((item) => (
          <div key={item._id} className="bg-white p-4 rounded shadow">
            <img
              src={`${API_BASE_URL}/uploads/${item.itemImage}`}
              alt={item.title}
              className="w-full h-64 object-cover rounded-t-lg mb-4"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/placeholder-book.jpg';
              }}
            />
            <div>
              <h3 className="text-xl font-bold mb-2">{item.title}</h3>
              <p className="text-gray-700 mb-2">Author: {item.author}</p>
              <p className="text-gray-700 mb-2">Genre: {item.genre}</p>
              <p className="text-blue-500 font-bold mb-4">₹{item.price}</p>

              <div className="flex gap-2">
                <Button
                  variant="danger"
                  onClick={() => removeFromWishlist(item.itemId)}
                  className="flex-1"
                >
                  Remove
                </Button>
                <Link 
                  to={`/uitem/${item.itemId}`} 
                  className="btn btn-primary flex-1 text-center"
                >
                  View Details
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Wishlist;
