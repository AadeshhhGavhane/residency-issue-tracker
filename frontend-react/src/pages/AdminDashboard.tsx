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
  DollarSign,
  Globe
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
import { useTranslation } from 'react-i18next';

interface Issue {
  _id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category?: string;
  cost?: number;
  createdAt: string;
  reportedByName?: string;
}

const AdminDashboard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { issues, isLoading, error } = useSelector((state: RootState) => state.issues);
  const { user } = useSelector((state: RootState) => state.auth);
  const { t, i18n } = useTranslation();
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [isLoadingTechnicians, setIsLoadingTechnicians] = useState(false);
  
  // Translation states using the same approach as Dashboard
  const [translatedIssues, setTranslatedIssues] = useState<{[key: string]: any}>({});
  const [isTranslating, setIsTranslating] = useState(false);

  // Translation function using Google Translate API (same as Dashboard)
  const translateText = async (text: string, targetLang: string) => {
    if (!text || targetLang === 'en') return text;
    
    try {
      // Using a free translation service - replace with your preferred API
      const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`);
      const data = await response.json();
      return data.responseData.translatedText || text;
    } catch (error) {
      console.error('Translation error:', error);
      return text; // Return original text if translation fails
    }
  };

  // Function to translate all issues when language changes (same as Dashboard)
  const translateIssues = async (issuesData: any[]) => {
    if (i18n.language === 'en') {
      setTranslatedIssues({});
      return;
    }

    setIsTranslating(true);
    const translations: {[key: string]: any} = {};

    for (const issue of issuesData) {
      try {
        const [translatedTitle, translatedDescription] = await Promise.all([
          translateText(issue.title, 'hi'),
          translateText(issue.description, 'hi')
        ]);

        translations[issue._id] = {
          title: translatedTitle,
          description: translatedDescription
        };
      } catch (error) {
        console.error(`Error translating issue ${issue._id}:`, error);
        translations[issue._id] = {
          title: issue.title,
          description: issue.description
        };
      }
    }

    setTranslatedIssues(translations);
    setIsTranslating(false);
  };

  // Language toggle function (same as Dashboard)
  const toggleLanguage = async () => {
    const newLang = i18n.language === 'en' ? 'hi' : 'en';
    i18n.changeLanguage(newLang);
    
    // Translate issues when switching to Hindi
    if (newLang === 'hi' && issues.length > 0) {
      await translateIssues(issues);
    }
  };

  // Helper function to get translated content (same as Dashboard)
  const getTranslatedIssue = (issue: any) => {
    if (i18n.language === 'hi' && translatedIssues[issue._id]) {
      return {
        ...issue,
        title: translatedIssues[issue._id].title,
        description: translatedIssues[issue._id].description
      };
    }
    return issue;
  };

  // Helper function to get translated text with English fallback (same as Dashboard)
  const getText = (key: string, fallback: string) => {
    const translated = t(key);
    return translated === key ? fallback : translated;
  };

  useEffect(() => {
    console.log('AdminDashboard: Fetching issues...');
    dispatch(fetchIssues({}));
  }, [dispatch]);

  // Translate issues when they are loaded and language is Hindi (same as Dashboard)
  useEffect(() => {
    if (issues.length > 0 && i18n.language === 'hi') {
      translateIssues(issues);
    }
  }, [issues, i18n.language]);

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

  const getAnalytics = () => {
    try {
      if (!Array.isArray(issues) || !issues) {
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
      const pending = issues.filter((issue: Issue) => issue.status === 'new').length;
      const inProgress = issues.filter((issue: Issue) => issue.status === 'in_progress').length;
      const completed = issues.filter((issue: Issue) => issue.status === 'resolved' || issue.status === 'closed').length;
      const assigned = issues.filter((issue: Issue) => issue.status === 'assigned').length;

      const categoryStats = issues.reduce((acc: Record<string, number>, issue: Issue) => {
        if (issue.category) {
          acc[issue.category] = (acc[issue.category] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const priorityStats = issues.reduce((acc: Record<string, number>, issue: Issue) => {
        if (issue.priority) {
          acc[issue.priority] = (acc[issue.priority] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      // Cost analytics
      const issuesWithCost = issues.filter((issue: Issue) => issue && issue.cost && issue.cost > 0);
      const totalCost = issuesWithCost.reduce((sum: number, issue: Issue) => sum + (issue.cost || 0), 0);
      const averageCost = issuesWithCost.length > 0 ? totalCost / issuesWithCost.length : 0;
      const minCost = issuesWithCost.length > 0 ? Math.min(...issuesWithCost.map((issue: Issue) => issue.cost || 0)) : 0;
      const maxCost = issuesWithCost.length > 0 ? Math.max(...issuesWithCost.map((issue: Issue) => issue.cost || 0)) : 0;

      // Cost by category
      const costByCategory = issuesWithCost.reduce((acc: Record<string, { totalCost: number; count: number }>, issue: Issue) => {
        if (issue && issue.category) {
          if (!acc[issue.category]) {
            acc[issue.category] = { totalCost: 0, count: 0 };
          }
          acc[issue.category].totalCost += issue.cost || 0;
          acc[issue.category].count += 1;
        }
        return acc;
      }, {} as Record<string, { totalCost: number; count: number }>);

      return {
        total,
        pending,
        inProgress,
        completed,
        assigned,
        categoryStats,
        priorityStats,
        resolutionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        avgResponseTime: '2.5 hours',
        totalCost,
        averageCost,
        minCost,
        maxCost,
        costCount: issuesWithCost.length,
        costByCategory
      };
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
      const issuesCopy = [...issues].filter((issue: Issue) => issue && issue.createdAt);
      return issuesCopy
        .sort((a: Issue, b: Issue) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);
    } catch (error) {
      console.error('AdminDashboard: Error in getRecentIssues:', error);
      return [];
    }
  };

  // Status translation helper (same as Dashboard)
  const getStatusText = (status: string) => {
    const statusMap: {[key: string]: string} = {
      'new': 'New',
      'assigned': 'Assigned',
      'in_progress': 'In Progress',
      'resolved': 'Resolved',
      'closed': 'Closed'
    };
    return getText(`status.${status}`, statusMap[status] || status);
  };

  // Priority translation helper (same as Dashboard)
  const getPriorityText = (priority: string) => {
    const priorityMap: {[key: string]: string} = {
      'low': 'Low',
      'medium': 'Medium',
      'high': 'High',
      'urgent': 'Urgent'
    };
    return getText(`priority.${priority}`, priorityMap[priority] || priority);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'assigned':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-orange-100 text-orange-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
        ...getRecentIssues().map((issue: Issue) => [
          issue.title,
          issue.status,
          issue.priority,
          issue.reportedByName,
          new Date(issue.createdAt).toLocaleDateString()
        ])
      ].map(row => row.join(',')).join('\n');

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

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">
          <h3 className="text-lg font-medium">{getText('errors.general', 'Error loading analytics')}</h3>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (isLoading || isTranslating) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="ml-4 text-muted-foreground">
          {isTranslating ? (i18n.language === 'hi' ? 'अनुवाद हो रहा है...' : 'Translating...') : getText('common.loading', 'Loading analytics...')}
        </p>
      </div>
    );
  }

  if (!issues || !Array.isArray(issues)) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-2 text-muted-foreground">{getText('common.loading', 'Loading data...')}</p>
      </div>
    );
  }

  if (!Array.isArray(issues) || issues.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">{getText('dashboard.analyticsTitle', 'Analytics Dashboard')}</h1>
            <p className="text-muted-foreground">
              {getText('dashboard.analyticsDescription', 'Comprehensive overview of community issues')}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleLanguage}
            className="flex items-center gap-2"
          >
            <Globe className="h-4 w-4" />
            {i18n.language === 'en' ? 'हिंदी' : 'English'}
          </Button>
        </div>
        <div className="text-center py-12">
          <div className="text-muted-foreground">
            <h3 className="text-lg font-medium">{getText('dashboard.noData', 'No Data Available')}</h3>
            <p className="text-sm">{getText('dashboard.noIssues', 'No issues have been reported yet.')}</p>
          </div>
        </div>
      </div>
    );
  }

  const analytics = getAnalytics();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{getText('dashboard.analyticsTitle', 'Analytics Dashboard')}</h1>
          <p className="text-muted-foreground">
            {getText('dashboard.analyticsDescription', 'Comprehensive overview of community issues')}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleLanguage}
            className="flex items-center gap-2"
            disabled={isTranslating}
          >
            <Globe className="h-4 w-4" />
            {i18n.language === 'en' ? 'हिंदी' : 'English'}
          </Button>
          
          <Button onClick={handleExportReport} variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            {getText('dashboard.exportReport', 'Export Report')}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">{getText('dashboard.totalIssues', 'Total Issues')}</p>
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
                <p className="text-sm font-medium text-muted-foreground">{getText('dashboard.pendingIssues', 'Pending Issues')}</p>
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
                <p className="text-sm font-medium text-muted-foreground">{getText('dashboard.inProgress', 'In Progress')}</p>
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
                <p className="text-sm font-medium text-muted-foreground">{getText('dashboard.completedIssues', 'Completed')}</p>
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
                <p className="text-sm font-medium text-muted-foreground">{getText('dashboard.totalCost', 'Total Cost')}</p>
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
                <p className="text-sm font-medium text-muted-foreground">{getText('dashboard.averageCost', 'Average Cost')}</p>
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
                <p className="text-sm font-medium text-muted-foreground">{getText('dashboard.minCost', 'Min Cost')}</p>
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
                <p className="text-sm font-medium text-muted-foreground">{getText('dashboard.maxCost', 'Max Cost')}</p>
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
            <CardTitle>{getText('dashboard.statusDistribution', 'Issue Status Distribution')}</CardTitle>
            <CardDescription>
              {getText('dashboard.statusBreakdown', 'Breakdown of issues by status')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">{getText('dashboard.pendingStatus', 'Pending')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{analytics.pending}</span>
                  <div className="w-24 bg-muted rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${analytics.total > 0 ? (analytics.pending / analytics.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span className="text-sm">{getText('dashboard.inProgressStatus', 'In Progress')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{analytics.inProgress}</span>
                  <div className="w-24 bg-muted rounded-full h-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full" 
                      style={{ width: `${analytics.total > 0 ? (analytics.inProgress / analytics.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">{getText('dashboard.completedStatus', 'Completed')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{analytics.completed}</span>
                  <div className="w-24 bg-muted rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${analytics.total > 0 ? (analytics.completed / analytics.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm">{getText('dashboard.assignedStatus', 'Assigned')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{analytics.assigned}</span>
                  <div className="w-24 bg-muted rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full" 
                      style={{ width: `${analytics.total > 0 ? (analytics.assigned / analytics.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>{getText('dashboard.topCategories', 'Top Issue Categories')}</CardTitle>
            <CardDescription>
              {getText('dashboard.topCategoriesDesc', 'Most reported issue types')}
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
                  <Badge variant="secondary">{count} {getText('dashboard.issuesLabel', 'issues')}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cost by Category */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>{getText('dashboard.costByCategory', 'Cost by Category')}</CardTitle>
          <CardDescription>
            {getText('dashboard.costByCategoryDesc', 'Total maintenance costs by issue category')}
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
                    <span className="text-xs text-muted-foreground">({(data as any).count} {getText('dashboard.issuesLabel', 'issues')})</span>
                  </div>
                </div>
              ))}
            {Object.keys(analytics.costByCategory || {}).length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                <p className="text-sm">{getText('dashboard.noCostData', 'No cost data available')}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Issue Heatmaps */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{getText('dashboard.issueHeatmaps', 'Issue Heatmaps')}</h2>
            <p className="text-muted-foreground">
              {getText('dashboard.heatmapsDesc', 'Visual analysis of issue patterns and trends')}
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
          <CardTitle>{getText('dashboard.recentIssues', 'Recent Issues')}</CardTitle>
          <CardDescription>
            {getText('dashboard.recentIssuesDescription', 'Latest reported issues in the society')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {getRecentIssues().map((issue: Issue) => {
              const translatedIssue = getTranslatedIssue(issue);
              return (
                <div key={issue._id} className="flex items-center space-x-4 p-3 bg-muted rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{translatedIssue.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {getText('dashboard.reportedBy', 'Reported by')} {issue.reportedByName} • {new Date(issue.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Badge className={getStatusBadgeClass(issue.status)}>
                      {getStatusText(issue.status)}
                    </Badge>
                    <Badge className={getPriorityBadgeClass(issue.priority)}>
                      {getPriorityText(issue.priority)}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Technician Ratings Section - Only for Committee Members */}
      {user?.role === 'committee' && (
        <div className="space-y-6 mt-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{getText('dashboard.technicianRatings', 'Technician Ratings')}</h2>
              <p className="text-muted-foreground">
                {getText('dashboard.technicianRatingsDesc', 'Monitor technician performance and ratings')}
              </p>
            </div>
            
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