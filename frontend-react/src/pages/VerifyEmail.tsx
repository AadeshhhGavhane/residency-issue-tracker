import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Mail, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { authAPI } from '@/services/api';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isResending, setIsResending] = useState(false);

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('No verification token found. Please use the link from your email.');
      return;
    }

    verifyEmail();
  }, [token]);

  const verifyEmail = async () => {
    try {
      const response = await authAPI.verifyEmail(token);
      if (response.success) {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMessage(response.message || 'Email verification failed');
      }
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error.response?.data?.message || 'Network error. Please try again.');
    }
  };

  const resendVerification = async () => {
    if (!email) {
      setErrorMessage('Email address not found. Please go back to login and try again.');
      return;
    }

    setIsResending(true);
    try {
      const response = await authAPI.resendVerification(email);
      if (response.success) {
        setErrorMessage('');
        alert('Verification email sent successfully! Please check your inbox.');
      } else {
        setErrorMessage(response.message || 'Failed to resend verification email');
      }
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || 'Failed to resend verification email');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-elevated border-0">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-hero rounded-full flex items-center justify-center shadow-glow">
              <Mail className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Verify Email</CardTitle>
              <CardDescription>
                Verifying your email address
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {status === 'verifying' && (
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground">Verifying your email address...</p>
              </div>
            )}

            {status === 'success' && (
              <div className="text-center space-y-4">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                <div>
                  <h3 className="text-xl font-semibold text-green-600">Email Verified!</h3>
                  <p className="text-muted-foreground">Your email has been successfully verified.</p>
                </div>
                <Button 
                  onClick={() => navigate('/login')}
                  className="w-full bg-gradient-hero hover:opacity-90"
                >
                  Continue to Login
                </Button>
              </div>
            )}

            {status === 'error' && (
              <div className="text-center space-y-4">
                <XCircle className="h-16 w-16 text-red-500 mx-auto" />
                <div>
                  <h3 className="text-xl font-semibold text-red-600">Verification Failed</h3>
                  <p className="text-muted-foreground">{errorMessage}</p>
                </div>
                <div className="space-y-2">
                  <Button 
                    onClick={() => navigate('/login')}
                    variant="outline"
                    className="w-full"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Login
                  </Button>
                  {email && (
                    <Button 
                      onClick={resendVerification}
                      disabled={isResending}
                      className="w-full"
                    >
                      {isResending ? 'Sending...' : 'Resend Email'}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerifyEmail; 