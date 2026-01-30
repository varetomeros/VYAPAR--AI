import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Package, 
  Bot, 
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: FileText, label: 'Invoices', path: '/invoices' },
  { icon: Users, label: 'Customers', path: '/customers' },
  { icon: Package, label: 'Inventory', path: '/inventory' },
  { icon: Bot, label: 'AI Assistant', path: '/assistant' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export const Sidebar = () => {
  const location = useLocation();
  const { signOut, user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={cn(
      "fixed left-0 top-0 z-40 h-screen bg-sidebar transition-all duration-300",
      collapsed ? "w-20" : "w-64"
    )}>
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
                <span className="text-sidebar-primary-foreground font-bold text-lg">V</span>
              </div>
              <span className="text-xl font-bold text-sidebar-foreground">VYAPAR AI</span>
            </div>
          )}
          {collapsed && (
            <div className="h-8 w-8 mx-auto rounded-lg gradient-primary flex items-center justify-center">
              <span className="text-sidebar-primary-foreground font-bold text-lg">V</span>
            </div>
          )}
          <Button 
            variant="ghost" 
            size="icon"
            className="text-sidebar-foreground hover:bg-sidebar-accent ml-auto"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-glow"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="border-t border-sidebar-border p-4">
          {!collapsed && (
            <div className="mb-3 px-3">
              <p className="text-xs text-sidebar-foreground/70 truncate">{user?.email}</p>
            </div>
          )}
          <Button
            variant="ghost"
            className={cn(
              "w-full text-sidebar-foreground hover:bg-sidebar-accent",
              collapsed ? "justify-center px-0" : "justify-start"
            )}
            onClick={signOut}
          >
            <LogOut className="h-5 w-5" />
            {!collapsed && <span className="ml-3">Sign Out</span>}
          </Button>
        </div>
      </div>
    </aside>
  );
};
