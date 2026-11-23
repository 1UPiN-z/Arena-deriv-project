/** Application router + marketing layout. */
import { useEffect } from 'react';
import { BrowserRouter, Link, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { SiteFooter, SiteHeader } from './components/layout/SiteHeader';
import { ToastHost } from './components/ui/kit';
import { HomePage } from './pages/HomePage';
import { MarketsPage } from './pages/MarketsPage';
import { PlatformPage } from './pages/PlatformPage';
import { LearnPage } from './pages/LearnPage';
import { AboutPage } from './pages/AboutPage';
import { LoginPage, SignupPage } from './pages/AuthPages';
import { AccountPage } from './pages/AccountPage';
import { TraderPage } from './pages/TraderPage';
import { BotApp } from './pages/bot/BotApp';
import { BotDashboardPage } from './pages/bot/BotDashboardPage';
import { BotBuilderPage } from './pages/bot/BotBuilderPage';
import { BotChartsPage } from './pages/bot/BotChartsPage';
import { BotTutorialsPage } from './pages/bot/BotTutorialsPage';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
  return null;
}

function MarketingLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <div className="flex-1">
        <Outlet />
      </div>
      <SiteFooter />
    </div>
  );
}

function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="text-7xl">🧭</div>
      <h1 className="text-3xl font-bold text-deriv-ink dark:text-white">Page not found</h1>
      <p className="text-deriv-muted">The page you are looking for does not exist in this demo.</p>
      <Link to="/" className="btn-primary h-11 px-6">Back to home</Link>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route element={<MarketingLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/markets/:slug" element={<MarketsPage />} />
          <Route path="/platforms/:slug" element={<PlatformPage />} />
          <Route path="/learn" element={<LearnPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/trader" element={<TraderPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="/bot" element={<BotApp />}>
          <Route index element={<BotDashboardPage />} />
          <Route path="builder" element={<BotBuilderPage />} />
          <Route path="charts" element={<BotChartsPage />} />
          <Route path="tutorials" element={<BotTutorialsPage />} />
        </Route>
      </Routes>
      <ToastHost />
    </BrowserRouter>
  );
}
