import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Card } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../utils/api';

function Ahome() {
  const [users, setUsers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in and is admin
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    
    if (!user || !token || userRole !== 'admin') {
      toast.error('Please login as admin');
      navigate('/alogin');
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch all data in parallel - Remove extra /api prefix
        const [usersRes, vendorsRes, itemsRes, ordersRes] = await Promise.all([
          api.get('/admin/users'),
          api.get('/admin/sellers'),
          api.get('/books'),
          api.get('/orders')
        ]);

        if (usersRes.data && Array.isArray(usersRes.data)) {
          setUsers(usersRes.data);
        }
        if (vendorsRes.data && Array.isArray(vendorsRes.data)) {
          setVendors(vendorsRes.data);
        }
        if (itemsRes.data?.data?.books) {
          setItems(itemsRes.data.data.books);
        }
        if (ordersRes.data && Array.isArray(ordersRes.data)) {
          setOrders(ordersRes.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        const errorMessage = error.response?.data?.error || 'Failed to fetch data';
        toast.error(errorMessage);
        
        // If unauthorized, redirect to login
        if (error.response?.status === 401) {
          localStorage.clear();
          navigate('/alogin');
        }
      } finally {
        setIsLoading(false);
      }
    };

    // Add a small delay to ensure token is set
    const timer = setTimeout(fetchData, 100);
    return () => clearTimeout(timer);
  }, [navigate]);

  const colors = ['#2B124C', '#AE4451', '#F39F5A', 'orange'];

  // Calculate totals
  const totalUsers = users.length;
  const totalVendors = vendors.length;
  const totalItems = items.length;
  const totalOrders = orders.length;

  // Define data for the bar chart
  const data = [
    { name: 'Users', value: totalUsers, fill: '#2B124C' },
    { name: 'Vendors', value: totalVendors, fill: 'cyan' },
    { name: 'Items', value: totalItems, fill: 'blue' },
    { name: 'Orders', value: totalOrders, fill: 'orange' },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h3 className="text-2xl font-bold text-center mb-6">Admin Dashboard</h3>
      <Card body className="bg-white w-11/12 mx-auto shadow-lg rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-4">
          <Link to="/users" className="no-underline">
            <div className="bg-red-500 rounded-lg shadow-md p-6 text-center transform hover:scale-105 transition-transform duration-200">
              <h3 className="text-xl font-bold text-white mb-4">USERS</h3>
              <span className="text-3xl font-bold text-white">{totalUsers}</span>
            </div>
          </Link>
          
          <Link to="/sellers" className="no-underline">
            <div className="bg-blue-500 rounded-lg shadow-md p-6 text-center transform hover:scale-105 transition-transform duration-200">
              <h3 className="text-xl font-bold text-white mb-4">VENDORS</h3>
              <span className="text-3xl font-bold text-white">{totalVendors}</span>
            </div>
          </Link>
          
          <Link to="/items" className="no-underline">
            <div className="bg-green-500 rounded-lg shadow-md p-6 text-center transform hover:scale-105 transition-transform duration-200">
              <h3 className="text-xl font-bold text-white mb-4">ITEMS</h3>
              <span className="text-3xl font-bold text-white">{totalItems}</span>
            </div>
          </Link>
          
          <Link to="/orders" className="no-underline">
            <div className="bg-yellow-500 rounded-lg shadow-md p-6 text-center transform hover:scale-105 transition-transform duration-200">
              <h3 className="text-xl font-bold text-white mb-4">ORDERS</h3>
              <span className="text-3xl font-bold text-white">{totalOrders}</span>
            </div>
          </Link>
        </div>

        <div className="flex justify-center mt-8">
          <BarChart width={600} height={400} data={data} className="bg-gray-50 rounded-lg p-4">
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#8884d8" barSize={50} />
          </BarChart>
        </div>
      </Card>
    </div>
  );
}

export default Ahome;
