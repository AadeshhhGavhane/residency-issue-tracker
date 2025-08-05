import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  FileText, 
  TrendingUp, 
  Users, 
  Clock,
  CheckCircle,
  AlertTriangle,
  Wrench
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RootState, AppDispatch } from '@/store';
import { fetchIssues } from '@/store/slices/issuesSlice';

const Dashboard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { issues } = useSelector((state: RootState) => state.issues);

  useEffect(() => {
    dispatch(fetchIssues({}));
  }, [dispatch]);

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    return `${greeting}, ${user?.name || 'User'}!`;
  };

  const getStatusCounts = () => {
    const issuesArray = Array.isArray(issues) ? issues : [];
    return {
      pending: issuesArray.filter(issue => issue.status === 'new').length,
      inProgress: issuesArray.filter(issue => issue.status === 'in_progress').length,
      completed: issuesArray.filter(issue => issue.status === 'resolved' || issue.status === 'closed').length,
      total: issuesArray.length
    };
  };

  const statusCounts = getStatusCounts();

  const getQuickActions = () => {
    switch (user?.role) {
      case 'resident':
        return [
          {
            title: 'Report New Issue',
            description: 'Submit a new maintenance request',
            icon: Plus,
            href: '/report-issue',
            className: 'bg-gradient-hero text-white'
          },
          {
            title: 'My Issues',
            description: 'Track your reported issues',
            icon: FileText,
            href: '/my-issues',
            className: 'bg-card hover:bg-muted'
          }
        ];
      case 'committee':
        return [
          {
            title: 'Analytics',
            description: 'View system performance',
            icon: TrendingUp,
            href: '/admin-dashboard',
            className: 'bg-gradient-status text-white'
          },
          {
            title: 'All Issues',
            description: 'Manage all society issues',
            icon: FileText,
            href: '/my-issues',
            className: 'bg-card hover:bg-muted'
          },
          {
            title: 'Manage Users',
            description: 'User management',
            icon: Users,
            href: '/manage-users',
            className: 'bg-card hover:bg-muted'
          }
        ];
      case 'technician':
        return [
          {
            title: 'My Assignments',
            description: 'View your work assignments',
            icon: Wrench,
            href: '/technician-dashboard',
            className: 'bg-gradient-hero text-white'
          }
        ];
      default:
        return [];
    }
  };

  const quickActions = getQuickActions();

  // Safe role display with fallback
  const displayRole = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Section */}
      <div className="bg-gradient-card rounded-lg p-6 shadow-card">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {getWelcomeMessage()}
        </h1>
        <p className="text-muted-foreground">
          Welcome to your Society Tracker dashboard. Here's what's happening today.
        </p>
        <div className="flex items-center space-x-2 mt-4">
          <Badge variant="outline" className={user?.role === 'committee' ? 'bg-gradient-status text-white' : ''}>
            {displayRole}
          </Badge>
          {user?.apartmentNumber && (
            <Badge variant="secondary">
              {user.apartmentNumber}
            </Badge>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Issues</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.total}</div>
            <p className="text-xs text-muted-foreground">
              All time issues
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{statusCounts.pending}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting assignment
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <AlertTriangle className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-info">{statusCounts.inProgress}</div>
            <p className="text-xs text-muted-foreground">
              Being worked on
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{statusCounts.completed}</div>
            <p className="text-xs text-muted-foreground">
              Successfully resolved
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Link key={action.title} to={action.href}>
              <Card className={`shadow-card hover:shadow-elevated transition-shadow cursor-pointer ${action.className}`}>
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <action.icon className="h-6 w-6" />
                    <div>
                      <CardTitle className="text-lg">{action.title}</CardTitle>
                      <CardDescription className={action.className.includes('text-white') ? 'text-white/80' : ''}>
                        {action.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest updates from your society
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.isArray(issues) && issues.slice(0, 5).map((issue) => (
              <div key={issue._id} className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{issue.title}</p>
                  <p className="text-sm text-muted-foreground">
                    Reported by {issue.reportedByName} • {new Date(issue.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Badge className={`status-${issue.status}`}>
                  {issue.status}
                </Badge>
              </div>
            ))}
            {(!Array.isArray(issues) || issues.length === 0) && (
              <p className="text-center text-muted-foreground py-8">
                No recent activity to show
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;