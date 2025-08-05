import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  BarChart3, 
  Users, 
  FileText, 
  Clock, 
  TrendingUp,
  Calendar,
  Activity,
  Star,
  DollarSign
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RootState, AppDispatch } from '@/store';
import { fetchIssues } from '@/store/slices/issuesSlice';
import TechnicianRatings from '@/components/TechnicianRatings';
import IssueHeatmap from '@/components/IssueHeatmap';
import IssueCalendarHeatmap from '@/components/IssueCalendarHeatmap';
import IssueWeeklyHeatmap from '@/components/IssueWeeklyHeatmap';
import MonthlyReport from '@/components/MonthlyReport';
import RecurringProblemsAlert from '@/components/RecurringProblemsAlert';
import { feedbackAPI } from '@/services/api';

const AdminDashboard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { issues, isLoading, error } = useSelector((state: RootState) => state.issues);
  const { user } = useSelector((state: RootState) => state.auth);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [isLoadingTechnicians, setIsLoadingTechnicians] = useState(false);

  useEffect(() => {
    console.log('AdminDashboard: Fetching issues...');
    dispatch(fetchIssues({}));
  }, [dispatch]);

  useEffect(() => {
    const fetchTechnicianRatings = async () => {
      if (user?.role === 'committee') {
        setIsLoadingTechnicians(true);
        try {
          const data = await feedbackAPI.getTechnicianFeedback();
          setTechnicians(data.data.technicians);
        } catch (error) {
          console.error('Error fetching technician ratings:', error);
        } finally {
          setIsLoadingTechnicians(false);
        }
      }
    };

    fetchTechnicianRatings();
  }, [user?.role]);

  useEffect(() => {
    console.log('AdminDashboard: Issues loaded:', issues);
    console.log('AdminDashboard: User role:', user?.role);
    console.log('AdminDashboard: Loading state:', isLoading);
    console.log('AdminDashboard: Error state:', error);
  }, [issues, user, isLoading, error]);

  const getAnalytics = () => {
    try {
      console.log('AdminDashboard: getAnalytics called with issues:', issues);
      
      if (!Array.isArray(issues) || !issues) {
        console.log('AdminDashboard: issues is not an array or is null, returning default values');
        return {
          total: 0,
          pending: 0,
          inProgress: 0,
          completed: 0,
          assigned: 0,
          categoryStats: {},
          priorityStats: {},
          resolutionRate: 0,
          avgResponseTime: '2.5 hours',
          totalCost: 0,
          averageCost: 0,
          minCost: 0,
          maxCost: 0,
          costCount: 0,
          costByCategory: {}
        };
      }

      const total = issues.length;
      const pending = issues.filter(issue => issue.status === 'new').length;
      const inProgress = issues.filter(issue => issue.status === 'in_progress').length;
      const completed = issues.filter(issue => issue.status === 'resolved' || issue.status === 'closed').length;
      const assigned = issues.filter(issue => issue.status === 'assigned').length;

      const categoryStats = issues.reduce((acc, issue) => {
        if (issue.category) {
          acc[issue.category] = (acc[issue.category] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const priorityStats = issues.reduce((acc, issue) => {
        if (issue.priority) {
          acc[issue.priority] = (acc[issue.priority] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      // Cost analytics
      const issuesWithCost = issues.filter(issue => issue && issue.cost && issue.cost > 0);
      const totalCost = issuesWithCost.reduce((sum, issue) => sum + (issue.cost || 0), 0);
      const averageCost = issuesWithCost.length > 0 ? totalCost / issuesWithCost.length : 0;
      const minCost = issuesWithCost.length > 0 ? Math.min(...issuesWithCost.map(issue => issue.cost || 0)) : 0;
      const maxCost = issuesWithCost.length > 0 ? Math.max(...issuesWithCost.map(issue => issue.cost || 0)) : 0;

      // Cost by category
      const costByCategory = issuesWithCost.reduce((acc, issue) => {
        if (issue && issue.category) {
          if (!acc[issue.category]) {
            acc[issue.category] = { totalCost: 0, count: 0 };
          }
          acc[issue.category].totalCost += issue.cost || 0;
          acc[issue.category].count += 1;
        }
        return acc;
      }, {} as Record<string, { totalCost: number; count: number }>);

      const result = {
        total,
        pending,
        inProgress,
        completed,
        assigned,
        categoryStats,
        priorityStats,
        resolutionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        avgResponseTime: '2.5 hours', // Mock data
        totalCost,
        averageCost,
        minCost,
        maxCost,
        costCount: issuesWithCost.length,
        costByCategory
      };

      console.log('AdminDashboard: Analytics result:', result);
      return result;
    } catch (error) {
      console.error('AdminDashboard: Error in getAnalytics:', error);
      return {
        total: 0,
        pending: 0,
        inProgress: 0,
        completed: 0,
        assigned: 0,
        categoryStats: {},
        priorityStats: {},
        resolutionRate: 0,
        avgResponseTime: '2.5 hours',
        totalCost: 0,
        averageCost: 0,
        minCost: 0,
        maxCost: 0,
        costCount: 0,
        costByCategory: {}
      };
    }
  };

  const getTopCategories = () => {
    const analytics = getAnalytics();
    return Object.entries(analytics.categoryStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  };

  const getRecentIssues = () => {
    try {
      if (!Array.isArray(issues) || !issues) return [];
      const issuesCopy = [...issues].filter(issue => issue && issue.createdAt);
      return issuesCopy
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);
    } catch (error) {
      console.error('AdminDashboard: Error in getRecentIssues:', error);
      return [];
    }
  };

  const handleExportReport = () => {
    try {
      const analytics = getAnalytics();
      const reportData = {
        generatedAt: new Date().toISOString(),
        totalIssues: analytics.total,
        resolutionRate: analytics.resolutionRate,
        statusBreakdown: {
          pending: analytics.pending,
          inProgress: analytics.inProgress,
          completed: analytics.completed,
          assigned: analytics.assigned
        }
      };

      // Create CSV content
      const csvContent = [
        ['Issue Analytics Report'],
        ['Generated At', reportData.generatedAt],
        [''],
        ['Key Metrics'],
        ['Total Issues', analytics.total],
        ['Resolution Rate', `${analytics.resolutionRate}%`],
        ['Pending Issues', analytics.pending],
        ['In Progress', analytics.inProgress],
        ['Completed', analytics.completed],
        ['Assigned', analytics.assigned],
        [''],
        ['Status Breakdown'],
        ['Status', 'Count', 'Percentage'],
        ['Pending', analytics.pending, `${analytics.total > 0 ? Math.round((analytics.pending / analytics.total) * 100) : 0}%`],
        ['In Progress', analytics.inProgress, `${analytics.total > 0 ? Math.round((analytics.inProgress / analytics.total) * 100) : 0}%`],
        ['Completed', analytics.completed, `${analytics.total > 0 ? Math.round((analytics.completed / analytics.total) * 100) : 0}%`],
        ['Assigned', analytics.assigned, `${analytics.total > 0 ? Math.round((analytics.assigned / analytics.total) * 100) : 0}%`],
        [''],
        ['Top Categories'],
        ['Category', 'Count'],
        ...getTopCategories().map(([category, count]) => [category, count]),
        [''],
        ['Recent Issues'],
        ['Title', 'Status', 'Priority', 'Reported By', 'Created At'],
        ...getRecentIssues().map(issue => [
          issue.title,
          issue.status,
          issue.priority,
          issue.reportedByName,
          new Date(issue.createdAt).toLocaleDateString()
        ])
      ].map(row => row.join(',')).join('\n');

      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `issue-analytics-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      console.log('AdminDashboard: Report exported successfully');
    } catch (error) {
      console.error('AdminDashboard: Error exporting report:', error);
      alert('Failed to export report. Please try again.');
    }
  };

  // Show error if there's an issue
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">
          <h3 className="text-lg font-medium">Error loading analytics</h3>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-2 text-muted-foreground">Loading analytics...</p>
      </div>
    );
  }

  // Don't render analytics if data is not ready
  if (!issues || !Array.isArray(issues)) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-2 text-muted-foreground">Loading data...</p>
      </div>
    );
  }

  // Show message if no issues
  if (!Array.isArray(issues) || issues.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
            <p className="text-muted-foreground">
              Overview of society issue management performance
            </p>
          </div>
        </div>
        <div className="text-center py-12">
          <div className="text-muted-foreground">
            <h3 className="text-lg font-medium">No data available</h3>
            <p className="text-sm">No issues have been reported yet.</p>
          </div>
        </div>
      </div>
    );
  }

  let analytics: any;
  try {
    analytics = getAnalytics();
    console.log('AdminDashboard: Analytics calculated:', analytics);
  } catch (error) {
    console.error('AdminDashboard: Error calculating analytics:', error);
    analytics = {
      total: 0,
      pending: 0,
      inProgress: 0,
      completed: 0,
      assigned: 0,
      categoryStats: {},
      priorityStats: {},
      resolutionRate: 0,
      avgResponseTime: '2.5 hours',
      totalCost: 0,
      averageCost: 0,
      minCost: 0,
      maxCost: 0,
      costCount: 0,
      costByCategory: {}
    };
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of society issue management performance
          </p>
        </div>
        <Button onClick={handleExportReport} variant="outline">
          <FileText className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Issues</p>
                <p className="text-2xl font-bold">{analytics.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{analytics.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">{analytics.inProgress}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{analytics.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cost Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
                <p className="text-2xl font-bold">₹{analytics.totalCost.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Cost</p>
                <p className="text-2xl font-bold">₹{analytics.averageCost.toFixed(0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Min Cost</p>
                <p className="text-2xl font-bold">₹{analytics.minCost}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Max Cost</p>
                <p className="text-2xl font-bold">₹{analytics.maxCost}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Issue Status Distribution</CardTitle>
            <CardDescription>
              Breakdown of issues by status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">Pending</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{analytics.pending}</span>
                  <div className="w-24 bg-muted rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${(analytics.pending / analytics.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span className="text-sm">In Progress</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{analytics.inProgress}</span>
                  <div className="w-24 bg-muted rounded-full h-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full" 
                      style={{ width: `${(analytics.inProgress / analytics.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Completed</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{analytics.completed}</span>
                  <div className="w-24 bg-muted rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${(analytics.completed / analytics.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm">Assigned</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{analytics.assigned}</span>
                  <div className="w-24 bg-muted rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full" 
                      style={{ width: `${(analytics.assigned / analytics.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Top Issue Categories</CardTitle>
            <CardDescription>
              Most reported issue types
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {getTopCategories().map(([category, count], index) => (
                <div key={category} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">#{index + 1}</span>
                    <span className="text-sm capitalize">{category}</span>
                  </div>
                  <Badge variant="secondary">{count} issues</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cost by Category */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Cost by Category</CardTitle>
          <CardDescription>
            Total maintenance costs by issue category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(analytics.costByCategory || {})
              .sort(([, a], [, b]) => (b as any).totalCost - (a as any).totalCost)
              .slice(0, 5)
              .map(([category, data], index) => (
                <div key={category} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">#{index + 1}</span>
                    <span className="text-sm capitalize">{category}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">₹{(data as any).totalCost.toLocaleString()}</Badge>
                    <span className="text-xs text-muted-foreground">({(data as any).count} issues)</span>
                  </div>
                </div>
              ))}
            {Object.keys(analytics.costByCategory || {}).length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                <p className="text-sm">No cost data available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Issue Heatmaps */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Issue Heatmaps</h2>
            <p className="text-muted-foreground">
              Visual analysis of issue patterns and trends
            </p>
          </div>
        </div>
        
        <div className="space-y-6">
          <IssueHeatmap issues={issues || []} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <IssueCalendarHeatmap issues={issues || []} />
            <IssueWeeklyHeatmap issues={issues || []} />
          </div>
        </div>
      </div>

      {/* Recurring Problems Alert */}
      <RecurringProblemsAlert />

      {/* Monthly Reports */}
      <MonthlyReport issues={issues || []} />

      {/* Recent Activity */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Recent Issues</CardTitle>
          <CardDescription>
            Latest reported issues in the society
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {getRecentIssues().map((issue) => (
              <div key={issue._id} className="flex items-center space-x-4 p-3 bg-muted rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{issue.title}</p>
                  <p className="text-sm text-muted-foreground">
                    Reported by {issue.reportedByName} • {new Date(issue.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Badge variant="outline" className={`status-${issue.status}`}>
                    {issue.status.replace('_', ' ')}
                  </Badge>
                  <Badge variant="outline" className={`priority-${issue.priority}`}>
                    {issue.priority}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Technician Ratings Section - Only for Committee Members */}
      {user?.role === 'committee' && (
        <div className="space-y-6 mt-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Technician Ratings</h2>
              <p className="text-muted-foreground">
                Monitor technician performance and ratings
              </p>
            </div>
            <Button variant="outline" size="sm">
              <Star className="h-4 w-4 mr-2" />
              View All Ratings
            </Button>
          </div>
          
          <TechnicianRatings 
            technicians={technicians}
            isLoading={isLoadingTechnicians}
          />
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;