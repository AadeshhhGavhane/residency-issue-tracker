import { useEffect, useState, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Wrench, 
  Clock, 
  CheckCircle, 
  XCircle,
  Play,
  Eye,
  Check,
  MapPin,
  User,
  Calendar,
  DollarSign
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { RootState, AppDispatch } from '@/store';
import { fetchAssignments, updateAssignment } from '@/store/slices/issuesSlice';
import GoogleTranslate from '@/components/GoogleTranslate';
import { toast } from '@/hooks/use-toast';

const TechnicianDashboard = () => {
  const dispatch = useDispatch<AppDispatch>();
  
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
  const { assignments, isLoading } = useSelector((state: RootState) => state.issues);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [completionData, setCompletionData] = useState({
    completionNotes: '',
    timeSpent: '',
    materialsUsed: ''
  });
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  
  // Pagination state for lazy loading
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(3);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('TechnicianDashboard: Fetching assignments on mount');
    dispatch(fetchAssignments({}));
  }, [dispatch]);

  // Debug effect to log assignments changes
  useEffect(() => {
    console.log('TechnicianDashboard: Assignments updated:', assignments.map(a => ({ id: a._id, status: a.status, title: a.issue?.title })));
  }, [assignments]);

  // Calculate paginated assignments
  const paginatedAssignments = assignments.slice(0, currentPage * itemsPerPage);
  const hasMoreAssignments = assignments.length > currentPage * itemsPerPage;

  // Load more function
  const loadMore = useCallback(() => {
    if (hasMoreAssignments && !isLoadingMore) {
      setIsLoadingMore(true);
      setTimeout(() => {
        setCurrentPage(prev => prev + 1);
        setIsLoadingMore(false);
      }, 500);
    }
  }, [hasMoreAssignments, isLoadingMore]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMoreAssignments && !isLoadingMore) {
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
  }, [hasMoreAssignments, isLoadingMore, loadMore]);

  const getAnalytics = () => {
    if (!Array.isArray(assignments)) {
      return {
        total: 0,
        pending: 0,
        accepted: 0,
        inProgress: 0,
        completed: 0,
        rejected: 0,
        completionRate: 0,
        totalEarnings: 0,
        averageEarnings: 0,
        paidAssignments: 0
      };
    }

    // Filter out invalid assignments
    const validAssignments = assignments.filter(a => a && a.issue && a.issue.title);
    if (assignments.length !== validAssignments.length) {
      console.warn('Invalid assignments detected:', {
        totalAssignments: assignments.length,
        validAssignments: validAssignments.length,
        invalidAssignments: assignments.filter(a => !a || !a.issue || !a.issue.title)
      });
    }

    const total = validAssignments.length;
    const pending = validAssignments.filter(a => a.status === 'pending').length;
    const accepted = validAssignments.filter(a => a.status === 'accepted').length;
    const inProgress = validAssignments.filter(a => a.status === 'in_progress').length;
    const completed = validAssignments.filter(a => a.status === 'completed').length;
    const rejected = validAssignments.filter(a => a.status === 'rejected').length;

    // Payment analytics for completed assignments
    const completedAssignments = validAssignments.filter(a => a.status === 'completed');
    const assignmentsWithPayment = completedAssignments.filter(a => a.paymentAmount && a.paymentAmount > 0);
    const totalEarnings = assignmentsWithPayment.reduce((sum, a) => sum + (a.paymentAmount || 0), 0);
    const averageEarnings = assignmentsWithPayment.length > 0 ? totalEarnings / assignmentsWithPayment.length : 0;

          return {
        total,
        pending,
        accepted,
        inProgress,
        completed,
        rejected,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        totalEarnings,
        averageEarnings,
        paidAssignments: assignmentsWithPayment.length
      };
  };

  const analytics = getAnalytics();

  const handleAcceptAssignment = async (assignmentId: string) => {
    try {
      await dispatch(updateAssignment({ id: assignmentId, action: 'accept' }));
      dispatch(fetchAssignments({}));
    } catch (error) {
      console.error('Error accepting assignment:', error);
    }
  };

  const handleStartWork = async (assignmentId: string) => {
    try {
      console.log('Starting work for assignment:', assignmentId);
      const result = await dispatch(updateAssignment({ id: assignmentId, action: 'start' })).unwrap();
      console.log('Start work result:', result);
      await dispatch(fetchAssignments({}));
      console.log('Assignments refreshed after start work');
    } catch (error) {
      console.error('Error starting work:', error);
      toast({
        title: "Error",
        description: "Failed to start work. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCompleteAssignment = async () => {
    if (selectedAssignment && completionData.completionNotes.trim() && completionData.timeSpent.trim()) {
      try {
        console.log('Completing assignment:', selectedAssignment._id);
        const result = await dispatch(updateAssignment({
          id: selectedAssignment._id,
          action: 'complete',
          data: {
            completionNotes: completionData.completionNotes,
            timeSpent: parseInt(completionData.timeSpent),
            materialsUsed: completionData.materialsUsed
          }
        })).unwrap();
        console.log('Complete assignment result:', result);
        
        setShowCompleteDialog(false);
        setCompletionData({ completionNotes: '', timeSpent: '', materialsUsed: '' });
        setSelectedAssignment(null);
        
        await dispatch(fetchAssignments({}));
        console.log('Assignments refreshed after completion');
        
        toast({
          title: "Success",
          description: "Assignment completed successfully!",
          variant: "default",
        });
      } catch (error) {
        console.error('Error completing assignment:', error);
        toast({
          title: "Error",
          description: "Failed to complete assignment. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (completion notes and time spent).",
        variant: "destructive",
      });
    }
  };

  const handleRejectAssignment = async () => {
    if (!selectedAssignment) {
      toast({
        title: "Error",
        description: "No assignment selected",
        variant: "destructive",
      });
      return;
    }

    // Check if assignment is in correct state for rejection
    if (selectedAssignment.status !== 'pending') {
      toast({
        title: "Error",
        description: "Only pending assignments can be rejected",
        variant: "destructive",
      });
      return;
    }

    if (!rejectionReason.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      });
      return;
    }

    console.log('Starting reject assignment process:', {
      assignmentId: selectedAssignment._id,
      status: selectedAssignment.status,
      reason: rejectionReason
    });

    console.log('Current assignments before rejection:', assignments);

    setIsRejecting(true);
    try {
      const result = await dispatch(updateAssignment({
        id: selectedAssignment._id,
        action: 'reject',
        data: { reason: rejectionReason }
      })).unwrap();

      // Show success message
      console.log('Assignment rejected successfully:', result);
      
      toast({
        title: "Success",
        description: "Assignment rejected successfully",
        variant: "default",
      });
      
      // Reset form and close dialog
      setShowRejectDialog(false);
      setRejectionReason('');
      setSelectedAssignment(null);
      
      // Refresh assignments to get updated data
      console.log('Refreshing assignments...');
      await dispatch(fetchAssignments({}));
      
      console.log('Assignments after refresh:', assignments);
      
    } catch (error: any) {
      console.error('Error rejecting assignment:', error);
      
      // Show user-friendly error message
      const errorMessage = error?.message || error?.response?.data?.message || 'Failed to reject assignment';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsRejecting(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-secondary text-secondary-foreground';
      case 'accepted':
        return 'bg-info text-info-foreground';
      case 'in_progress':
        return 'bg-warning text-warning-foreground';
      case 'completed':
        return 'bg-success text-success-foreground';
      case 'rejected':
        return 'bg-destructive text-destructive-foreground';
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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionButton = (assignment: any) => {
    switch (assignment.status) {
      case 'pending':
        return (
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAcceptAssignment(assignment._id)}
              className="text-success border-success hover:bg-success hover:text-white transition-all duration-200 shadow-sm"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Accept
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedAssignment(assignment);
                setShowRejectDialog(true);
              }}
              className="text-destructive border-destructive hover:bg-destructive hover:text-white transition-all duration-200 shadow-sm"
            >
              <XCircle className="h-4 w-4 mr-1" />
              Reject
            </Button>
          </div>
        );
      case 'accepted':
        return (
          <Button
            variant="default"
            size="sm"
            onClick={() => handleStartWork(assignment._id)}
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-lg transition-all duration-200"
          >
            <Play className="h-4 w-4 mr-1" />
            Start Work
          </Button>
        );
      case 'in_progress':
        return (
          <Button
            variant="default"
            size="sm"
            onClick={() => {
              setSelectedAssignment(assignment);
              setShowCompleteDialog(true);
            }}
            className="bg-gradient-to-r from-success to-success/80 hover:from-success/90 hover:to-success/70 text-white shadow-lg transition-all duration-200"
          >
            <Check className="h-4 w-4 mr-1" />
            Complete
          </Button>
        );
      case 'completed':
        return (
          <Badge className="bg-success text-success-foreground px-3 py-1 shadow-sm">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-destructive text-destructive-foreground px-3 py-1 shadow-sm">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-2 text-muted-foreground">Loading assignments...</p>
      </div>
    );
  }

  if (!Array.isArray(assignments)) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No assignments available. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Enhanced Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            My Assignments
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your work assignments and track progress
          </p>
        </div>
                 <div className="flex items-center gap-3">
           <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
             <Wrench className="h-4 w-4 text-primary" />
             <span className="text-sm font-medium text-muted-foreground">
               {analytics.total} Active Assignments
             </span>
           </div>
           <GoogleTranslate />
         </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        <Card className="shadow-card hover:shadow-elevated transition-all duration-300 border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
            <Wrench className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{analytics.total}</div>
            <p className="text-xs text-muted-foreground mt-1">All assignments</p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-elevated transition-all duration-300 border-l-4 border-l-warning">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{analytics.pending}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting response</p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-elevated transition-all duration-300 border-l-4 border-l-info">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accepted</CardTitle>
            <CheckCircle className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-info">{analytics.accepted}</div>
            <p className="text-xs text-muted-foreground mt-1">Ready to start</p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-elevated transition-all duration-300 border-l-4 border-l-warning">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Play className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{analytics.inProgress}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently working</p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-elevated transition-all duration-300 border-l-4 border-l-success">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{analytics.completed}</div>
            <p className="text-xs text-muted-foreground mt-1">Finished work</p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-elevated transition-all duration-300 border-l-4 border-l-success bg-gradient-to-br from-success/5 to-success/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{analytics.completionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">Completion rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Assignments List */}
      <div className="space-y-4">
        {analytics.total === 0 ? (
          <Card className="shadow-card">
            <CardContent className="text-center py-16">
              <div className="mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wrench className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-primary">No assignments yet</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  You don't have any assignments at the moment. Check back later for new work assignments from the committee.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>New assignments will appear here automatically</span>
              </div>
            </CardContent>
          </Card>
        ) : (
          paginatedAssignments
            .filter(assignment => assignment && assignment.issue && assignment.issue.title) // Filter invalid assignments
            .map((assignment, index) => (
              <Card 
                key={assignment._id} 
                className="shadow-card hover:shadow-elevated transition-all duration-300 border-l-4 border-l-primary/20"
                style={{ 
                  opacity: 0,
                  animation: `fadeIn 0.5s ease-in-out ${index * 0.1}s forwards`
                }}
              >
                <CardContent className="pt-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="font-semibold text-lg text-primary">{assignment.issue.title}</h3>
                        <Badge className={getStatusBadgeClass(assignment.status)}>
                          {assignment.status === 'pending' ? 'Pending' :
                           assignment.status === 'accepted' ? 'Accepted' :
                           assignment.status === 'in_progress' ? 'In Progress' :
                           assignment.status === 'completed' ? 'Completed' :
                           assignment.status === 'rejected' ? 'Rejected' : assignment.status}
                        </Badge>
                        <Badge className={getPriorityBadgeClass(assignment.issue.priority)}>
                          {assignment.issue.priority}
                        </Badge>
                      </div>
                      
                      <p className="text-muted-foreground mb-4 line-clamp-2">
                        {assignment.issue.description || 'No description available'}
                      </p>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <Wrench className="h-3 w-3" />
                          <span>{assignment.issue.category || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(assignment.assignedAt)}</span>
                        </div>

                      </div>

                      {/* Payment Information */}
                      {assignment.paymentAmount && assignment.paymentAmount > 0 && (
                        <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-700">
                            Payment: ₹{assignment.paymentAmount}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedAssignment(assignment);
                          setShowDetailsDialog(true);
                        }}
                        className="hover:bg-primary hover:text-white transition-colors"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                      {getActionButton(assignment)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
        )}

        {/* Load More Section */}
        {hasMoreAssignments && (
          <div ref={loadMoreRef} className="text-center py-8">
            {isLoadingMore ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="text-muted-foreground">Loading more assignments...</span>
              </div>
            ) : (
              <Button 
                variant="outline" 
                onClick={loadMore}
                className="hover:bg-primary hover:text-white transition-all duration-200"
              >
                Load More Assignments
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Assignment Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader className="text-center">
            <DialogTitle className="text-2xl font-bold text-primary">Assignment Details</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Detailed information about this assignment and work requirements
            </DialogDescription>
          </DialogHeader>
          
          {selectedAssignment && selectedAssignment.issue && (
            <div className="space-y-8">
              {/* Main Issue Information - Centered Layout */}
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-6 border border-primary/20">
                <h4 className="text-lg font-semibold text-primary mb-6 text-center">Issue Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex flex-col space-y-2">
                      <span className="text-sm font-medium text-muted-foreground">Title</span>
                      <span className="text-base font-semibold">{selectedAssignment.issue.title}</span>
                    </div>
                    <div className="flex flex-col space-y-2">
                      <span className="text-sm font-medium text-muted-foreground">Category</span>
                      <span className="text-base">{selectedAssignment.issue.category || 'N/A'}</span>
                    </div>
                    <div className="flex flex-col space-y-2">
                      <span className="text-sm font-medium text-muted-foreground">Priority</span>
                      <Badge className={`${getPriorityBadgeClass(selectedAssignment.issue.priority)} text-sm px-3 py-1`}>
                        {selectedAssignment.issue.priority}
                      </Badge>
                    </div>
                    <div className="flex flex-col space-y-2">
                      <span className="text-sm font-medium text-muted-foreground">Status</span>
                      <Badge className={`${getStatusBadgeClass(selectedAssignment.status)} text-sm px-3 py-1`}>
                        {selectedAssignment.status === 'pending' ? 'Pending' :
                         selectedAssignment.status === 'accepted' ? 'Accepted' :
                         selectedAssignment.status === 'in_progress' ? 'In Progress' :
                         selectedAssignment.status === 'completed' ? 'Completed' :
                         selectedAssignment.status === 'rejected' ? 'Rejected' : selectedAssignment.status}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex flex-col space-y-2">
                      <span className="text-sm font-medium text-muted-foreground">Assigned Date</span>
                      <span className="text-base">{formatDate(selectedAssignment.assignedAt)}</span>
                    </div>
                    <div className="flex flex-col space-y-2">
                      <span className="text-sm font-medium text-muted-foreground">Assigned By</span>
                      <span className="text-base">{selectedAssignment.assignedBy?.name || 'N/A'}</span>
                    </div>
                    {selectedAssignment.estimatedCompletionTime && (
                      <div className="flex flex-col space-y-2">
                        <span className="text-sm font-medium text-muted-foreground">Estimated Completion</span>
                        <span className="text-base">{formatDate(selectedAssignment.estimatedCompletionTime)}</span>
                      </div>
                    )}
                    {selectedAssignment.actualCompletionTime && (
                      <div className="flex flex-col space-y-2">
                        <span className="text-sm font-medium text-muted-foreground">Completed Date</span>
                        <span className="text-base">{formatDate(selectedAssignment.actualCompletionTime)}</span>
                      </div>
                    )}
                    {selectedAssignment.timeSpent && (
                      <div className="flex flex-col space-y-2">
                        <span className="text-sm font-medium text-muted-foreground">Time Spent</span>
                        <span className="text-base">{selectedAssignment.timeSpent} minutes</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Description Section */}
              <div className="bg-muted/30 rounded-lg p-6">
                <h4 className="text-lg font-semibold mb-4 text-center">Description</h4>
                <p className="text-base leading-relaxed text-center max-w-2xl mx-auto">
                  {selectedAssignment.issue.description || 'No description available'}
                </p>
              </div>

              {/* Payment Information */}
              {selectedAssignment.paymentAmount && selectedAssignment.paymentAmount > 0 && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
                  <div className="text-center">
                    <h4 className="text-lg font-semibold text-green-700 mb-2">Payment Information</h4>
                    <div className="flex items-center justify-center gap-3">
                      <DollarSign className="h-6 w-6 text-green-600" />
                      <span className="text-2xl font-bold text-green-700">₹{selectedAssignment.paymentAmount}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Media Section */}
              {(selectedAssignment.issue.images?.length > 0 || selectedAssignment.issue.videos?.length > 0) && (
                <div className="bg-muted/30 rounded-lg p-6">
                  <h4 className="text-lg font-semibold mb-6 text-center">Media Attachments</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
                    {selectedAssignment.issue.images?.map((image: any, index: number) => (
                      <div key={`${selectedAssignment._id}-image-${index}`} className="group relative">
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
                    {selectedAssignment.issue.videos?.map((video: any, index: number) => (
                      <div key={`${selectedAssignment._id}-video-${index}`} className="group relative">
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

              {/* Assignment Notes */}
              {selectedAssignment.assignmentNotes && (
                <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                  <h4 className="text-lg font-semibold text-blue-700 mb-4 text-center">Assignment Notes</h4>
                  <p className="text-base leading-relaxed text-center max-w-2xl mx-auto text-blue-800">
                    {selectedAssignment.assignmentNotes}
                  </p>
                </div>
              )}

              {/* Completion Notes */}
              {selectedAssignment.completionNotes && (
                <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                  <h4 className="text-lg font-semibold text-green-700 mb-4 text-center">Completion Notes</h4>
                  <p className="text-base leading-relaxed text-center max-w-2xl mx-auto text-green-800">
                    {selectedAssignment.completionNotes}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Complete Assignment Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Assignment</DialogTitle>
            <DialogDescription>
              Please provide details about the work completed
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Completion Notes *</label>
              <Textarea
                value={completionData.completionNotes}
                onChange={(e) => setCompletionData(prev => ({ ...prev, completionNotes: e.target.value }))}
                placeholder="Describe the work completed, any issues encountered..."
                rows={3}
                className="mt-1"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Time Spent (minutes) *</label>
              <input
                type="number"
                min="1"
                value={completionData.timeSpent}
                onChange={(e) => setCompletionData(prev => ({ ...prev, timeSpent: e.target.value }))}
                placeholder="e.g., 120"
                className="mt-1 w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Materials Used (optional)</label>
              <Textarea
                value={completionData.materialsUsed}
                onChange={(e) => setCompletionData(prev => ({ ...prev, materialsUsed: e.target.value }))}
                placeholder="List any materials used..."
                rows={2}
                className="mt-1"
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCompleteAssignment}
                disabled={!completionData.completionNotes.trim() || !completionData.timeSpent.trim()}
                className="bg-gradient-status text-white hover:opacity-90"
              >
                Mark Complete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Assignment Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Assignment</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting this assignment. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Rejection Reason *</label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why you cannot take this assignment..."
                rows={3}
                className="mt-1"
              />
            </div>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRejectAssignment}
              disabled={!rejectionReason.trim() || isRejecting}
              className="bg-destructive text-destructive-foreground"
            >
              {isRejecting ? 'Rejecting...' : 'Reject Assignment'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TechnicianDashboard;