import React, { useEffect, useState } from 'react';
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
  Globe
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
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const MyIssues = () => {
  const { t, i18n } = useTranslation();
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
    cost: ''
  });
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [selectedIssueForFeedback, setSelectedIssueForFeedback] = useState<any>(null);
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
    dispatch(fetchIssues(filters));
  }, [dispatch, filters]);

  // Translate issues when they are loaded and language is Hindi
  useEffect(() => {
    if (issues.length > 0 && i18n.language === 'hi') {
      translateIssues(issues);
    }
  }, [issues, i18n.language]);

  const handleSearch = (value: string) => {
    dispatch(setFilters({ search: value }));
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
        cost: assignmentData.cost && assignmentData.cost.trim() !== '' ? parseFloat(assignmentData.cost) : undefined
      };
      
      await dispatch(assignIssue({
        issueId: issueToAssign._id,
        data: assignData
      }));
      
      setAssignDialogOpen(false);
      setIssueToAssign(null);
      setAssignmentData({ technicianId: '', estimatedTime: '', notes: '', cost: '' });
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

  const isCommittee = user?.role === 'committee';
  const pageTitle = isCommittee ? getText('navigation.allIssues', 'All Issues') : getText('navigation.myIssues', 'My Issues');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold">{pageTitle}</h1>
            {/* Language Toggle Button */}
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

      {/* Issues List */}
      <div className="space-y-4">
        {isLoading || isTranslating ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-muted-foreground">
              {isTranslating ? (i18n.language === 'hi' ? 'अनुवाद हो रहा है...' : 'Translating...') : getText('issues.loadingIssues', 'Loading issues...')}
            </p>
          </div>
        ) : issues.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="text-center py-12">
              <div className="text-muted-foreground">
                <h3 className="text-lg font-medium mb-2">{getText('issues.noIssuesFound', 'No issues found')}</h3>
                <p>{getText('issues.noIssuesMatch', 'No issues match your current filters.')}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          issues.map((issue) => {
            const translatedIssue = getTranslatedIssue(issue);
            return (
              <Card key={issue._id} className="shadow-card hover:shadow-elevated transition-shadow">
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
  {issue.cost && issue.cost > 0 && (
    <span className="font-medium text-green-600">
      {getText('labels.cost', 'Cost')}: ₹{issue.cost}
    </span>
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
      </div>

      {/* Issue Details Modal */}
      <Dialog 
        open={modals.issueDetails} 
        onOpenChange={() => dispatch(closeModal('issueDetails'))}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedIssue ? getTranslatedIssue(selectedIssue).title : ''}</DialogTitle>
            <DialogDescription>
              {t('modal.issueDetailsDescription')}
            </DialogDescription>
          </DialogHeader>
          
          {selectedIssue && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-4">{t('modal.issueInformation')}</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium">{getText('labels.title', 'Title')}:</span>
                      <span>{getTranslatedIssue(selectedIssue).title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">{getText('labels.description', 'Description')}:</span>
                      <span className="text-right">{getTranslatedIssue(selectedIssue).description}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">{getText('labels.category', 'Category')}:</span>
                      <span>{getCategoryText(selectedIssue.category)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">{getText('labels.priority', 'Priority')}:</span>
                      <Badge className={getPriorityBadgeClass(selectedIssue.priority)}>
                        {getPriorityText(selectedIssue.priority)}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">{getText('labels.status', 'Status')}:</span>
                      <Badge className={getStatusBadgeClass(selectedIssue.status)}>
                        {getStatusText(selectedIssue.status)}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">{getText('labels.reported', 'Reported')}:</span>
                      <span>{formatDate(selectedIssue.createdAt)}</span>
                    </div>
                    {selectedIssue.assignedToName && (
                      <div className="flex justify-between">
                        <span className="font-medium">{getText('labels.assignedTo', 'Assigned to')}:</span>
                        <span>{selectedIssue.assignedToName}</span>
                      </div>
                    )}
                    {selectedIssue.assignedAt && (
                      <div className="flex justify-between">
                        <span className="font-medium">{getText('labels.assignedAt', 'Assigned')}:</span>
                        <span>{formatDate(selectedIssue.assignedAt)}</span>
                      </div>
                    )}
                    {selectedIssue.resolvedAt && (
                      <div className="flex justify-between">
                        <span className="font-medium">{getText('labels.resolvedAt', 'Resolved')}:</span>
                        <span>{formatDate(selectedIssue.resolvedAt)}</span>
                      </div>
                    )}
                    {(selectedIssue.status === 'resolved' || selectedIssue.status === 'closed') && selectedIssue.rating && (
                      <>
                        <div className="flex justify-between">
                          <span className="font-medium">{getText('labels.yourRating', 'Your Rating')}:</span>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span className="font-medium text-yellow-600">{selectedIssue.rating}/5</span>
                          </div>
                        </div>
                        {selectedIssue.ratingComment && (
                          <div className="flex justify-between">
                            <span className="font-medium">{getText('labels.yourComment', 'Your Comment')}:</span>
                            <span className="text-right max-w-xs">{selectedIssue.ratingComment}</span>
                          </div>
                        )}
                        {selectedIssue.ratedAt && (
                          <div className="flex justify-between">
                            <span className="font-medium">{getText('labels.ratedOn', 'Rated on')}:</span>
                            <span>{formatDate(selectedIssue.ratedAt)}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-4">{getText('labels.location', 'Location')}</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{getText('labels.block', 'Block')}: {selectedIssue.address?.blockNumber || 'N/A'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{getText('labels.apartment', 'Apartment')}: {selectedIssue.address?.apartmentNumber || 'N/A'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{getText('labels.floor', 'Floor')}: {selectedIssue.address?.floorNumber || 'N/A'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{getText('labels.area', 'Area')}: {selectedIssue.address?.area || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {(selectedIssue.images?.length > 0 || selectedIssue.videos?.length > 0) && (
                <div>
                  <h4 className="font-medium mb-4">{getText('labels.media', 'Media')}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {selectedIssue.images?.map((image: any, index: number) => (
                      <img
                        key={`${selectedIssue._id}-image-${index}`}
                        src={image.url}
                        alt={`Issue ${index + 1}`}
                        className="aspect-square object-cover rounded-lg"
                      />
                    ))}
                    {selectedIssue.videos?.map((video: any, index: number) => (
                      <video
                        key={`${selectedIssue._id}-video-${index}`}
                        controls
                        className="aspect-square object-cover rounded-lg"
                      >
                        <source src={video.url} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
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
              <Label htmlFor="cost">{getText('labels.cost', 'Cost')} (₹)</Label>
              <Input
                id="cost"
                type="number"
                min="0"
                step="0.01"
                placeholder={getText('placeholders.cost', 'e.g., 500')}
                value={assignmentData.cost}
                onChange={(e) => setAssignmentData(prev => ({ ...prev, cost: e.target.value }))}
              />
              <p className="text-xs text-gray-500 mt-1">
                {getText('labels.costDescription', 'Amount to be paid to the technician for this task')}
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
    </div>
  );
};

export default MyIssues;