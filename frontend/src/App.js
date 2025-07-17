import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './Componenets/Home';
import ProductList from './Componenets/ProductList';
import UserList from './Componenets/UserList';
import OrderList from './Componenets/OrderList';
import Register from './Componenets/Register';
import Login from './Componenets/Login';
import Navigation from './Componenets/Navigation';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  return (
    <Router>
      <Navigation />
      <div className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/users" element={<UserList />} />
          <Route path="/orders" element={<OrderList />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
