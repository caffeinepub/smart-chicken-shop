import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import AdminDashboard from './components/AdminDashboard';
import CustomerList from './components/CustomerList';
import PendingCustomersList from './components/PendingCustomersList';
import ProfileSetupModal from './components/ProfileSetupModal';
import AdminSettings from './components/AdminSettings';
import CustomerPortalView from './components/CustomerPortalView';
import {
  LayoutDashboard,
  Users,
  Bell,
  LogOut,
  LogIn,
  Settings,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const queryClient = new QueryClient();

// ─── Public Customer Portal Wrapper ──────────────────────────────────────────
function PublicCustomerPortal() {
  const params = new URLSearchParams(window.location.search);
  const customerId = params.get('id') ?? '';
  return <CustomerPortalView customerId={customerId} />;
}

// ─── Inner App (needs QueryClient context) ───────────────────────────────────
function AppInner() {
  const isCustomerPortal =
    window.location.pathname === '/customer' ||
    window.location.pathname.endsWith('/customer');

  if (isCustomerPortal) {
    return <PublicCustomerPortal />;
  }

  return <AuthenticatedApp />;
}

type AdminPage = 'dashboard' | 'customers' | 'pending' | 'settings';

function AuthenticatedApp() {
  const { login, clear, loginStatus, identity, isInitializing } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';

  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched: profileFetched,
  } = useGetCallerUserProfile();

  const [activePage, setActivePage] = useState<AdminPage>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const showProfileSetup =
    isAuthenticated && !profileLoading && profileFetched && userProfile === null;

  const role = userProfile?.role ?? 'guest';
  const isAdmin = role === 'admin';
  const isStaff = role === 'staff' || role === 'user';
  const isAuthorized = isAdmin || isStaff;

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: unknown) {
      const err = error as Error;
      if (err?.message === 'User is already authenticated') {
        await clear();
        setTimeout(() => login(), 300);
      }
    }
  };

  // Loading state
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated → show login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md text-center space-y-6">
            <img
              src="/assets/generated/chicken-shop-logo.dim_256x256.png"
              alt="Smart Chicken Shop"
              className="w-24 h-24 mx-auto rounded-2xl shadow-lg object-cover"
            />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Smart Chicken Shop</h1>
              <p className="text-muted-foreground mt-2">Staff &amp; Admin Portal</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 space-y-4 shadow-sm">
              <p className="text-sm text-muted-foreground">
                Sign in to manage customers, transactions, and reports.
              </p>
              <Button
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="w-full flex items-center justify-center gap-2"
                size="lg"
              >
                {isLoggingIn ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground">
                Customers don&apos;t need to sign in.{' '}
                <span className="text-primary">Use your customer link to view your account.</span>
              </p>
            </div>
          </div>
        </div>
        <footer className="text-center py-4 text-xs text-muted-foreground border-t border-border">
          Built with ❤️ using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>{' '}
          · © {new Date().getFullYear()} Smart Chicken Shop
        </footer>
      </div>
    );
  }

  // Authenticated but profile loading
  if (profileLoading && !profileFetched) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Profile setup needed — use the existing ProfileSetupModal which handles its own save
  if (showProfileSetup) {
    return (
      <>
        <ProfileSetupModal open={true} />
        <Toaster />
      </>
    );
  }

  // Authenticated but not authorized (customer role trying to access admin portal)
  if (isAuthenticated && profileFetched && !profileLoading && !isAuthorized && userProfile !== null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
            <X className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
          <p className="text-muted-foreground text-sm">
            This portal is for Admin and Staff only. Customers can view their account via their
            unique customer link.
          </p>
          <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </div>
    );
  }

  const navItems: {
    id: AdminPage;
    label: string;
    icon: React.ReactNode;
    adminOnly?: boolean;
  }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'customers', label: 'Customers', icon: <Users className="w-4 h-4" /> },
    { id: 'pending', label: 'Pending Balances', icon: <Bell className="w-4 h-4" /> },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-4 h-4" />,
      adminOnly: true,
    },
  ];

  const visibleNavItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <AdminDashboard userRole={role} />;
      case 'customers':
        return <CustomerList userRole={role} />;
      case 'pending':
        return <PendingCustomersList />;
      case 'settings':
        return isAdmin ? <AdminSettings /> : null;
      default:
        return <AdminDashboard userRole={role} />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-card border-r border-border z-30 flex flex-col transition-transform duration-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-border flex items-center gap-3">
          <img
            src="/assets/generated/chicken-shop-logo.dim_256x256.png"
            alt="Logo"
            className="w-9 h-9 rounded-lg object-cover"
          />
          <div>
            <p className="font-bold text-sm text-foreground leading-tight">Smart Chicken</p>
            <p className="text-xs text-muted-foreground">Shop Manager</p>
          </div>
          <button
            className="ml-auto lg:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User info */}
        <div className="px-4 py-3 border-b border-border">
          <p className="text-sm font-medium text-foreground truncate">
            {userProfile?.name ?? 'User'}
          </p>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              isAdmin
                ? 'bg-primary/10 text-primary'
                : 'bg-secondary text-secondary-foreground'
            }`}
          >
            {isAdmin ? 'Admin' : 'Staff'}
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {visibleNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActivePage(item.id);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${
                  activePage === item.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
            >
              {item.icon}
              {item.label}
              {activePage === item.id && <ChevronRight className="w-3 h-3 ml-auto" />}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-border">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-card border-b border-border">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Menu className="w-5 h-5" />
          </button>
          <img
            src="/assets/generated/chicken-shop-logo.dim_256x256.png"
            alt="Logo"
            className="w-7 h-7 rounded object-cover"
          />
          <span className="font-semibold text-sm text-foreground">Smart Chicken Shop</span>
        </header>

        <main className="flex-1 overflow-auto">{renderPage()}</main>

        <footer className="text-center py-3 text-xs text-muted-foreground border-t border-border">
          Built with ❤️ using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>{' '}
          · © {new Date().getFullYear()} Smart Chicken Shop
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppInner />
      <Toaster />
    </QueryClientProvider>
  );
}
