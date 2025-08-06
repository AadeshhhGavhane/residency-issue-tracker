import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, User, LogOut, Settings, Bell, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { RootState, AppDispatch } from '@/store';
import { logout } from '@/store/slices/authSlice';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import ChatWidget from '@/components/ChatWidget';
import { useTranslation } from 'react-i18next';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const { t } = useTranslation();

  // Demo notifications with translations
  const notifications = [
    {
      id: 1,
      type: 'success',
      title: t('notifications.issueResolved'),
      message: t('notifications.waterLeakageFixed'),
      time: t('notifications.twoHoursAgo'),
      icon: CheckCircle
    },
    {
      id: 2,
      type: 'warning',
      title: t('notifications.newIssueReported'),
      message: t('notifications.electricalProblemReported'),
      time: t('notifications.fourHoursAgo'),
      icon: AlertTriangle
    },
    {
      id: 3,
      type: 'info',
      title: t('notifications.systemUpdate'),
      message: t('notifications.newFeaturesAvailable'),
      time: t('notifications.oneDayAgo'),
      icon: Info
    }
  ];

  const unreadCount = notifications.length;

  const handleLogout = async () => {
    try {
      console.log('Logging out...');
      const result = await dispatch(logout());
      console.log('Logout result:', result);
      
      if (result.meta.requestStatus === 'fulfilled') {
        console.log('Logout successful, redirecting to login');
        // Force refresh to clear any cached state
        window.location.href = '/login';
      } else {
        console.error('Logout failed:', result.payload);
        // Even if logout fails, redirect to login
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, redirect to login
      window.location.href = '/login';
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'committee':
        return 'bg-gradient-status text-white';
      case 'technician':
        return 'bg-info text-info-foreground';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  // Safe role display with fallback
  const displayRole = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User';
  const userInitials = user?.name ? user.name.slice(0, 2).toUpperCase() : 'U';

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return CheckCircle;
      case 'warning':
        return AlertTriangle;
      default:
        return Info;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      default:
        return 'text-blue-600';
    }
  };

  return (
    <header className="bg-card border-b border-border shadow-card sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Menu and Logo */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onMenuClick}
              className="md:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">ST</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">{t('common.societyTracker')}</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  {t('common.issueManagementSystem')}
                </p>
              </div>
            </Link>
          </div>

          {/* Right side - User menu */}
          <div className="flex items-center space-x-4">
            {/* Language Switcher */}
            <LanguageSwitcher />
            
            {/* Chat Widget */}
            <ChatWidget />
            
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative">
                  
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="p-2">
                  <h4 className="font-medium mb-2">Notifications</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {notifications.map((notification) => {
                      const Icon = getNotificationIcon(notification.type);
                      return (
                        <div
                          key={notification.id}
                          className="flex items-start space-x-3 p-2 rounded-lg hover:bg-muted transition-colors"
                        >
                          <Icon className={`h-4 w-4 mt-0.5 ${getNotificationColor(notification.type)}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{notification.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {notification.time}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 h-auto p-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.profilePicture} alt={user?.name || 'User'} />
                    <AvatarFallback>
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left hidden sm:block">
                    <p className="text-sm font-medium">{user?.name || 'User'}</p>
                    <Badge className={`text-xs ${getRoleBadgeColor(user?.role || 'resident')}`}>
                      {displayRole}
                    </Badge>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>{t('navigation.profile')}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>{t('auth.logout')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;