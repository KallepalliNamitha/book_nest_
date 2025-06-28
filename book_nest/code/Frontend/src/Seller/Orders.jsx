import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

function Orders() {
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch items data
    const user = JSON.parse(localStorage.getItem('user'));
    console.log(user)
    if (user) {
      axios.get(`http://localhost:5001/getsellerorders/${user.id}`)
        .then((response) => {
          setOrders(response.data);
        })
        .catch((error) => {
          console.error('Error fetching bookings: ', error);
        });
    }
  }, []);

  // Function to calculate the status based on the delivery date
  const calculateStatus = (Delivery) => {
    const currentDate = new Date();
    const formattedDeliveryDate = new Date(Delivery);

    if (formattedDeliveryDate >= currentDate) {
      return "ontheway";
    } else {
      return "delivered";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h3 className="text-3xl font-semibold mb-8 text-center">Orders</h3>
      <div className="space-y-6">
        {orders.map((item) => {
          const status = calculateStatus(item.Delivery);

          return (
            <Card
              key={item._id}
              className="shadow-lg rounded-lg overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 p-6">
                <div className="flex items-center justify-center">
                  <img 
                    src={`http://localhost:5001/${item?.itemImage}`} 
                    alt={`${item.itemtype} Image`} 
                    className="h-20 object-contain"
                  />
                </div>
                <div className="space-y-2">
                  <p className="font-semibold">Product Details</p>
                  <p>{item.itemname}</p>
                  <p className="text-sm text-gray-600">Order ID: {item._id.slice(0,10)}</p>
                </div>
                <div className="space-y-2">
                  <p className="font-semibold">Customer Details</p>
                  <p>{item.userName}</p>
                  <p className="text-sm text-gray-600">
                    {item.flatno}, {item.city}, {item.state} - {item.pincode}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="font-semibold">Delivery Details</p>
                  <p>Booked: {item.BookingDate}</p>
                  <p>Delivery By: {item.Delivery}</p>
                  <p className="text-sm text-gray-600">Warranty: 1 year</p>
                </div>
                <div className="space-y-2">
                  <p className="font-semibold">Order Status</p>
                  <p className={`font-medium ${status === 'delivered' ? 'text-green-600' : 'text-blue-600'}`}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </p>
                  <p className="font-semibold text-lg">₹{item.totalamount}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default Orders;
