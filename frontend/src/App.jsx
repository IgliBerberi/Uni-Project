import { BrowserRouter, Route, Routes } from 'react-router-dom';
import {
  BusinessRoute,
  CustomerAreaRoute,
  GuestBusinessRoute,
  GuestUserRoute,
  UserRoute,
} from './components/ProtectedRoute';
import Layout from './components/Layout';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import CartFlyAnimation from './components/CartFlyAnimation';
import BusinessAuth from './pages/BusinessAuth';
import Dashboard from './pages/Dashboard';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Orders from './pages/Orders';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import UserAuth from './pages/UserAuth';

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <CartFlyAnimation />
          <Routes>
          <Route element={<Layout />}>
            <Route
              index
              element={
                <CustomerAreaRoute>
                  <Home />
                </CustomerAreaRoute>
              }
            />
            <Route
              path="product/:id"
              element={
                <CustomerAreaRoute>
                  <ProductDetail />
                </CustomerAreaRoute>
              }
            />
            <Route
              path="cart"
              element={
                <CustomerAreaRoute>
                  <Cart />
                </CustomerAreaRoute>
              }
            />
            <Route
              path="checkout"
              element={
                <CustomerAreaRoute>
                  <Checkout />
                </CustomerAreaRoute>
              }
            />
            <Route
              path="account"
              element={
                <GuestUserRoute>
                  <UserAuth />
                </GuestUserRoute>
              }
            />
            <Route
              path="orders"
              element={
                <CustomerAreaRoute>
                  <UserRoute>
                    <Orders />
                  </UserRoute>
                </CustomerAreaRoute>
              }
            />
            <Route
              path="profile"
              element={
                <CustomerAreaRoute>
                  <UserRoute>
                    <Profile />
                  </UserRoute>
                </CustomerAreaRoute>
              }
            />
            <Route
              path="settings"
              element={
                <CustomerAreaRoute>
                  <UserRoute>
                    <Settings />
                  </UserRoute>
                </CustomerAreaRoute>
              }
            />
            <Route
              path="business/login"
              element={
                <GuestBusinessRoute>
                  <BusinessAuth />
                </GuestBusinessRoute>
              }
            />
            <Route
              path="dashboard"
              element={
                <BusinessRoute>
                  <Dashboard />
                </BusinessRoute>
              }
            />
          </Route>
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
