import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RootState } from '@/store';
import api from '@/services/api';

const Index = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  useEffect(() => {
    // Test API connection
    const testApiConnection = async () => {
      try {
        const response = await api.get('/health');
        console.log('API Health Check Response:', response);
        setApiStatus('connected');
      } catch (error) {
        console.error('API Health Check Error:', error);
        setApiStatus('error');
      }
    };

    testApiConnection();
  }, []);

  const getApiStatusBadge = () => {
    switch (apiStatus) {
      case 'connected':
        return <Badge className="bg-green-500">API Connected</Badge>;
      case 'error':
        return <Badge className="bg-red-500">API Error</Badge>;
      default:
        return <Badge className="bg-yellow-500">Checking...</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Section */}
      <div className="bg-gradient-card rounded-lg p-6 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome back, {user?.name || 'User'}!
            </h1>
            <p className="text-muted-foreground">
              Your Society Tracker dashboard is ready.
            </p>
          </div>
          {getApiStatusBadge()}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">API Status</CardTitle>
            <CardDescription>Backend connection status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {apiStatus === 'connected' ? '✅ Connected' : 
               apiStatus === 'error' ? '❌ Error' : '⏳ Checking...'}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">User Role</CardTitle>
            <CardDescription>Your current role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {user?.role || 'Unknown'}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">User ID</CardTitle>
            <CardDescription>Your unique identifier</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-mono text-muted-foreground">
              {user?.id || 'Not available'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and navigation</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button variant="outline" className="h-auto p-4 flex-col">
            <span className="font-semibold">View Dashboard</span>
            <span className="text-sm text-muted-foreground">Go to main dashboard</span>
          </Button>
          <Button variant="outline" className="h-auto p-4 flex-col">
            <span className="font-semibold">Report Issue</span>
            <span className="text-sm text-muted-foreground">Submit new issue</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
