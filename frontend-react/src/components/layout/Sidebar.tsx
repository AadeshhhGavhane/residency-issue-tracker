import { Link, useLocation } from 'react-router-dom';
import { 
  Home,
  FileText,
  Plus,
  BarChart3,
  Wrench,
  Users,
  X 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: string;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, userRole }) => {
  const location = useLocation();
  const { t } = useTranslation();

  const getMenuItems = () => {
    // Only add dashboard for non-technician users
    const baseItems = userRole !== 'technician' 
      ? [{ icon: Home, label: t('navigation.dashboard'), path: '/dashboard' }]
      : [];

    const roleSpecificItems = {
      resident: [
        { icon: Plus, label: t('navigation.reportIssue'), path: '/report-issue' },
        { icon: FileText, label: t('navigation.myIssues'), path: '/my-issues' },
      ],
      committee: [
        { icon: Plus, label: t('navigation.reportIssue'), path: '/report-issue' },
        { icon: FileText, label: t('navigation.allIssues'), path: '/my-issues' },
        { icon: BarChart3, label: t('navigation.analytics'), path: '/admin-dashboard' },
      ],
      technician: [
        { icon: Wrench, label: t('navigation.myAssignments'), path: '/technician-dashboard' },
      ],
    };

    return [
      ...baseItems,
      ...(roleSpecificItems[userRole as keyof typeof roleSpecificItems] || []),
    ];
  };

  const menuItems = getMenuItems();

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-card border-r border-border z-40 transform transition-transform duration-300 ease-in-out md:relative md:transform-none md:top-0 md:h-full md:block",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="h-full flex flex-col">
          {/* Close button for mobile */}
          <div className="flex justify-end p-4 md:hidden">
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-glow"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <div className="text-center text-xs text-muted-foreground">
              {t('common.societyTracker')} v1.0
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;