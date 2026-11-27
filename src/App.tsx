import React, { useEffect, useState } from 'react';
import { BrowserRouter, HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import { MainLayout } from './layouts/MainLayout';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { LandingPage } from './pages/landing/LandingPage';
import { AboutPage } from './pages/about/AboutPage';
import { ServicesPage } from './pages/services/ServicesPage';
import { PricingPage } from './pages/pricing/PricingPage';
import { PortfolioPage } from './pages/portfolio/PortfolioPage';
import { ReviewsPage } from './pages/reviews/ReviewsPage';
import { ContactPage } from './pages/contact/ContactPage';
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { RequestEditPage } from './pages/customer/RequestEditPage';
import { CustomerDashboardPage } from './pages/customer/CustomerDashboardPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import {
  DEFAULT_SITE_SETTINGS,
  INITIAL_BANNERS,
  INITIAL_PORTFOLIO,
  INITIAL_SERVICES,
} from './data/defaultCatalog';
import {
  subscribeApprovedReviews,
  subscribeBanners,
  subscribePortfolio,
  subscribeServices,
  subscribeSiteSettings,
} from './services/studioService';
import {
  CustomerReview,
  EditingService,
  PortfolioItem,
  PromoBanner,
  SiteSettings,
} from './types/studio';

function StudioRoutes() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [services, setServices] = useState<EditingService[]>(INITIAL_SERVICES as EditingService[]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>(INITIAL_PORTFOLIO as PortfolioItem[]);
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [banners, setBanners] = useState<PromoBanner[]>(INITIAL_BANNERS as PromoBanner[]);

  useEffect(() => {
    const unsubs = [
      subscribeSiteSettings(setSettings),
      subscribeServices(setServices, false),
      subscribePortfolio(setPortfolio, false),
      subscribeApprovedReviews(setReviews),
      subscribeBanners(setBanners, false),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  return (
    <Routes>
      <Route element={<MainLayout settings={settings} />}>
        <Route
          path="/"
          element={
            <LandingPage
              settings={settings}
              services={services}
              portfolio={portfolio}
              reviews={reviews}
              banners={banners}
            />
          }
        />
        <Route path="/about" element={<AboutPage settings={settings} />} />
        <Route path="/services" element={<ServicesPage services={services} />} />
        <Route path="/pricing" element={<PricingPage services={services} />} />
        <Route path="/portfolio" element={<PortfolioPage items={portfolio} />} />
        <Route path="/reviews" element={<ReviewsPage reviews={reviews} />} />
        <Route path="/contact" element={<ContactPage settings={settings} services={services} />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route
          path="/request-edit"
          element={
            <ProtectedRoute>
              <RequestEditPage services={services} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <CustomerDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin>
              <AdminDashboardPage settings={settings} />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

const useHashRouting =
  typeof window !== 'undefined' &&
  (window.location.hostname.endsWith('github.io') || window.location.protocol === 'file:');

export default function App() {
  const RouterComponent = useHashRouting ? HashRouter : BrowserRouter;

  return (
    <ErrorBoundary>
      <AuthProvider>
        <RouterComponent>
          <StudioRoutes />
        </RouterComponent>
      </AuthProvider>
    </ErrorBoundary>
  );
}
