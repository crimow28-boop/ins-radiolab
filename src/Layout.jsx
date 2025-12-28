import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Radio, Star, Calendar, Info, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function Layout({ children, currentPageName }) {
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me().catch(() => null),
  });

  const navItems = [
    { name: 'Cards', label: 'כרטיסים', icon: Radio },
    { name: 'Info', label: 'מידע', icon: Info },
    { name: 'Users', label: 'משתמשים', icon: Users, adminOnly: true },
    { name: 'Admin', label: 'ניהול', icon: Users, adminOnly: true },
  ];

  const filteredNavItems = navItems.filter(item => !item.adminOnly || user?.role === 'admin');

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center">
                <Radio className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-slate-800">RadioLab</h1>
                <p className="text-xs text-slate-500">מערכת בדיקות</p>
              </div>
            </Link>
            
            {/* Desktop Tabs */}
            <nav className="hidden md:flex items-center gap-2">
              {filteredNavItems.map((item) => {
                const isActive = currentPageName === item.name;
                return (
                  <Link key={item.name} to={createPageUrl(item.name)}>
                    <div className={`flex items-center gap-2 px-6 py-2.5 rounded-full transition-all ${
                      isActive 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}>
                      <item.icon className="w-4 h-4" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 shadow-2xl">
        <div className="flex items-center justify-around px-4 py-3">
          {filteredNavItems.map((item) => {
            const isActive = currentPageName === item.name;
            return (
              <Link 
                key={item.name} 
                to={createPageUrl(item.name)}
                className="flex flex-col items-center justify-center flex-1"
              >
                <div className={`p-2.5 rounded-2xl transition-all ${
                  isActive ? 'bg-blue-600 shadow-lg' : ''
                }`}>
                  <item.icon className={`w-6 h-6 ${
                    isActive ? 'text-white' : 'text-slate-400'
                  }`} />
                </div>
                <span className={`text-xs mt-1.5 font-semibold ${
                  isActive ? 'text-blue-600' : 'text-slate-500'
                }`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <main className="pb-24 md:pb-6">
        {children}
      </main>
    </div>
  );
}