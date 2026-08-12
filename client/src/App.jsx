import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ChefLogin from './pages/ChefLogin';
import ChefRegister from './pages/ChefRegister';
import ChefProfilePage from './pages/ChefProfilePage';
import BecomeChefPage from './pages/BecomeChefPage';
import ChefsDirectoryPage from './pages/ChefsDirectoryPage';
import ChefPublicProfilePage from './pages/ChefPublicProfilePage';
import FoodMarketplacePage from './pages/FoodMarketplacePage';
import CategoriesPage from './pages/CategoriesPage';
import AvailabilityPage from './pages/AvailabilityPage';
import BookingsPage from './pages/BookingsPage';
import OrdersPage from './pages/OrdersPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import DashboardPage from './pages/DashboardPage';

function AppRoutes() {
  const location = useLocation();

  // The unified dashboard owns its own navigation, so the global
  // Navbar/Footer are hidden there.
  const hideChrome = location.pathname.startsWith('/dashboard');

  return (
    <>
      {!hideChrome && <Navbar />}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/chef/login" element={<ChefLogin />} />
        <Route path="/chef/register" element={<ChefRegister />} />
        <Route path="/chefs" element={<ChefsDirectoryPage />} />
        <Route path="/chefs/:id" element={<ChefPublicProfilePage />} />
        <Route path="/chef/profile" element={<ChefProfilePage />} />
        <Route path="/become-chef" element={<BecomeChefPage />} />
        <Route path="/food" element={<FoodMarketplacePage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/chef/availability" element={<AvailabilityPage />} />
        <Route path="/bookings" element={<BookingsPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Catch-all route */}
        <Route path="*" element={<Home />} />
      </Routes>

      {!hideChrome && <Footer />}
    </>
  );
}

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;