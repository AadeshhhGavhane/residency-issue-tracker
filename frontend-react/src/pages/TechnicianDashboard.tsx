import { useEffect, useState } from 'react';
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

  useEffect(() => {
    dispatch(fetchAssignments({}));
  }, [dispatch]);

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
      await dispatch(updateAssignment({ id: assignmentId, action: 'start' }));
      dispatch(fetchAssignments({}));
    } catch (error) {
      console.error('Error starting work:', error);
    }
  };

  const handleCompleteAssignment = async () => {
    if (selectedAssignment && completionData.completionNotes.trim() && completionData.timeSpent.trim()) {
      try {
        await dispatch(updateAssignment({
          id: selectedAssignment._id,
          action: 'complete',
          data: {
            completionNotes: completionData.completionNotes,
            timeSpent: parseInt(completionData.timeSpent),
            materialsUsed: completionData.materialsUsed
          }
        }));
        setShowCompleteDialog(false);
        setCompletionData({ completionNotes: '', timeSpent: '', materialsUsed: '' });
        setSelectedAssignment(null);
        dispatch(fetchAssignments({}));
      } catch (error) {
        console.error('Error completing assignment:', error);
      }
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
    <div className="space-y-6">
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
          assignments
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
                        {assignment.issue.address && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>Block {assignment.issue.address.blockNumber || 'N/A'}</span>
                          </div>
                        )}
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
      </div>

      {/* Assignment Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-primary">Assignment Details</DialogTitle>
            <DialogDescription>
              Detailed information about this assignment and work requirements
            </DialogDescription>
          </DialogHeader>
          
          {selectedAssignment && selectedAssignment.issue && (
            <div className="space-y-6">
              {/* Issue Information */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-4">Issue Information</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium">Title:</span>
                      <span>{selectedAssignment.issue.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Description:</span>
                      <span className="text-right">{selectedAssignment.issue.description || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Category:</span>
                      <span>{selectedAssignment.issue.category || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Priority:</span>
                      <Badge className={getPriorityBadgeClass(selectedAssignment.issue.priority)}>
                        {selectedAssignment.issue.priority}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Status:</span>
                      <Badge className={getStatusBadgeClass(selectedAssignment.status)}>
                        {selectedAssignment.status === 'pending' ? 'Pending' :
                         selectedAssignment.status === 'accepted' ? 'Accepted' :
                         selectedAssignment.status === 'in_progress' ? 'In Progress' :
                         selectedAssignment.status === 'completed' ? 'Completed' :
                         selectedAssignment.status === 'rejected' ? 'Rejected' : selectedAssignment.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Assigned:</span>
                      <span>{formatDate(selectedAssignment.assignedAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Assigned by:</span>
                      <span>{selectedAssignment.assignedBy?.name || 'N/A'}</span>
                    </div>
                    {selectedAssignment.estimatedCompletionTime && (
                      <div className="flex justify-between">
                        <span className="font-medium">Estimated completion:</span>
                        <span>{formatDate(selectedAssignment.estimatedCompletionTime)}</span>
                      </div>
                    )}
                    {selectedAssignment.actualCompletionTime && (
                      <div className="flex justify-between">
                        <span className="font-medium">Completed:</span>
                        <span>{formatDate(selectedAssignment.actualCompletionTime)}</span>
                      </div>
                    )}
                    {selectedAssignment.timeSpent && (
                      <div className="flex justify-between">
                        <span className="font-medium">Time spent:</span>
                        <span>{selectedAssignment.timeSpent} minutes</span>
                      </div>
                    )}
                    {selectedAssignment.paymentAmount && selectedAssignment.paymentAmount > 0 && (
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200 mt-3">
                        <span className="font-medium text-green-700">Payment Amount:</span>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="text-lg font-bold text-green-700">₹{selectedAssignment.paymentAmount}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-4">Location</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>Block: {selectedAssignment.issue.address?.blockNumber || 'N/A'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>Apartment: {selectedAssignment.issue.address?.apartmentNumber || 'N/A'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Floor: {selectedAssignment.issue.address?.floorNumber || 'N/A'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>Area: {selectedAssignment.issue.address?.area || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Media */}
              {(selectedAssignment.issue.images?.length > 0 || selectedAssignment.issue.videos?.length > 0) && (
                <div>
                  <h4 className="font-medium mb-4">Media</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {selectedAssignment.issue.images?.map((image: any, index: number) => (
                      <img
                        key={`${selectedAssignment._id}-image-${index}`}
                        src={image.url}
                        alt={`Issue ${index + 1}`}
                        className="aspect-square object-cover rounded-lg"
                      />
                    ))}
                    {selectedAssignment.issue.videos?.map((video: any, index: number) => (
                      <video
                        key={`${selectedAssignment._id}-video-${index}`}
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

              {/* Assignment Notes */}
              {selectedAssignment.assignmentNotes && (
                <div>
                  <h4 className="font-medium mb-4">Assignment Notes</h4>
                  <p className="text-muted-foreground">{selectedAssignment.assignmentNotes}</p>
                </div>
              )}

              {/* Completion Notes */}
              {selectedAssignment.completionNotes && (
                <div>
                  <h4 className="font-medium mb-4">Completion Notes</h4>
                  <p className="text-muted-foreground">{selectedAssignment.completionNotes}</p>
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