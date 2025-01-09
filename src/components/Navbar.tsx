import { Link, useLocation } from 'react-router-dom';
import { Home, Map, MessageCircle, User } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/map', icon: Map, label: 'Map' },
    { path: '/messages', icon: MessageCircle, label: 'Messages' },
    { path: '/profile', icon: User, label: 'Profile' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900/90 backdrop-blur-lg border-t border-gray-800 transition-all duration-300">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex justify-around items-center h-16">
          {navItems.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              aria-label={label}
              className={`relative p-3 rounded-full transition-all duration-300 ${
                location.pathname === path
                  ? 'text-blue-400 bg-blue-500/10 scale-110'
                  : 'text-gray-400 hover:text-blue-400 hover:bg-blue-500/5'
              }`}
            >
              <Icon className="w-6 h-6" />
              {location.pathname === path && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full" />
              )}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
} 