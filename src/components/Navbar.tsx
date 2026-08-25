import React, { useState } from 'react';
import {
  Heart,
  MessageCircleHeart,
  Smile,
  BookOpen,
  BarChart3,
  Sparkles,
  User,
  LogOut,
  Menu,
  X,
  PhoneCall,
  Wind,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenCrisisModal: () => void;
  onOpenBreathingModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenCrisisModal,
  onOpenBreathingModal,
}) => {
  const { userProfile, currentUser, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Heart },
    { id: 'chat', label: 'AI Companion', icon: MessageCircleHeart },
    { id: 'mood', label: 'Mood Log', icon: Smile },
    { id: 'journal', label: 'Journal', icon: BookOpen },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'recommendations', label: 'Wellness Tools', icon: Sparkles },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div
            id="brand-logo-btn"
            onClick={() => handleNavClick('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-teal-600/20 group-hover:scale-105 transition-transform">
              <Heart className="w-5 h-5 fill-white/30" />
            </div>
            <div>
              <span className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
                MindBridge
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
              </span>
              <span className="block text-[9px] uppercase font-bold text-teal-600 tracking-wider -mt-1">
                AI Wellness Sanctuary
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/70">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-link-${item.id}`}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-teal-600'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Quick Header Actions */}
          <div className="hidden sm:flex items-center gap-2.5">
            {/* Quick Calm Button */}
            <button
              id="quick-breathwork-btn"
              onClick={onOpenBreathingModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 border border-emerald-200/80 text-xs font-bold transition-all shadow-xs active:scale-95"
              title="Quick Box Breathing Exercise"
            >
              <Wind className="w-3.5 h-3.5 text-emerald-600" />
              <span>Quick Calm</span>
            </button>

            {/* Helpline quick modal launcher */}
            <button
              id="nav-crisis-btn"
              onClick={onOpenCrisisModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100/80 text-rose-600 border border-rose-200/80 text-xs font-bold transition-all shadow-xs active:scale-95"
              title="24/7 Helpline Directory"
            >
              <PhoneCall className="w-3.5 h-3.5 text-rose-600" />
              <span>Get Help</span>
            </button>

            {/* Profile Avatar & Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <button
                id="user-profile-btn"
                onClick={() => handleNavClick('profile')}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-sky-600 text-white flex items-center justify-center text-xs font-extrabold shadow-xs hover:ring-2 hover:ring-teal-400 transition-all"
                title="Your Profile"
              >
                {userProfile?.name?.charAt(0).toUpperCase() ||
                  currentUser?.email?.charAt(0).toUpperCase() ||
                  'U'}
              </button>
              <button
                id="user-logout-btn"
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div
          id="mobile-drawer-menu"
          className="lg:hidden border-t border-slate-200 bg-white/95 px-4 pt-3 pb-6 space-y-2 animate-in slide-in-from-top-2 duration-200 shadow-xl"
        >
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`mobile-nav-${item.id}`}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-teal-600'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-200 flex flex-col gap-2">
            <button
              id="mobile-quick-breath-btn"
              onClick={() => {
                onOpenBreathingModal();
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold"
            >
              <Wind className="w-4 h-4 text-emerald-600" />
              <span>Take a 1-Min Mindful Breath</span>
            </button>

            <button
              id="mobile-crisis-btn"
              onClick={() => {
                onOpenCrisisModal();
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Immediate Crisis Helplines (24/7)</span>
            </button>

            <button
              id="mobile-logout-btn"
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-slate-500 hover:text-rose-600 text-xs font-semibold"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
