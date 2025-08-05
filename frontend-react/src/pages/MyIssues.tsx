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
  Calendar
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

const MyIssues = () => {
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

  useEffect(() => {
    dispatch(fetchIssues(filters));
  }, [dispatch, filters]);

  const handleSearch = (value: string) => {
    dispatch(setFilters({ search: value }));
  };

  const handleFilterChange = (key: string, value: string) => {
    dispatch(setFilters({ [key]: value === 'all' ? undefined : value }));
  };

  const handleViewIssue = async (issue: any) => {
    try {
      // Fetch detailed issue data using API service
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
      // Fetch technicians using API service
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
      alert('Please fill in all required fields');
      return;
    }
    
    console.log('Assignment data before sending:', assignmentData);

    setIsAssigning(true);
    try {
      const assignData = {
        technicianId: assignmentData.technicianId,
        estimatedCompletionTime: parseInt(assignmentData.estimatedTime),
        assignmentNotes: assignmentData.notes,
        cost: assignmentData.cost && assignmentData.cost.trim() !== '' ? parseFloat(assignmentData.cost) : undefined
      };
      
      console.log('Assignment data being sent:', assignData);
      console.log('Original assignmentData:', assignmentData);
      console.log('Cost field value:', assignmentData.cost, 'Type:', typeof assignmentData.cost);
      
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const specializationLabels = {
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

  const formatSpecializations = (specializations: string[]) => {
    if (!specializations || specializations.length === 0) return 'General Maintenance';
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
    // Refresh issues to show updated rating
    dispatch(fetchIssues(filters));
  };

  const isCommittee = user?.role === 'committee';
  const pageTitle = isCommittee ? 'All Issues' : 'My Issues';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold">{pageTitle}</h1>
          <p className="text-muted-foreground">
            {isCommittee ? 'Manage all society issues' : 'Track and manage your reported issues'}
          </p>
        </div>
        <Link to="/report-issue">
          <Button className="bg-gradient-hero hover:opacity-90">
            <UserPlus className="h-4 w-4 mr-2" />
            Report Issue
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
                  placeholder="Search issues..."
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
                  <SelectItem key="all-status" value="all">All Status</SelectItem>
                  <SelectItem key="new" value="new">New</SelectItem>
                  <SelectItem key="assigned" value="assigned">Assigned</SelectItem>
                  <SelectItem key="in_progress" value="in_progress">In Progress</SelectItem>
                  <SelectItem key="resolved" value="resolved">Resolved</SelectItem>
                  <SelectItem key="closed" value="closed">Closed</SelectItem>
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
                  <SelectItem key="all-priority" value="all">All Priority</SelectItem>
                  <SelectItem key="low" value="low">Low</SelectItem>
                  <SelectItem key="medium" value="medium">Medium</SelectItem>
                  <SelectItem key="high" value="high">High</SelectItem>
                  <SelectItem key="urgent" value="urgent">Urgent</SelectItem>
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
                  <SelectItem key="all-category" value="all">All Categories</SelectItem>
                  <SelectItem key="sanitation" value="sanitation">Sanitation</SelectItem>
                  <SelectItem key="security" value="security">Security</SelectItem>
                  <SelectItem key="water" value="water">Water</SelectItem>
                  <SelectItem key="electricity" value="electricity">Electricity</SelectItem>
                  <SelectItem key="elevator" value="elevator">Elevator</SelectItem>
                  <SelectItem key="noise" value="noise">Noise</SelectItem>
                  <SelectItem key="parking" value="parking">Parking</SelectItem>
                  <SelectItem key="maintenance" value="maintenance">Maintenance</SelectItem>
                  <SelectItem key="cleaning" value="cleaning">Cleaning</SelectItem>
                  <SelectItem key="pest_control" value="pest_control">Pest Control</SelectItem>
                  <SelectItem key="landscaping" value="landscaping">Landscaping</SelectItem>
                  <SelectItem key="fire_safety" value="fire_safety">Fire Safety</SelectItem>
                  <SelectItem key="other" value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Issues List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-muted-foreground">Loading issues...</p>
          </div>
        ) : issues.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="text-center py-12">
              <div className="text-muted-foreground">
                <h3 className="text-lg font-medium mb-2">No issues found</h3>
                <p>No issues match your current filters.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          issues.map((issue) => (
            <Card key={issue._id} className="shadow-card hover:shadow-elevated transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-lg">{issue.title}</h3>
                      <Badge className={getStatusBadgeClass(issue.status)}>
                        {issue.status === 'new' ? 'New' : 
                         issue.status === 'assigned' ? 'Assigned' :
                         issue.status === 'in_progress' ? 'In Progress' :
                         issue.status === 'resolved' ? 'Resolved' :
                         issue.status === 'closed' ? 'Closed' : issue.status}
                      </Badge>
                      <Badge className={getPriorityBadgeClass(issue.priority)}>
                        {issue.priority}
                      </Badge>
                    </div>
                    
                    <p className="text-muted-foreground mb-3 line-clamp-2">
                      {issue.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span>Category: {issue.category}</span>
                      <span>Reported: {formatDate(issue.createdAt)}</span>
                      {isCommittee && (
                        <span>By: {issue.reportedByName}</span>
                      )}
                      {issue.assignedToName && (
                        <span>Assigned to: {issue.assignedToName}</span>
                      )}
                      {issue.cost && issue.cost > 0 && (
                        <span className="font-medium text-green-600">
                          Cost: ₹{issue.cost}
                        </span>
                      )}
                      {/* Rating display for completed issues */}
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
                      View
                    </Button>
                    
                    {isCommittee && issue.status === 'new' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAssignIssue(issue)}
                        disabled={loadingButtons[`assign-${issue._id}`]}
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        Assign
                        {loadingButtons[`assign-${issue._id}`] && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                      </Button>
                    )}
                    
                    {!isCommittee && issue.status === 'new' && (
                      <Button
                        variant="outline"
                        size="sm"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    )}
                    
                    {issue.status === 'new' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteIssue(issue)}
                        disabled={loadingButtons[`delete-${issue._id}`]}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                        {loadingButtons[`delete-${issue._id}`] && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                      </Button>
                    )}
                    
                    {/* Feedback button for completed issues */}
                    {!isCommittee && (issue.status === 'resolved' || issue.status === 'closed') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFeedbackClick(issue)}
                        className="text-yellow-600 hover:text-yellow-700 border-yellow-600 hover:border-yellow-700"
                      >
                        <Star className="h-4 w-4 mr-1" />
                        Rate
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Issue Details Modal */}
      <Dialog 
        open={modals.issueDetails} 
        onOpenChange={() => dispatch(closeModal('issueDetails'))}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedIssue?.title}</DialogTitle>
            <DialogDescription>
              Issue details and history
            </DialogDescription>
          </DialogHeader>
          
          {selectedIssue && (
            <div className="space-y-6">
              {/* Issue Information */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-4">Issue Information</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium">Title:</span>
                      <span>{selectedIssue.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Description:</span>
                      <span className="text-right">{selectedIssue.description}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Category:</span>
                      <span>{selectedIssue.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Priority:</span>
                      <Badge className={getPriorityBadgeClass(selectedIssue.priority)}>
                        {selectedIssue.priority}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Status:</span>
                      <Badge className={getStatusBadgeClass(selectedIssue.status)}>
                        {selectedIssue.status === 'new' ? 'New' : 
                         selectedIssue.status === 'assigned' ? 'Assigned' :
                         selectedIssue.status === 'in_progress' ? 'In Progress' :
                         selectedIssue.status === 'resolved' ? 'Resolved' :
                         selectedIssue.status === 'closed' ? 'Closed' : selectedIssue.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Reported:</span>
                      <span>{formatDate(selectedIssue.createdAt)}</span>
                    </div>
                    {selectedIssue.assignedToName && (
                      <div className="flex justify-between">
                        <span className="font-medium">Assigned to:</span>
                        <span>{selectedIssue.assignedToName}</span>
                      </div>
                    )}
                    {selectedIssue.assignedAt && (
                      <div className="flex justify-between">
                        <span className="font-medium">Assigned:</span>
                        <span>{formatDate(selectedIssue.assignedAt)}</span>
                      </div>
                    )}
                    {selectedIssue.resolvedAt && (
                      <div className="flex justify-between">
                        <span className="font-medium">Resolved:</span>
                        <span>{formatDate(selectedIssue.resolvedAt)}</span>
                      </div>
                    )}
                    {/* Rating information for completed issues */}
                    {(selectedIssue.status === 'resolved' || selectedIssue.status === 'closed') && selectedIssue.rating && (
                      <>
                        <div className="flex justify-between">
                          <span className="font-medium">Your Rating:</span>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span className="font-medium text-yellow-600">{selectedIssue.rating}/5</span>
                          </div>
                        </div>
                        {selectedIssue.ratingComment && (
                          <div className="flex justify-between">
                            <span className="font-medium">Your Comment:</span>
                            <span className="text-right max-w-xs">{selectedIssue.ratingComment}</span>
                          </div>
                        )}
                        {selectedIssue.ratedAt && (
                          <div className="flex justify-between">
                            <span className="font-medium">Rated on:</span>
                            <span>{formatDate(selectedIssue.ratedAt)}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-4">Location</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>Block: {selectedIssue.address?.blockNumber || 'N/A'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>Apartment: {selectedIssue.address?.apartmentNumber || 'N/A'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Floor: {selectedIssue.address?.floorNumber || 'N/A'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>Area: {selectedIssue.address?.area || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Media */}
              {(selectedIssue.images?.length > 0 || selectedIssue.videos?.length > 0) && (
                <div>
                  <h4 className="font-medium mb-4">Media</h4>
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

              {/* Assignment History */}
              {selectedIssue.assignments?.length > 0 && (
                <div>
                  <h4 className="font-medium mb-4">Assignment History</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Technician</th>
                          <th className="text-left py-2">Status</th>
                          <th className="text-left py-2">Assigned</th>
                          <th className="text-left py-2">Completed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedIssue.assignments.map((assignment: any, index: number) => (
                          <tr key={index} className="border-b">
                            <td className="py-2">{assignment.assignedTo.name}</td>
                            <td className="py-2">
                              <Badge className={assignment.status === 'completed' ? 'bg-success' : 'bg-warning'}>
                                {assignment.status}
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
      {/* The AlertDialog component was removed from imports, so this block will be removed or commented out */}
      {/* <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this issue? This action cannot be undone.
              <br />
              <strong>Issue:</strong> {issueToDelete?.title}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Delete Issue'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog> */}

      {/* Assign Issue Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Issue</DialogTitle>
            <DialogDescription>
              Assign this issue to a technician
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="issueTitle">Issue</Label>
              <Input
                id="issueTitle"
                value={issueToAssign?.title || ''}
                readOnly
              />
            </div>
            
            <div>
              <Label htmlFor="technicianSelect">Select Technician *</Label>
              <Select
                value={assignmentData.technicianId}
                onValueChange={(value) => setAssignmentData(prev => ({ ...prev, technicianId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a technician..." />
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
              <Label htmlFor="estimatedTime">Estimated Completion Time (hours)</Label>
              <Input
                id="estimatedTime"
                type="number"
                min="1"
                max="168"
                placeholder="e.g., 4"
                value={assignmentData.estimatedTime}
                onChange={(e) => setAssignmentData(prev => ({ ...prev, estimatedTime: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="assignmentNotes">Assignment Notes</Label>
              <Textarea
                id="assignmentNotes"
                placeholder="Any special instructions or notes..."
                value={assignmentData.notes}
                onChange={(e) => setAssignmentData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="cost">Cost (₹)</Label>
              <Input
                id="cost"
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g., 500"
                value={assignmentData.cost}
                onChange={(e) => setAssignmentData(prev => ({ ...prev, cost: e.target.value }))}
              />
              <p className="text-xs text-gray-500 mt-1">
                Amount to be paid to the technician for this task
              </p>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmAssign}>
              {isAssigning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Assign Issue'}
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