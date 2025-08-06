import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Star, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { feedbackAPI } from '@/services/api';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  issueId: string;
  issueTitle: string;
  technicianName?: string;
  onSuccess?: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  issueId,
  issueTitle,
  technicianName,
  onSuccess
}) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    console.log('handleSubmit called', { rating, issueId, comment });
    
    if (rating === 0) {
      console.log('Rating is 0, showing error');
      toast({
        title: "Rating Required",
        description: "Please provide a rating before submitting feedback.",
        variant: "destructive"
      });
      return;
    }

    console.log('Starting submission...');
    setIsSubmitting(true);
    
    try {
      console.log('Calling feedbackAPI.submitFeedback with:', {
        issueId,
        rating,
        comment: comment.trim()
      });
      
      const data = await feedbackAPI.submitFeedback({
        issueId,
        rating,
        comment: comment.trim()
      });
      
      console.log('API response:', data);

      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback!",
      });
      
      onClose();
      // Reset form
      setRating(0);
      setHoverRating(0);
      setComment('');
      // Call success callback to refresh data
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive"
      });
    } finally {
      console.log('Submission finished');
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      setRating(0);
      setHoverRating(0);
      setComment('');
    }
  };

  const handleStarClick = (starValue: number) => {
    setRating(starValue);
  };

  const handleStarHover = (starValue: number) => {
    setHoverRating(starValue);
  };

  const handleStarLeave = () => {
    setHoverRating(0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Rate Your Experience</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            How was your experience with this issue resolution?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Issue Details */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Issue</Label>
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="text-sm font-medium">{issueTitle}</p>
              {technicianName && (
                <p className="text-xs text-gray-600 mt-1">
                  Resolved by: {technicianName}
                </p>
              )}
            </div>
          </div>

          {/* Rating */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Your Rating</Label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                  onClick={() => handleStarClick(star)}
                  onMouseEnter={() => handleStarHover(star)}
                  onMouseLeave={handleStarLeave}
                  disabled={isSubmitting}
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      star <= (hoverRating || rating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300 hover:text-yellow-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-gray-600">
                {rating} out of 5 stars
              </p>
            )}
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment" className="text-sm font-medium">
              Additional Comments (Optional)
            </Label>
            <Textarea
              id="comment"
              placeholder="Share your experience, suggestions, or any additional feedback..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={500}
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500">
              {comment.length}/500 characters
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={rating === 0 || isSubmitting}
              className="min-w-[100px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Star className="h-4 w-4 mr-2" />
                  Submit
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackModal;