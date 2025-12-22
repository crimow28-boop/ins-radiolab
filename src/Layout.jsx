import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  Radio, 
  Home, 
  ClipboardList, 
  Package, 
  History,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Layout({ children, currentPageName }) {
  const navItems = [
    { name: 'NewInspection', label: 'בדיקה חדשה', icon: ClipboardList },
    { name: 'Devices', label: 'מלאי', icon: Package },
    { name: 'InspectionHistory', label: 'היסטוריה', icon: History },
  ];

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      {/* Mobile Bottom Navigation - Always Visible */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 shadow-2xl">
        <div className="flex items-center justify-around px-4 py-3">
          {navItems.map((item) => {
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

      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:right-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-l border-slate-200">
          <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center">
              <Radio className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-800">RadioLab</h1>
              <p className="text-xs text-slate-500">מערכת בדיקות</p>
            </div>
          </div>

          <nav className="flex-1 px-3 py-6 space-y-2">
            {navItems.map((item) => {
              const isActive = currentPageName === item.name;
              return (
                <Link key={item.name} to={createPageUrl(item.name)}>
                  <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}>
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 opacity-100" />
                    )}
                    <item.icon className={`w-5 h-5 relative z-10 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-600'}`} />
                    <span className="font-medium relative z-10">{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-100">
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold">
                RL
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">INS-RadioLab</p>
                <p className="text-xs text-slate-500 truncate">v1.0.0 • Stable</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pr-64">
        <main className="pb-24">
          {children}
        </main>
      </div>
    </div>
  );
}