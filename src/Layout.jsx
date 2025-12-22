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
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems = [
    { name: 'Home', label: 'בית', icon: Home },
    { name: 'NewInspection', label: 'בדיקה חדשה', icon: ClipboardList },
    { name: 'Devices', label: 'מכשירים', icon: Package },
    { name: 'InspectionHistory', label: 'היסטוריה', icon: History },
  ];

  // Hide layout on splash screen
  if (currentPageName === 'Home') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-slate-200 fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to={createPageUrl('Home')} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
              <Radio className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-800">RadioLab</span>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="bg-white border-t border-slate-100 py-2">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={createPageUrl(item.name)}
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className={`flex items-center gap-3 px-4 py-3 ${
                  currentPageName === item.name 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}>
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
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

          <nav className="flex-1 px-4 py-6 space-y-1">
            {navItems.map((item) => (
              <Link key={item.name} to={createPageUrl(item.name)}>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  currentPageName === item.name 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}>
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </div>
              </Link>
            ))}
          </nav>

          <div className="px-4 py-4 border-t border-slate-100">
            <div className="px-4 py-3 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-500">INS-RadioLab</p>
              <p className="text-xs text-slate-400">v1.0.0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pr-64">
        <main className="lg:pt-0 pt-14">
          {children}
        </main>
      </div>
    </div>
  );
}