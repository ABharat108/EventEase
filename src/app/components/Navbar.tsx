import { CalendarDays, Menu, X, Sparkles, LogOut, LayoutDashboard } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from './ui/button';

interface NavbarProps {
  currentView: string;
  onChangeView: (view: string) => void;
  userType: 'organizer' | 'staff' | null;
  isAuthenticated?: boolean;
  onLogout?: () => void;
}

export function Navbar({ currentView, onChangeView, userType, isAuthenticated, onLogout }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  // Use white text when on dashboard to contrast with purple gradient background
  const isDashboard = currentView === 'dashboard';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isDashboard 
          ? 'bg-gradient-to-r from-violet-600 via-violet-700 to-fuchsia-600 shadow-lg'
          : scrolled ? 'bg-white/80 backdrop-blur-md shadow-sm py-2' : 'bg-transparent py-4'
      } ${isDashboard ? 'py-4' : ''}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div 
            className="flex items-center cursor-pointer group" 
            onClick={() => onChangeView('landing')}
          >
            <div className={`${isDashboard ? 'bg-white text-violet-600' : 'bg-violet-600 text-white'} p-2 rounded-xl mr-2 shadow-lg group-hover:rotate-12 transition-transform duration-300`}>
               <Sparkles className="h-6 w-6" />
            </div>
            <span className={`text-2xl font-black tracking-tight ${
              isDashboard 
                ? 'text-white' 
                : 'bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-fuchsia-600'
            }`}>
              EventEase
            </span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {isAuthenticated && userType ? (
              <div className="flex items-center space-x-3">
                <Button 
                  variant="ghost" 
                  onClick={() => onChangeView('dashboard')}
                  className={`font-bold ${
                    isDashboard 
                      ? 'text-white hover:bg-white/20' 
                      : 'text-gray-700 hover:text-violet-600 hover:bg-violet-50'
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
                <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                  isDashboard 
                    ? 'bg-white/20 text-white backdrop-blur-sm' 
                    : 'bg-violet-100 text-violet-700'
                }`}>
                  {userType === 'organizer' ? 'Organizer' : 'Staff'}
                </div>
                <Button 
                  variant="outline" 
                  onClick={onLogout}
                  className={`font-bold rounded-full px-6 h-11 shadow-lg transition-all duration-300 ${
                    isDashboard 
                      ? 'bg-white/10 text-white border-white/40 hover:bg-white hover:text-violet-600 backdrop-blur-sm hover:border-white hover:shadow-white/20' 
                      : 'text-red-600 border-red-200 bg-red-50 hover:text-white hover:bg-red-600 hover:border-red-600'
                  }`}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Log out
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Button 
                  onClick={() => onChangeView('auth')}
                  className="bg-gray-900 text-white hover:bg-gray-800 rounded-full px-6 font-bold shadow-lg shadow-gray-900/20"
                >
                  Log in
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-gray-900 focus:outline-none p-2 rounded-lg hover:bg-gray-100"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b shadow-lg animate-in slide-in-from-top-2">
          <div className="px-4 pt-4 pb-6 space-y-2">
            {isAuthenticated && userType ? (
              <div className="border-t border-gray-100 my-2 pt-2 space-y-2">
                <div className="px-4 py-2 bg-violet-100 text-violet-700 rounded-xl text-sm font-bold text-center">
                  Logged in as {userType === 'organizer' ? 'Organizer' : 'Staff'}
                </div>
                <button 
                  onClick={() => { onChangeView('dashboard'); setIsMenuOpen(false); }}
                  className="flex items-center px-4 py-3 rounded-xl text-base font-bold text-gray-700 hover:text-violet-600 hover:bg-violet-50 w-full"
                >
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </button>
                <Button 
                    className="w-full rounded-full font-bold bg-red-600 hover:bg-red-700" 
                    onClick={() => { onLogout?.(); setIsMenuOpen(false); }}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Log Out
                </Button>
              </div>
            ) : (
              <div className="border-t border-gray-100 my-2 pt-2">
                  <Button 
                      className="w-full rounded-full font-bold bg-gray-900 hover:bg-gray-800" 
                      onClick={() => { onChangeView('auth'); setIsMenuOpen(false); }}
                  >
                    Log In
                  </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}