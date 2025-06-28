import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaTrash } from "react-icons/fa";
import { toast } from 'react-hot-toast';

function Myproducts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBooks = async () => {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) {
        setError('User not found');
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`http://localhost:5001/api/books/seller/${user.id}`);
        console.log('Response data:', response.data);
        setItems(response.data.data || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching books:', error);
        setError('Failed to fetch books');
        setLoading(false);
        toast.error('Failed to fetch books');
      }
    };

    fetchBooks();
  }, []);

  const deleteItem = async (id) => {
    try {
      await axios.delete(`http://localhost:5001/api/books/${id}`);
      setItems(items.filter(item => item._id !== id));
      toast.success('Book deleted successfully');
    } catch (error) {
      console.error('Error deleting book:', error);
      toast.error('Failed to delete book');
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-600">Loading...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>;
  }

  if (items.length === 0) {
    return <div className="text-center py-8 text-gray-600">No books found. Start by adding some books!</div>;
  }

  const getImageUrl = (itemImage) => {
    if (!itemImage) return '/placeholder-book.jpg';
    if (itemImage.startsWith('http')) return itemImage;
    return `http://localhost:5001/uploads/${itemImage}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold mb-8 text-center text-gray-800">My Books</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((item) => (
            <div key={item._id} className="bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="relative">
                <button 
                  onClick={() => deleteItem(item._id)}
                  className="absolute top-3 right-3 p-2 bg-white rounded-full text-red-500 hover:text-red-700 transition-colors shadow-md hover:shadow-lg"
                  title="Delete book"
                >
                  <FaTrash />
                </button>
                <div className="aspect-w-3 aspect-h-4">
                  <img
                    src={getImageUrl(item.itemImage)}
                    alt={item.title}
                    className="w-full h-64 object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/placeholder-book.jpg';
                    }}
                  />
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <h3 className="text-2xl font-semibold text-gray-800 mb-2">{item.title}</h3>
                <div className="space-y-3">
                  <div className="flex items-center text-gray-700">
                    <span className="font-medium text-gray-600 w-20">Author:</span>
                    <span className="text-gray-800">{item.author}</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <span className="font-medium text-gray-600 w-20">Genre:</span>
                    <span className="text-gray-800">{item.genre}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium text-gray-600 w-20">Price:</span>
                    <span className="text-xl font-bold text-blue-600">₹{item.price}</span>
                  </div>
                  <div className="pt-2">
                    <p className="text-sm text-gray-600 line-clamp-3">
                      <span className="font-medium">Description: </span>
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Myproducts;
