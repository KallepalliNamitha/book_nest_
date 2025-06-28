import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ErrorBoundary from './components/ErrorBoundary';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import UserProfile from './User/UserProfile';

// Public Components
import Home from './components/Home';
import Login from './User/Login';
import Signup from './User/Signup';
import Slogin from './Seller/Slogin';
import Ssignup from './Seller/Ssignup';
import Alogin from './Admin/Alogin';
import Asignup from './Admin/Asignup';

// User Components
import Uhome from './User/Uhome';
import Products from './User/Products';
import Uitem from './User/Uitem';
import OrderItem from './User/OrderItem';
import Myorders from './User/Myorders';
import Wishlist from './User/Wishlist';
import Cart from './components/Cart';
import Checkout from './components/Checkout';

// Seller Components
import Shome from './Seller/Shome';
import Addbook from './Seller/Addbook';
import Book from './Seller/Book';
import Myproducts from './Seller/Myproducts';
import Orders from './Seller/Orders';

// Admin Components
import Ahome from './Admin/Ahome';
import Users from './Admin/Users';
import Seller from './Admin/Seller';
import Items from './Admin/Items';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <NotificationProvider>
            <Routes>
              {/* Public Routes */}
              <Route element={<MainLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/slogin" element={<Slogin />} />
                <Route path="/ssignup" element={<Ssignup />} />
                <Route path="/alogin" element={<Alogin />} />
                <Route path="/asignup" element={<Asignup />} />

                {/* Protected User Routes */}
                <Route path="/uhome" element={
                  <ProtectedRoute requiredRole="user">
                    <Uhome />
                  </ProtectedRoute>
                } />
                <Route path="/uproducts" element={
                  <ProtectedRoute requiredRole="user">
                    <Products />
                  </ProtectedRoute>
                } />
                <Route path="/uitem/:id" element={
                  <ProtectedRoute requiredRole="user">
                    <Uitem />
                  </ProtectedRoute>
                } />
                <Route path="/orderitem/:id" element={
                  <ProtectedRoute requiredRole="user">
                    <OrderItem />
                  </ProtectedRoute>
                } />
                <Route path="/myorders" element={
                  <ProtectedRoute requiredRole="user">
                    <Myorders />
                  </ProtectedRoute>
                } />
                <Route path="/wishlist" element={
                  <ProtectedRoute requiredRole="user">
                    <Wishlist />
                  </ProtectedRoute>
                } />
                <Route path="/cart" element={
                  <ProtectedRoute requiredRole="user">
                    <Cart />
                  </ProtectedRoute>
                } />
                <Route path="/checkout" element={
                  <ProtectedRoute requiredRole="user">
                    <Checkout />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <UserProfile />
                  </ProtectedRoute>
                } />

                {/* Protected Seller Routes */}
                <Route path="/shome" element={
                  <ProtectedRoute requiredRole="seller">
                    <Shome />
                  </ProtectedRoute>
                } />
                <Route path="/addbook" element={
                  <ProtectedRoute requiredRole="seller">
                    <Addbook />
                  </ProtectedRoute>
                } />
                <Route path="/book" element={
                  <ProtectedRoute requiredRole="seller">
                    <Book />
                  </ProtectedRoute>
                } />
                <Route path="/myproducts" element={
                  <ProtectedRoute requiredRole="seller">
                    <Myproducts />
                  </ProtectedRoute>
                } />
                <Route path="/orders" element={
                  <ProtectedRoute requiredRole="seller">
                    <Orders />
                  </ProtectedRoute>
                } />

                {/* Protected Admin Routes */}
                <Route path="/ahome" element={
                  <ProtectedRoute requiredRole="admin">
                    <Ahome />
                  </ProtectedRoute>
                } />
                <Route path="/users" element={
                  <ProtectedRoute requiredRole="admin">
                    <Users />
                  </ProtectedRoute>
                } />
                <Route path="/seller" element={
                  <ProtectedRoute requiredRole="admin">
                    <Seller />
                  </ProtectedRoute>
                } />
                <Route path="/items" element={
                  <ProtectedRoute requiredRole="admin">
                    <Items />
                  </ProtectedRoute>
                } />
              </Route>
            </Routes>
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
