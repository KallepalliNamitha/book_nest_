import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-hot-toast';

function Shome() {
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) {
        toast.error('User not found');
        setLoading(false);
        return;
      }

      try {
        // Fetch books
        const booksResponse = await axios.get(`http://localhost:5001/api/books/seller/${user.id}`);
        console.log('Books response:', booksResponse.data);
        setItems(booksResponse.data.data || []);

        // Fetch orders
        const ordersResponse = await axios.get(`http://localhost:5001/api/orders/seller/${user.id}`);
        console.log('Orders response:', ordersResponse.data);
        setOrders(ordersResponse.data.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  const totalItems = items.length;
  const totalOrders = orders.length;

  const data = [
    { name: 'Items', value: totalItems, fill: '#4F46E5' },
    { name: 'Orders', value: totalOrders, fill: '#F59E0B' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-800 text-center mb-8">
          Seller Dashboard
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Link to="/myproducts" className="transform hover:scale-105 transition-transform duration-200">
            <div className="bg-gradient-to-r from-indigo-500 to-blue-600 rounded-xl shadow-xl p-6">
              <div className="flex flex-col items-center text-white">
                <h2 className="text-2xl font-semibold mb-2">Total Items</h2>
                <span className="text-4xl font-bold">{totalItems}</span>
              </div>
            </div>
          </Link>

          <Link to="/orders" className="transform hover:scale-105 transition-transform duration-200">
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl shadow-xl p-6">
              <div className="flex flex-col items-center text-white">
                <h2 className="text-2xl font-semibold mb-2">Total Orders</h2>
                <span className="text-4xl font-bold">{totalOrders}</span>
              </div>
            </div>
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-xl p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
            Performance Overview
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Shome;
