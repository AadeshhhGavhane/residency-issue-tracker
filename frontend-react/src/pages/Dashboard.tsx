import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  Users, 
  FileText,
  Plus,
  Eye,
  BarChart3,
  Wrench,
  Globe
} from 'lucide-react';
import { RootState, AppDispatch } from '@/store';
import { fetchIssues } from '@/store/slices/issuesSlice';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import GoogleTranslate from '@/components/GoogleTranslate';

interface Issue {
  _id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category?: string;
  cost?: number;
  createdAt: string;
}

const Dashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { issues, isLoading, error } = useSelector((state: RootState) => state.issues);
  const { user } = useSelector((state: RootState) => state.auth);
  const { t, i18n } = useTranslation();
  
  const [translatedIssues, setTranslatedIssues] = useState<{[key: string]: any}>({});
  const [isTranslating, setIsTranslating] = useState(false);

  // Translation function using Google Translate API (you can replace with your preferred service)
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

  // Function to translate all issues when language changes
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

  // Language toggle function
  const toggleLanguage = async () => {
    const newLang = i18n.language === 'en' ? 'hi' : 'en';
    i18n.changeLanguage(newLang);
    
    // Translate issues when switching to Hindi
    if (newLang === 'hi' && issues.length > 0) {
      await translateIssues(issues);
    }
  };

  // Helper function to get translated content
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

  useEffect(() => {
    dispatch(fetchIssues({}));
  }, [dispatch]);

  // Translate issues when they are loaded and language is Hindi
  useEffect(() => {
    if (issues.length > 0 && i18n.language === 'hi') {
      translateIssues(issues);
    }
  }, [issues, i18n.language]);

  // Helper function to get translated text with English fallback
  const getText = (key: string, fallback: string) => {
    const translated = t(key);
    return translated === key ? fallback : translated;
  };

  const getAnalytics = () => {
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
  };

  const analytics = getAnalytics();

  const getTopCategories = () => {
    const categories = Object.entries(analytics.categoryStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
    return categories;
  };

  // Pagination state for lazy loading
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(3);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const getRecentIssues = () => {
    if (!Array.isArray(issues) || !issues) return [];
    const sortedIssues = [...issues]
      .sort((a: Issue, b: Issue) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return sortedIssues.slice(0, currentPage * itemsPerPage);
  };

  const hasMoreIssues = () => {
    if (!Array.isArray(issues) || !issues) return false;
    return issues.length > currentPage * itemsPerPage;
  };

  // Load more function
  const loadMore = useCallback(() => {
    if (hasMoreIssues() && !isLoadingMore) {
      setIsLoadingMore(true);
      setTimeout(() => {
        setCurrentPage(prev => prev + 1);
        setIsLoadingMore(false);
      }, 500);
    }
  }, [hasMoreIssues, isLoadingMore]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMoreIssues() && !isLoadingMore) {
          loadMore();
        }
      },
      {
        root: null,
        rootMargin: '100px',
        threshold: 0.1
      }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [hasMoreIssues, isLoadingMore, loadMore]);

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

  // Status translation helper
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

  // Priority translation helper
  const getPriorityText = (priority: string) => {
    const priorityMap: {[key: string]: string} = {
      'low': 'Low',
      'medium': 'Medium',
      'high': 'High',
      'urgent': 'Urgent'
    };
    return getText(`priority.${priority}`, priorityMap[priority] || priority);
  };

  if (isLoading || isTranslating) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="ml-4 text-muted-foreground">
          {isTranslating ? (i18n.language === 'hi' ? 'अनुवाद हो रहा है...' : 'Translating...') : getText('common.loading', 'Loading...')}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600">
        {getText('errors.general', 'Error')}: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Section */}
      <div className="bg-gradient-hero rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              {getText('dashboard.welcome', 'Welcome')}, {user?.name || getText('common.user', 'User')}!
            </h1>
            <p className="text-white/90">
              {getText('dashboard.welcomeMessage', 'Manage and track community issues efficiently')}
            </p>
          </div>
          {/* Google Translate Component */}
          <GoogleTranslate />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/report-issue">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Plus className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-semibold">{getText('navigation.reportIssue', 'Report Issue')}</h3>
                  <p className="text-sm text-muted-foreground">{getText('dashboard.reportNewIssue', 'Report a new issue')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/my-issues">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-blue-600" />
                <div>
                  <h3 className="font-semibold">{getText('navigation.myIssues', 'My Issues')}</h3>
                  <p className="text-sm text-muted-foreground">{getText('dashboard.viewMyIssues', 'View your issues')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {user?.role === 'committee' && (
          <Link to="/admin-dashboard">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <BarChart3 className="h-8 w-8 text-green-600" />
                  <div>
                    <h3 className="font-semibold">{getText('navigation.analytics', 'Analytics')}</h3>
                    <p className="text-sm text-muted-foreground">{getText('dashboard.viewAnalytics', 'View analytics')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}

        {user?.role === 'technician' && (
          <Link to="/technician-dashboard">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Wrench className="h-8 w-8 text-orange-600" />
                  <div>
                    <h3 className="font-semibold">{getText('navigation.myAssignments', 'My Assignments')}</h3>
                    <p className="text-sm text-muted-foreground">{getText('dashboard.viewAssignments', 'View assignments')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{getText('dashboard.totalIssues', 'Total Issues')}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.total}</div>
            <p className="text-xs text-muted-foreground">
              {getText('dashboard.totalIssuesDescription', 'All reported issues')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{getText('dashboard.pendingIssues', 'Pending Issues')}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.pending}</div>
            <p className="text-xs text-muted-foreground">
              {getText('dashboard.pendingIssuesDescription', 'Awaiting assignment')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{getText('dashboard.resolvedIssues', 'Resolved Issues')}</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.completed}</div>
            <p className="text-xs text-muted-foreground">
              {getText('dashboard.resolvedIssuesDescription', 'Successfully resolved')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{getText('dashboard.resolutionRate', 'Resolution Rate')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.resolutionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {getText('dashboard.resolutionRateDescription', 'Completion percentage')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Issues */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>{getText('dashboard.recentIssues', 'Recent Issues')}</span>
          </CardTitle>
          <CardDescription>{getText('dashboard.recentIssuesDescription', 'Latest reported issues in your community')}</CardDescription>
        </CardHeader>
        <CardContent>
          {getRecentIssues().length > 0 ? (
            <>
              <div className="space-y-3">
                {getRecentIssues().map((issue: Issue) => {
                  const translatedIssue = getTranslatedIssue(issue);
                  return (
                    <div key={issue._id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{translatedIssue.title}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">{translatedIssue.description}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge className={getStatusBadgeClass(issue.status)}>
                            {getStatusText(issue.status)}
                          </Badge>
                          <Badge className={getPriorityBadgeClass(issue.priority)}>
                            {getPriorityText(issue.priority)}
                          </Badge>
                        </div>
                      </div>
                      <Link to={`/my-issues`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          {getText('common.view', 'View')}
                        </Button>
                      </Link>
                    </div>
                  );
                })}
              </div>

              {/* Load More Section */}
              {hasMoreIssues() && (
                <div ref={loadMoreRef} className="text-center py-6">
                  {isLoadingMore ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      <span className="text-muted-foreground">Loading more issues...</span>
                    </div>
                  ) : (
                    <Button 
                      variant="outline" 
                      onClick={loadMore}
                      className="hover:bg-primary hover:text-white transition-all duration-200"
                    >
                      Load More Issues
                    </Button>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{getText('dashboard.noRecentIssues', 'No recent issues to display')}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;