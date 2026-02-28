import React, { useState } from 'react';
import { LayoutDashboard, Users, Receipt, Bell, AlertCircle, Menu, X, LogOut, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { type UserProfile } from '../backend';

type Page = 'dashboard' | 'customers' | 'transactions' | 'pending' | 'profile' | 'notifications';

interface NavigationProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  userProfile: UserProfile | null;
  role: string;
}

interface NavItem {
  id: Page;
  label: string;
  icon: React.ElementType;
  roles: string[];
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin'] },
  { id: 'customers', label: 'Customers', icon: Users, roles: ['admin', 'staff'] },
  { id: 'transactions', label: 'Transactions', icon: Receipt, roles: ['admin', 'staff'] },
  { id: 'pending', label: 'Pending', icon: AlertCircle, roles: ['admin'] },
  { id: 'profile', label: 'My Profile', icon: Users, roles: ['customer'] },
  { id: 'notifications', label: 'Notifications', icon: Bell, roles: ['customer'] },
];

export default function Navigation({ currentPage, onNavigate, userProfile, role }: NavigationProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();

  const visibleItems = navItems.filter((item) => item.roles.includes(role));

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const handleNav = (page: Page) => {
    onNavigate(page);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-sidebar border-r border-sidebar-border min-h-screen fixed left-0 top-0 z-30">
        {/* Logo */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <img
              src="/assets/generated/chicken-shop-logo.dim_256x256.png"
              alt="Logo"
              className="w-9 h-9 rounded-lg object-cover"
            />
            <div>
              <p className="text-sidebar-foreground font-bold text-sm leading-tight">Smart Chicken</p>
              <p className="text-sidebar-foreground/60 text-xs">Shop Manager</p>
            </div>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-3 space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
                {isActive && <ChevronRight className="w-3 h-3 ml-auto" />}
              </button>
            );
          })}
        </nav>

        {/* User & Logout */}
        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-2 px-3 py-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-sidebar-primary/30 flex items-center justify-center text-sidebar-foreground text-xs font-bold">
              {userProfile?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sidebar-foreground text-xs font-semibold truncate">{userProfile?.name || 'User'}</p>
              <p className="text-sidebar-foreground/60 text-xs capitalize">{role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-shop-green-800 text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <img
            src="/assets/generated/chicken-shop-logo.dim_256x256.png"
            alt="Logo"
            className="w-8 h-8 rounded-lg object-cover"
          />
          <span className="font-bold text-sm">Smart Chicken Shop</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-sidebar flex flex-col">
            <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src="/assets/generated/chicken-shop-logo.dim_256x256.png"
                  alt="Logo"
                  className="w-8 h-8 rounded-lg object-cover"
                />
                <span className="text-sidebar-foreground font-bold text-sm">Smart Chicken Shop</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="text-sidebar-foreground/60">
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 p-3 space-y-1">
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                        : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <div className="p-3 border-t border-sidebar-border">
              <div className="flex items-center gap-2 px-3 py-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-sidebar-primary/30 flex items-center justify-center text-sidebar-foreground text-sm font-bold">
                  {userProfile?.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="text-sidebar-foreground text-sm font-semibold">{userProfile?.name || 'User'}</p>
                  <p className="text-sidebar-foreground/60 text-xs capitalize">{role}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-card border-t border-border flex">
        {visibleItems.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
              <span className="text-[10px]">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
