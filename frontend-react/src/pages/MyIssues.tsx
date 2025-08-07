import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Filter, 
  Eye, 
  Trash2, 
  UserPlus, 
  Star, 
  Clock, 
  MapPin, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Edit,
  User,
  Calendar,
  Globe,
  ChevronDown
} from 'lucide-react';
import { RootState, AppDispatch } from '@/store';
import { 
  fetchIssues, 
  deleteIssue, 
  assignIssue, 
  setFilters, 
  setSelectedIssue
} from '@/store/slices/issuesSlice';
import { openModal, closeModal } from '@/store/slices/uiSlice';
import { issuesAPI } from '@/services/api';
import FeedbackModal from '@/components/FeedbackModal';
import GoogleTranslate from '@/components/GoogleTranslate';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const MyIssues = () => {
  const { t, i18n } = useTranslation();
  
  // Add CSS animation for fade-in effect
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { issues, isLoading, selectedIssue, filters } = useSelector((state: RootState) => state.issues);
  const { modals } = useSelector((state: RootState) => state.ui);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [issueToDelete, setIssueToDelete] = useState<any>(null);
  const [issueToAssign, setIssueToAssign] = useState<any>(null);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [loadingButtons, setLoadingButtons] = useState<{[key: string]: boolean}>({});
  const [assignmentData, setAssignmentData] = useState({
    technicianId: '',
    estimatedTime: '',
    notes: '',
    paymentAmount: ''
  });
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [selectedIssueForFeedback, setSelectedIssueForFeedback] = useState<any>(null);
  const [translatedIssues, setTranslatedIssues] = useState<{[key: string]: any}>({});
  const [isTranslating, setIsTranslating] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(3);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  
  // Performance optimization refs
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const translationCache = useRef<Map<string, string>>(new Map());

  // Translation function using Google Translate API (you can replace with your preferred service)
  const translateText = async (text: string, targetLang: string) => {
    if (!text || targetLang === 'en') return text;
    
    // Check cache first
    const cacheKey = `${text}_${targetLang}`;
    if (translationCache.current.has(cacheKey)) {
      return translationCache.current.get(cacheKey);
    }
    
    try {
      // Using a free translation service - replace with your preferred API
      const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`);
      const data = await response.json();
      const translatedText = data.responseData.translatedText || text;
      
      // Cache the result
      translationCache.current.set(cacheKey, translatedText);
      
      return translatedText;
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

  // Filter and search issues
  const filteredIssues = useMemo(() => {
    let filtered = [...issues];

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(issue => {
        const translatedIssue = getTranslatedIssue(issue);
        return (
          translatedIssue.title.toLowerCase().includes(searchLower) ||
          translatedIssue.description.toLowerCase().includes(searchLower) ||
          issue.category.toLowerCase().includes(searchLower) ||
          issue.status.toLowerCase().includes(searchLower) ||
          issue.priority.toLowerCase().includes(searchLower) ||
          (issue.reportedByName && issue.reportedByName.toLowerCase().includes(searchLower)) ||
          (issue.assignedToName && issue.assignedToName.toLowerCase().includes(searchLower))
        );
      });
    }

    return filtered;
  }, [issues, searchTerm, translatedIssues, i18n.language]);

  // Paginated issues for display with performance optimization
  const paginatedIssues = useMemo(() => {
    const startIndex = 0;
    const endIndex = currentPage * itemsPerPage;
    const paginated = filteredIssues.slice(startIndex, endIndex);
    
    // Pre-compute translated issues for better performance
    if (i18n.language === 'hi') {
      paginated.forEach(issue => {
        if (!translatedIssues[issue._id]) {
          // Pre-translate titles and descriptions for better UX
          translateText(issue.title, 'hi').then(translatedTitle => {
            translateText(issue.description, 'hi').then(translatedDescription => {
              setTranslatedIssues(prev => ({
                ...prev,
                [issue._id]: {
                  title: translatedTitle,
                  description: translatedDescription
                }
              }));
            });
          });
        }
      });
    }
    
    return paginated;
  }, [filteredIssues, currentPage, itemsPerPage, i18n.language, translatedIssues]);

  // Update hasMore separately to avoid re-renders
  useEffect(() => {
    const endIndex = currentPage * itemsPerPage;
    setHasMore(endIndex < filteredIssues.length);
  }, [filteredIssues.length, currentPage, itemsPerPage]);

  useEffect(() => {
    dispatch(fetchIssues(filters));
  }, [dispatch, filters]);

  // Translate issues when they are loaded and language is Hindi
  useEffect(() => {
    if (issues.length > 0 && i18n.language === 'hi') {
      translateIssues(issues);
    }
  }, [issues, i18n.language]);

  // Optimize translation loading for paginated issues
  useEffect(() => {
    if (paginatedIssues.length > 0 && i18n.language === 'hi') {
      // Only translate the newly loaded issues that haven't been translated
      const newIssues = paginatedIssues.filter(issue => !translatedIssues[issue._id]);
      if (newIssues.length > 0) {
        // Limit concurrent translations to avoid overwhelming the API
        const batchSize = 3;
        const batches = [];
        for (let i = 0; i < newIssues.length; i += batchSize) {
          batches.push(newIssues.slice(i, i + batchSize));
        }
        
        // Process batches with delay to avoid rate limiting
        batches.forEach((batch, index) => {
          setTimeout(() => {
            translateIssues(batch);
          }, index * 200); // 200ms delay between batches
        });
      }
    }
  }, [paginatedIssues, i18n.language]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Debounce search to avoid excessive API calls
    searchTimeoutRef.current = setTimeout(() => {
      dispatch(setFilters({ search: value }));
    }, 300);
  };

  const handleFilterChange = (key: string, value: string) => {
    dispatch(setFilters({ [key]: value === 'all' ? undefined : value }));
  };

  const handleViewIssue = async (issue: any) => {
    try {
      const data = await issuesAPI.getIssue(issue._id);
      dispatch(setSelectedIssue(data.data.issue));
      dispatch(openModal('issueDetails'));
    } catch (error) {
      console.error('Error fetching issue details:', error);
    }
  };

  const handleDeleteIssue = (issue: any) => {
    setIssueToDelete(issue);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!issueToDelete) return;
    
    setIsDeleting(true);
    setLoadingButtons(prev => ({ ...prev, [`delete-${issueToDelete._id}`]: true }));
    try {
      await dispatch(deleteIssue(issueToDelete._id));
      setDeleteDialogOpen(false);
      setIssueToDelete(null);
    } catch (error) {
      console.error('Error deleting issue:', error);
    } finally {
      setIsDeleting(false);
      setLoadingButtons(prev => ({ ...prev, [`delete-${issueToDelete._id}`]: false }));
    }
  };

  const handleAssignIssue = async (issue: any) => {
    setIssueToAssign(issue);
    setLoadingButtons(prev => ({ ...prev, [`assign-${issue._id}`]: true }));
    
    try {
      const data = await issuesAPI.getTechnicians();
      setTechnicians(data.data.technicians);
      setAssignDialogOpen(true);
    } catch (error) {
      console.error('Error fetching technicians:', error);
    } finally {
      setLoadingButtons(prev => ({ ...prev, [`assign-${issue._id}`]: false }));
    }
  };

  const confirmAssign = async () => {
    if (!issueToAssign || !assignmentData.technicianId || !assignmentData.estimatedTime) {
      alert(t('alerts.fillRequiredFields') || 'Please fill in all required fields');
      return;
    }

    setIsAssigning(true);
    try {
      const assignData = {
        technicianId: assignmentData.technicianId,
        estimatedCompletionTime: parseInt(assignmentData.estimatedTime),
        assignmentNotes: assignmentData.notes,
        paymentAmount: assignmentData.paymentAmount && assignmentData.paymentAmount.trim() !== '' ? parseFloat(assignmentData.paymentAmount) : undefined
      };
      
      await dispatch(assignIssue({
        issueId: issueToAssign._id,
        data: assignData
      }));
      
      setAssignDialogOpen(false);
      setIssueToAssign(null);
      setAssignmentData({ technicianId: '', estimatedTime: '', notes: '', paymentAmount: '' });
    } catch (error) {
      console.error('Error assigning issue:', error);
    } finally {
      setIsAssigning(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'new':
        return 'status-pending';
      case 'assigned':
        return 'status-in-progress';
      case 'in_progress':
        return 'status-in-progress';
      case 'resolved':
        return 'status-completed';
      case 'closed':
        return 'status-completed';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'priority-low';
      case 'medium':
        return 'priority-medium';
      case 'high':
        return 'priority-high';
      case 'urgent':
        return 'priority-urgent';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(i18n.language === 'hi' ? 'hi-IN' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const specializationLabels = {
    'sanitation': t('categories.sanitation') || 'Sanitation',
    'security': t('categories.security') || 'Security',
    'water': t('categories.water') || 'Water',
    'electricity': t('categories.electricity') || 'Electricity',
    'elevator': t('categories.elevator') || 'Elevator',
    'noise': t('categories.noise') || 'Noise',
    'parking': t('categories.parking') || 'Parking',
    'maintenance': t('categories.maintenance') || 'Maintenance',
    'cleaning': t('categories.cleaning') || 'Cleaning',
    'pest_control': t('categories.pest_control') || 'Pest Control',
    'landscaping': t('categories.landscaping') || 'Landscaping',
    'fire_safety': t('categories.fire_safety') || 'Fire Safety',
    'other': t('categories.other') || 'Other'
  };

  // Helper function to get translated text with English fallback
  const getText = (key: string, fallback: string) => {
    const translated = t(key);
    return translated === key ? fallback : translated;
  };

  // Category translation helper
  const getCategoryText = (category: string) => {
    const key = `categories.${category}`;
    const translated = t(key);
    if (translated === key) {
      // Return English category name if translation key not found
      const categoryMap: {[key: string]: string} = {
        'sanitation': 'Sanitation',
        'security': 'Security',
        'water': 'Water',
        'electricity': 'Electricity',
        'elevator': 'Elevator',
        'noise': 'Noise',
        'parking': 'Parking',
        'maintenance': 'Maintenance',
        'cleaning': 'Cleaning',
        'pest_control': 'Pest Control',
        'landscaping': 'Landscaping',
        'fire_safety': 'Fire Safety',
        'other': 'Other'
      };
      return categoryMap[category] || category;
    }
    return translated;
  };

  // Status translation helper
  const getStatusText = (status: string) => {
    const key = `status.${status}`;
    const translated = t(key);
    if (translated === key) {
      const statusMap: {[key: string]: string} = {
        'new': 'New',
        'assigned': 'Assigned',
        'in_progress': 'In Progress',
        'resolved': 'Resolved',
        'closed': 'Closed'
      };
      return statusMap[status] || status;
    }
    return translated;
  };

  // Priority translation helper
  const getPriorityText = (priority: string) => {
    const key = `priority.${priority}`;
    const translated = t(key);
    if (translated === key) {
      const priorityMap: {[key: string]: string} = {
        'low': 'Low',
        'medium': 'Medium',
        'high': 'High',
        'urgent': 'Urgent'
      };
      return priorityMap[priority] || priority;
    }
    return translated;
  };

  const formatSpecializations = (specializations: string[]) => {
    if (!specializations || specializations.length === 0) return t('categories.generalMaintenance') || 'General Maintenance';
    return specializations.map(spec => 
      specializationLabels[spec as keyof typeof specializationLabels] || spec
    ).join(', ');
  };

  const handleFeedbackClick = (issue: any) => {
    setSelectedIssueForFeedback(issue);
    setFeedbackModalOpen(true);
  };

  const handleFeedbackClose = () => {
    setFeedbackModalOpen(false);
    setSelectedIssueForFeedback(null);
  };

  const handleFeedbackSuccess = () => {
    dispatch(fetchIssues(filters));
  };

  // Load more issues function with performance tracking
  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMore) return;
    
    const startTime = performance.now();
    setIsLoadingMore(true);
    
    // Simulate loading delay for better UX
    setTimeout(() => {
      setCurrentPage(prev => prev + 1);
      setIsLoadingMore(false);
      
      const endTime = performance.now();
      console.log(`Load more performance: ${endTime - startTime}ms`);
    }, 500);
  }, [hasMore, isLoadingMore]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !isLoadingMore) {
          loadMore();
        }
      },
      {
        root: null,
        rootMargin: '100px', // Load more when 100px away from bottom
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
  }, [hasMore, isLoadingMore, loadMore]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
    setHasMore(true);
  }, [filters, searchTerm]);

  // Cleanup search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Memory optimization: Clear old translations periodically
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const currentIssueIds = new Set(paginatedIssues.map(issue => issue._id));
      setTranslatedIssues(prev => {
        const cleaned = { ...prev };
        Object.keys(cleaned).forEach(id => {
          if (!currentIssueIds.has(id)) {
            delete cleaned[id];
          }
        });
        return cleaned;
      });
    }, 60000); // Clean up every minute

    return () => clearInterval(cleanupInterval);
  }, [paginatedIssues]);

  // Scroll detection for scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setShowScrollToTop(scrollTop > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to top function
  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

  const isCommittee = user?.role === 'committee';
  const pageTitle = isCommittee ? getText('navigation.allIssues', 'All Issues') : getText('navigation.myIssues', 'My Issues');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold">{pageTitle}</h1>
            {/* Google Translate Component */}
            <GoogleTranslate />
          </div>
          <p className="text-muted-foreground">
            {isCommittee ? getText('issues.manageAllIssues', 'Manage and track all community issues') : getText('issues.trackYourIssues', 'Track and manage your reported issues')}
          </p>
        </div>
        <Link to="/report-issue">
          <Button className="bg-gradient-hero hover:opacity-90">
            <UserPlus className="h-4 w-4 mr-2" />
            {getText('issues.reportNewIssue', 'Report New Issue')}
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder={getText('issues.searchPlaceholder', 'Search issues...')}
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="all-status" value="all">{getText('status.allStatus', 'All Status')}</SelectItem>
                  <SelectItem key="new" value="new">{getText('status.new', 'New')}</SelectItem>
                  <SelectItem key="assigned" value="assigned">{getText('status.assigned', 'Assigned')}</SelectItem>
                  <SelectItem key="in_progress" value="in_progress">{getText('status.in_progress', 'In Progress')}</SelectItem>
                  <SelectItem key="resolved" value="resolved">{getText('status.resolved', 'Resolved')}</SelectItem>
                  <SelectItem key="closed" value="closed">{getText('status.closed', 'Closed')}</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.priority || 'all'}
                onValueChange={(value) => handleFilterChange('priority', value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="all-priority" value="all">{getText('priority.allPriority', 'All Priority')}</SelectItem>
                  <SelectItem key="low" value="low">{getText('priority.low', 'Low')}</SelectItem>
                  <SelectItem key="medium" value="medium">{getText('priority.medium', 'Medium')}</SelectItem>
                  <SelectItem key="high" value="high">{getText('priority.high', 'High')}</SelectItem>
                  <SelectItem key="urgent" value="urgent">{getText('priority.urgent', 'Urgent')}</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.category || 'all'}
                onValueChange={(value) => handleFilterChange('category', value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="all-category" value="all">{getText('categories.allCategories', 'All Categories')}</SelectItem>
                  <SelectItem key="sanitation" value="sanitation">{getText('categories.sanitation', 'Sanitation')}</SelectItem>
                  <SelectItem key="security" value="security">{getText('categories.security', 'Security')}</SelectItem>
                  <SelectItem key="water" value="water">{getText('categories.water', 'Water')}</SelectItem>
                  <SelectItem key="electricity" value="electricity">{getText('categories.electricity', 'Electricity')}</SelectItem>
                  <SelectItem key="elevator" value="elevator">{getText('categories.elevator', 'Elevator')}</SelectItem>
                  <SelectItem key="noise" value="noise">{getText('categories.noise', 'Noise')}</SelectItem>
                  <SelectItem key="parking" value="parking">{getText('categories.parking', 'Parking')}</SelectItem>
                  <SelectItem key="maintenance" value="maintenance">{getText('categories.maintenance', 'Maintenance')}</SelectItem>
                  <SelectItem key="cleaning" value="cleaning">{getText('categories.cleaning', 'Cleaning')}</SelectItem>
                  <SelectItem key="pest_control" value="pest_control">{getText('categories.pest_control', 'Pest Control')}</SelectItem>
                  <SelectItem key="landscaping" value="landscaping">{getText('categories.landscaping', 'Landscaping')}</SelectItem>
                  <SelectItem key="fire_safety" value="fire_safety">{getText('categories.fire_safety', 'Fire Safety')}</SelectItem>
                  <SelectItem key="other" value="other">{getText('categories.other', 'Other')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Results Info */}
      {searchTerm.trim() && (
        <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <span>
              {i18n.language === 'hi' 
                ? `"${searchTerm}" के लिए ${paginatedIssues.length} में से ${filteredIssues.length} परिणाम दिखा रहा है`
                : `${getText('search.showing', 'Showing')} ${paginatedIssues.length} ${getText('search.of', 'of')} ${filteredIssues.length} ${getText('search.results', 'results')} ${getText('search.for', 'for')} "${searchTerm}"`
              }
            </span>
            {filteredIssues.length !== issues.length && (
              <Button 
                variant="link" 
                size="sm" 
                onClick={() => setSearchTerm('')}
                className="p-0 h-auto text-sm"
              >
                {i18n.language === 'hi' ? 'खोज साफ़ करें' : getText('search.clearSearch', 'Clear search')}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Issues List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground text-lg">
              {i18n.language === 'hi' ? 'मुद्दे लोड हो रहे हैं...' : 'Loading issues...'}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {i18n.language === 'hi' ? 'कृपया प्रतीक्षा करें' : 'Please wait'}
            </p>
          </div>
        ) : isTranslating ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
            <p className="text-muted-foreground">
              {i18n.language === 'hi' ? 'हिंदी में अनुवाद हो रहा है...' : 'Translating to Hindi...'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {i18n.language === 'hi' ? 'कृपया प्रतीक्षा करें' : 'Please wait'}
            </p>
          </div>
        ) : paginatedIssues.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="text-center py-12">
              <div className="text-muted-foreground">
                <div className="mb-4">
                  <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                </div>
                <h3 className="text-lg font-medium mb-2">
                  {searchTerm.trim() 
                    ? (i18n.language === 'hi' ? 'कोई खोज परिणाम नहीं मिला' : getText('issues.noSearchResults', 'No search results found'))
                    : (i18n.language === 'hi' ? 'कोई मुद्दा नहीं मिला' : getText('issues.noIssuesFound', 'No issues found'))
                  }
                </h3>
                <p className="text-sm">
                  {searchTerm.trim() 
                    ? (i18n.language === 'hi' ? 'आपकी खोज मापदंडों से कोई मुद्दा मेल नहीं खाता।' : getText('issues.noIssuesMatchSearch', 'No issues match your search criteria.'))
                    : (i18n.language === 'hi' ? 'आपके वर्तमान फ़िल्टर से कोई मुद्दा मेल नहीं खाता।' : getText('issues.noIssuesMatch', 'No issues match your current filters.'))
                  }
                </p>
                {searchTerm.trim() && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setSearchTerm('')}
                    className="mt-4"
                  >
                    {i18n.language === 'hi' ? 'खोज साफ़ करें' : getText('search.clearSearch', 'Clear search')}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          paginatedIssues.map((issue, index) => {
            const translatedIssue = getTranslatedIssue(issue);
            return (
              <Card 
                key={issue._id} 
                className="shadow-card hover:shadow-elevated transition-all duration-300"
                style={{ 
                  opacity: 0,
                  animation: `fadeIn 0.5s ease-in-out ${index * 0.1}s forwards`
                }}
              >
                <CardContent className="pt-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-lg">{translatedIssue.title}</h3>
                        <Badge className={getStatusBadgeClass(issue.status)}>
                          {getStatusText(issue.status)}
                        </Badge>
                        <Badge className={getPriorityBadgeClass(issue.priority)}>
                          {getPriorityText(issue.priority)}
                        </Badge>
                      </div>
                      
                      <p className="text-muted-foreground mb-3 line-clamp-2">
                        {translatedIssue.description}
                      </p>
                    
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span>{getText('labels.category', 'Category')}: {getCategoryText(issue.category)}</span>
                        <span>{getText('labels.reported', 'Reported')}: {formatDate(issue.createdAt)}</span>
                        {isCommittee && (
                          <span>{getText('labels.reportedBy', 'Reported By')}: {issue.reportedByName}</span>
                        )}
                        {issue.assignedToName && (
                          <span>{getText('labels.assignedTo', 'Assigned To')}: {issue.assignedToName}</span>
                        )}

                        {(issue.status === 'resolved' || issue.status === 'closed') && issue.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span className="font-medium text-yellow-600">{issue.rating}/5</span>
                            {issue.ratingComment && (
                              <span className="text-xs text-gray-500 ml-2">
                                "{issue.ratingComment.substring(0, 30)}{issue.ratingComment.length > 30 ? '...' : ''}"
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewIssue(issue)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        {getText('buttons.view', 'View')}
                      </Button>
                      
                      {isCommittee && issue.status === 'new' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAssignIssue(issue)}
                          disabled={loadingButtons[`assign-${issue._id}`]}
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          {getText('buttons.assign', 'Assign')}
                          {loadingButtons[`assign-${issue._id}`] && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                        </Button>
                      )}
                      {(issue.status === 'resolved' || issue.status === 'closed') && !issue.rating && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleFeedbackClick(issue)}
                          className="text-yellow-600 hover:text-yellow-700 border-yellow-600 hover:border-yellow-700"
                        >
                          <Star className="h-4 w-4 mr-1" />
                          {getText('buttons.rate', 'Rate')}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}

        {/* Load More Section */}
        {hasMore && (
          <div className="flex justify-center mt-8" ref={loadMoreRef}>
            {isLoadingMore ? (
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-sm">
                  {i18n.language === 'hi' ? 'अधिक मुद्दे लोड हो रहे हैं...' : 'Loading more issues...'}
                </span>
                <div className="w-32 h-1 bg-gray-200 rounded-full">
                  <div className="h-1 bg-primary rounded-full animate-pulse"></div>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={loadMore}
                className="flex items-center gap-2 px-6 py-3"
              >
                <ChevronDown className="h-4 w-4" />
                <span>{i18n.language === 'hi' ? 'और मुद्दे दिखाएं' : 'Load More Issues'}</span>
              </Button>
            )}
          </div>
        )}

        {/* Progress indicator */}
        {paginatedIssues.length > 0 && (
          <div className="text-center text-sm text-muted-foreground mt-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span>
                {i18n.language === 'hi' 
                  ? `${paginatedIssues.length} में से ${filteredIssues.length} मुद्दे दिखाए गए हैं`
                  : `Showing ${paginatedIssues.length} of ${filteredIssues.length} issues`
                }
              </span>
              {i18n.language === 'hi' && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                  अनुवाद कैश्ड
                </span>
              )}
            </div>
            {hasMore && (
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(paginatedIssues.length / filteredIssues.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Issue Details Modal */}
      <Dialog 
        open={modals.issueDetails} 
        onOpenChange={() => dispatch(closeModal('issueDetails'))}
      >
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader className="text-center">
            <DialogTitle className="text-2xl font-bold text-primary">
              {selectedIssue ? getTranslatedIssue(selectedIssue).title : ''}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {t('modal.issueDetailsDescription')}
            </DialogDescription>
          </DialogHeader>
          
          {selectedIssue && (
            <div className="space-y-8">
              {/* Main Issue Information - Centered Layout */}
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-6 border border-primary/20">
                <h4 className="text-lg font-semibold text-primary mb-6 text-center">{t('modal.issueInformation')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex flex-col space-y-2">
                      <span className="text-sm font-medium text-muted-foreground">{getText('labels.category', 'Category')}</span>
                      <span className="text-base">{getCategoryText(selectedIssue.category)}</span>
                    </div>
                    <div className="flex flex-col space-y-2">
                      <span className="text-sm font-medium text-muted-foreground">{getText('labels.priority', 'Priority')}</span>
                      <Badge className={`${getPriorityBadgeClass(selectedIssue.priority)} text-sm px-3 py-1`}>
                        {getPriorityText(selectedIssue.priority)}
                      </Badge>
                    </div>
                    <div className="flex flex-col space-y-2">
                      <span className="text-sm font-medium text-muted-foreground">{getText('labels.status', 'Status')}</span>
                      <Badge className={`${getStatusBadgeClass(selectedIssue.status)} text-sm px-3 py-1`}>
                        {getStatusText(selectedIssue.status)}
                      </Badge>
                    </div>
                    <div className="flex flex-col space-y-2">
                      <span className="text-sm font-medium text-muted-foreground">{getText('labels.reported', 'Reported')}</span>
                      <span className="text-base">{formatDate(selectedIssue.createdAt)}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {selectedIssue.assignedToName && (
                      <div className="flex flex-col space-y-2">
                        <span className="text-sm font-medium text-muted-foreground">{getText('labels.assignedTo', 'Assigned to')}</span>
                        <span className="text-base">{selectedIssue.assignedToName}</span>
                      </div>
                    )}
                    {selectedIssue.assignedAt && (
                      <div className="flex flex-col space-y-2">
                        <span className="text-sm font-medium text-muted-foreground">{getText('labels.assignedAt', 'Assigned')}</span>
                        <span className="text-base">{formatDate(selectedIssue.assignedAt)}</span>
                      </div>
                    )}
                    {selectedIssue.resolvedAt && (
                      <div className="flex flex-col space-y-2">
                        <span className="text-sm font-medium text-muted-foreground">{getText('labels.resolvedAt', 'Resolved')}</span>
                        <span className="text-base">{formatDate(selectedIssue.resolvedAt)}</span>
                      </div>
                    )}
                    {(selectedIssue.status === 'resolved' || selectedIssue.status === 'closed') && selectedIssue.rating && (
                      <div className="flex flex-col space-y-2">
                        <span className="text-sm font-medium text-muted-foreground">{getText('labels.yourRating', 'Your Rating')}</span>
                        <div className="flex items-center gap-2">
                          <Star className="h-5 w-5 text-yellow-500 fill-current" />
                          <span className="text-lg font-bold text-yellow-600">{selectedIssue.rating}/5</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Description Section */}
              <div className="bg-muted/30 rounded-lg p-6">
                <h4 className="text-lg font-semibold mb-4 text-center">{getText('labels.description', 'Description')}</h4>
                <p className="text-base leading-relaxed text-center max-w-2xl mx-auto">
                  {getTranslatedIssue(selectedIssue).description}
                </p>
              </div>

              {/* Rating Comment */}
              {(selectedIssue.status === 'resolved' || selectedIssue.status === 'closed') && selectedIssue.ratingComment && (
                <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
                  <h4 className="text-lg font-semibold text-yellow-700 mb-4 text-center">{getText('labels.yourComment', 'Your Comment')}</h4>
                  <p className="text-base leading-relaxed text-center max-w-2xl mx-auto text-yellow-800">
                    {selectedIssue.ratingComment}
                  </p>
                </div>
              )}

              {/* Media Section */}
              {(selectedIssue.images?.length > 0 || selectedIssue.videos?.length > 0) && (
                <div className="bg-muted/30 rounded-lg p-6">
                  <h4 className="text-lg font-semibold mb-6 text-center">{getText('labels.media', 'Media Attachments')}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
                    {selectedIssue.images?.map((image: any, index: number) => (
                      <div key={`${selectedIssue._id}-image-${index}`} className="group relative">
                        <img
                          src={image.url}
                          alt={`Issue ${index + 1}`}
                          className="aspect-square object-cover rounded-lg shadow-md hover:shadow-lg transition-all duration-200 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 rounded-lg flex items-center justify-center">
                          <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium">Image {index + 1}</span>
                        </div>
                      </div>
                    ))}
                    {selectedIssue.videos?.map((video: any, index: number) => (
                      <div key={`${selectedIssue._id}-video-${index}`} className="group relative">
                        <video
                          controls
                          className="aspect-square object-cover rounded-lg shadow-md hover:shadow-lg transition-all duration-200 group-hover:scale-105"
                        >
                          <source src={video.url} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 rounded-lg flex items-center justify-center">
                          <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium">Video {index + 1}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedIssue.assignments?.length > 0 && (
                <div>
                  <h4 className="font-medium mb-4">{getText('labels.assignmentHistory', 'Assignment History')}</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">{getText('labels.technician', 'Technician')}</th>
                          <th className="text-left py-2">{getText('labels.status', 'Status')}</th>
                          <th className="text-left py-2">{getText('labels.assigned', 'Assigned')}</th>
                          <th className="text-left py-2">{getText('labels.completed', 'Completed')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedIssue.assignments.map((assignment: any, index: number) => (
                          <tr key={index} className="border-b">
                            <td className="py-2">{assignment.assignedTo.name}</td>
                            <td className="py-2">
                              <Badge className={assignment.status === 'completed' ? 'bg-success' : 'bg-warning'}>
                                {getStatusText(assignment.status)}
                              </Badge>
                            </td>
                            <td className="py-2">{formatDate(assignment.assignedAt)}</td>
                            <td className="py-2">
                              {assignment.actualCompletionTime ? formatDate(assignment.actualCompletionTime) : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{getText('modal.confirmDelete', 'Confirm Delete')}</DialogTitle>
            <DialogDescription>
              {getText('modal.deleteConfirmation', 'Are you sure you want to delete this issue? This action cannot be undone.')}
              <br />
              <strong>{getText('labels.issue', 'Issue')}:</strong> {issueToDelete?.title}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {getText('buttons.cancel', 'Cancel')}
            </Button>
            <Button onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : getText('buttons.deleteIssue', 'Delete Issue')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Issue Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{getText('modal.assignIssue', 'Assign Issue')}</DialogTitle>
            <DialogDescription>
              {getText('modal.assignIssueDescription', 'Assign this issue to a technician')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="issueTitle">{getText('labels.issue', 'Issue')}</Label>
              <Input
                id="issueTitle"
                value={issueToAssign?.title || ''}
                readOnly
              />
            </div>
            
            <div>
              <Label htmlFor="technicianSelect">{getText('labels.selectTechnician', 'Select Technician')} *</Label>
              <Select
                value={assignmentData.technicianId}
                onValueChange={(value) => setAssignmentData(prev => ({ ...prev, technicianId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={getText('placeholders.chooseTechnician', 'Choose a technician...')} />
                </SelectTrigger>
                <SelectContent>
                  {technicians.map((tech) => (
                    <SelectItem key={tech._id} value={tech._id}>
                      {tech.name} ({formatSpecializations(tech.specializations)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="estimatedTime">{getText('labels.estimatedTime', 'Estimated Completion Time (hours)')}</Label>
              <Input
                id="estimatedTime"
                type="number"
                min="1"
                max="168"
                placeholder={getText('placeholders.estimatedTime', 'e.g., 4')}
                value={assignmentData.estimatedTime}
                onChange={(e) => setAssignmentData(prev => ({ ...prev, estimatedTime: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="assignmentNotes">{getText('labels.assignmentNotes', 'Assignment Notes')}</Label>
              <Textarea
                id="assignmentNotes"
                placeholder={getText('placeholders.assignmentNotes', 'Any special instructions or notes...')}
                value={assignmentData.notes}
                onChange={(e) => setAssignmentData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="paymentAmount">{getText('labels.paymentAmount', 'Payment Amount')} (₹)</Label>
              <Input
                id="paymentAmount"
                type="number"
                min="0"
                step="0.01"
                placeholder={getText('placeholders.paymentAmount', 'e.g., 500')}
                value={assignmentData.paymentAmount}
                onChange={(e) => setAssignmentData(prev => ({ ...prev, paymentAmount: e.target.value }))}
              />
              <p className="text-xs text-gray-500 mt-1">
                {getText('labels.paymentAmountDescription', 'Amount to be paid to the technician for this task')}
              </p>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              {getText('buttons.cancel', 'Cancel')}
            </Button>
            <Button onClick={confirmAssign}>
              {isAssigning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : getText('buttons.assignIssue', 'Assign Issue')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Feedback Modal */}
      {selectedIssueForFeedback && (
        <FeedbackModal
          isOpen={feedbackModalOpen}
          onClose={handleFeedbackClose}
          issueId={selectedIssueForFeedback._id}
          issueTitle={selectedIssueForFeedback.title}
          technicianName={selectedIssueForFeedback.assignedToName}
          onSuccess={handleFeedbackSuccess}
        />
      )}

      {/* Scroll to Top Button */}
      {showScrollToTop && (
        <Button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 rounded-full w-12 h-12 p-0 shadow-lg bg-primary hover:bg-primary/90"
          aria-label={i18n.language === 'hi' ? 'ऊपर जाएं' : 'Scroll to top'}
        >
          <ChevronDown className="h-5 w-5 rotate-180" />
        </Button>
      )}
    </div>
  );
};

export default MyIssues;