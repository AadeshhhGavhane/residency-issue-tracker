import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { authAPI } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Smartphone } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const MobileVerification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isResending, setIsResending] = useState(false);

  // Get token from URL
  const token = searchParams.get('token');

  useEffect(() => {
    // If token is provided in URL, verify automatically
    if (token) {
      handleVerification();
    }
  }, [token]);

  const handleVerification = async () => {
    if (!token) {
      setError('No verification token found in URL');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response: any = await authAPI.verifyMobile(token);
      
      if (response && response.success) {
        setIsSuccess(true);
        toast({
          title: "Mobile verification successful!",
          description: "Your mobile number has been verified successfully.",
        });
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setError(response?.message || 'Verification failed');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setIsResending(true);
    setError('');

    try {
      // Get user's phone number from localStorage or state
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const phoneNumber = user.phoneNumber;

      if (!phoneNumber) {
        setError('Phone number not found. Please contact support.');
        return;
      }

      const response: any = await authAPI.sendMobileVerification(phoneNumber);
      
      if (response && response.success) {
        toast({
          title: "Verification link sent!",
          description: "A new verification link has been sent to your WhatsApp.",
        });
      } else {
        setError(response?.message || 'Failed to send verification link');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to send verification link. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Mobile Verified!</CardTitle>
            <CardDescription>
              Your mobile number has been successfully verified.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              You will be redirected to your dashboard shortly.
            </p>
            <Button onClick={() => navigate('/dashboard')} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
            </div>
            <CardTitle className="text-2xl">Verifying Mobile...</CardTitle>
            <CardDescription>
              Please wait while we verify your mobile number.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Smartphone className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Mobile Verification</CardTitle>
          <CardDescription>
            {token 
              ? 'Verifying your mobile number...'
              : 'No verification token found. Please check your WhatsApp for the verification link.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {!token && (
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600">
                If you haven't received the verification link, you can request a new one.
              </p>
              
              <Button
                onClick={handleResendVerification}
                disabled={isResending}
                className="w-full"
              >
                {isResending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Resend Verification Link'
                )}
              </Button>
            </div>
          )}

          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              className="text-sm"
            >
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileVerification; 