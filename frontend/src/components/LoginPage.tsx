import React from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { LogIn, Loader2, ShieldCheck, Phone } from 'lucide-react';

export default function LoginPage() {
  const { login, loginStatus } = useInternetIdentity();
  const isLoggingIn = loginStatus === 'logging-in';

  return (
    <div className="min-h-screen bg-gradient-to-b from-shop-green-50 to-white flex flex-col">
      {/* Banner */}
      <div className="w-full">
        <img
          src="/assets/generated/chicken-shop-banner.dim_1200x400.png"
          alt="Smart Chicken Shop"
          className="w-full object-cover max-h-64 md:max-h-80"
        />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img
                src="/assets/generated/chicken-shop-logo.dim_256x256.png"
                alt="Chicken Shop Logo"
                className="w-20 h-20 rounded-2xl shadow-card object-cover"
              />
            </div>
            <h1 className="text-2xl font-bold text-shop-green-800">Smart Chicken Shop</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage your shop with ease</p>
          </div>

          {/* Login Card */}
          <div className="bg-card rounded-2xl border border-border shadow-card p-6">
            <h2 className="text-lg font-semibold text-foreground mb-1">Staff & Admin Sign In</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Use your Internet Identity to securely access your account.
            </p>

            <Button
              onClick={login}
              disabled={isLoggingIn}
              className="w-full h-11 text-base font-semibold gap-2"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In
                </>
              )}
            </Button>

            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground justify-center">
              <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
              Secured by Internet Identity
            </div>
          </div>

          {/* Role info */}
          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            <div className="bg-card rounded-xl border border-border p-3">
              <div className="text-xl mb-1">👑</div>
              <div className="text-xs font-semibold text-foreground">Admin</div>
              <div className="text-xs text-muted-foreground">Secure login</div>
            </div>
            <div className="bg-card rounded-xl border border-border p-3">
              <div className="text-xl mb-1">🧑‍💼</div>
              <div className="text-xs font-semibold text-foreground">Staff</div>
              <div className="text-xs text-muted-foreground">Secure login</div>
            </div>
            <div className="bg-card rounded-xl border border-border p-3">
              <div className="text-xl mb-1">📱</div>
              <div className="text-xs font-semibold text-foreground">Customer</div>
              <div className="text-xs text-muted-foreground">No login needed</div>
            </div>
          </div>

          {/* Customer note */}
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2.5">
            <Phone className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 leading-relaxed">
              <span className="font-semibold">Customers do not need to sign in.</span> They are
              identified automatically by phone number and receive balance updates &amp; receipts
              directly from the shop.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-muted-foreground">
        <p>
          © {new Date().getFullYear()} Smart Chicken Shop &nbsp;·&nbsp; Built with{' '}
          <span className="text-red-500">♥</span> using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || 'smart-chicken-shop')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
