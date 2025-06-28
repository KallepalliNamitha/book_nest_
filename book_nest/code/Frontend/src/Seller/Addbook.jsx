import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

function Addbook() {
  const [formData, setFormData] = useState({
    description: '',
    title: '',
    author: '',
    genre: '',
    price: '',
    itemImage: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Check authentication status
  useEffect(() => {
    if (!isAuthenticated || !user) {
      toast.error('Please log in to continue');
      navigate('/slogin');
      return;
    }

    if (user.role !== 'seller') {
      toast.error('Access denied. Seller account required.');
      navigate('/slogin');
      return;
    }

    // Verify authentication
    const token = localStorage.getItem('token');
    axios.get(`${API_BASE_URL}/api/auth/verify`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    .catch(error => {
      console.error('Auth verification failed:', error);
      toast.error('Authentication failed. Please log in again.');
      navigate('/slogin');
    });
  }, [isAuthenticated, user, navigate]);

  const handleChange = (e) => {
    if (e.target.name === 'itemImage') {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          toast.error('File size should be less than 5MB');
          e.target.value = '';
          return;
        }
        if (!file.type.startsWith('image/')) {
          toast.error('Please upload an image file');
          e.target.value = '';
          return;
        }
        setFormData({ ...formData, [e.target.name]: file });
        // Create image preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
      }
    } else {
      const { name, value } = e.target;
      setFormData({ ...formData, [name]: value });
    }
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast.error('Please enter a book title');
      return false;
    }
    if (!formData.author.trim()) {
      toast.error('Please enter an author name');
      return false;
    }
    if (!formData.genre) {
      toast.error('Please select a genre');
      return false;
    }
    if (!formData.description.trim()) {
      toast.error('Please enter a description');
      return false;
    }
    if (!formData.price || formData.price <= 0) {
      toast.error('Please enter a valid price');
      return false;
    }
    if (!formData.itemImage) {
      toast.error('Please upload a book cover image');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading('Adding book...');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title.trim());
      formDataToSend.append('author', formData.author.trim());
      formDataToSend.append('genre', formData.genre);
      formDataToSend.append('description', formData.description.trim());
      formDataToSend.append('price', formData.price);
      formDataToSend.append('itemImage', formData.itemImage);

      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/api/books`, formDataToSend, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.status === 'success') {
        toast.success('Book added successfully');
        navigate('/myproducts');
      } else {
        throw new Error(response.data.message || 'Failed to add book');
      }
    } catch (error) {
      console.error('Error adding book:', error);
      const errorMessage = error.response?.data?.message || 
                         error.message || 
                         'Failed to add book. Please try again.';
      toast.error(errorMessage);
    } finally {
      toast.dismiss(loadingToast);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-3xl font-semibold mb-8 text-center text-gray-900">Add New Book</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Book Title
              </label>
              <input
                type="text"
                name="title"
                placeholder="Enter book title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Author
              </label>
              <input
                type="text"
                name="author"
                placeholder="Enter author name"
                value={formData.author}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Genre
              </label>
              <select
                name="genre"
                value={formData.genre}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select a genre</option>
                <option value="Fiction">Fiction</option>
                <option value="Non-Fiction">Non-Fiction</option>
                <option value="Mystery">Mystery</option>
                <option value="Science Fiction">Science Fiction</option>
                <option value="Fantasy">Fantasy</option>
                <option value="Romance">Romance</option>
                <option value="Thriller">Thriller</option>
                <option value="Horror">Horror</option>
                <option value="Biography">Biography</option>
                <option value="History">History</option>
                <option value="Science">Science</option>
                <option value="Technology">Technology</option>
                <option value="Self-Help">Self-Help</option>
                <option value="Children">Children</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price (₹)
              </label>
              <input
                type="number"
                name="price"
                placeholder="Enter price"
                value={formData.price}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              placeholder="Enter book description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Book Cover Image
            </label>
            <input
              type="file"
              name="itemImage"
              accept="image/*"
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            {imagePreview && (
              <div className="mt-2">
                <img
                  src={imagePreview}
                  alt="Book cover preview"
                  className="max-w-xs rounded-md shadow-sm"
                />
              </div>
            )}
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-8 py-3 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors
                ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? 'Adding Book...' : 'Add Book'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Addbook;

