import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  AlertCircle, 
  AlertOctagon, 
  RefreshCw, 
  TrendingUp,
  MapPin,
  DollarSign,
  Clock,
  Loader2,
  Mail
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { recurringAlertsAPI } from '@/services/api';

interface RecurringProblem {
  id: string;
  category: string;
  location: {
    blockNumber?: string;
    area?: string;
  };
  issueCount: number;
  recentIssueCount: number;
  totalCost: number;
  severityLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  lastReported: string;
  unresolvedCount: number;
}

interface RecurringProblemsData {
  recurringProblems: RecurringProblem[];
  totalCount: number;
  highSeverityCount: number;
  mediumSeverityCount: number;
  lowSeverityCount: number;
}

const RecurringProblemsAlert: React.FC = () => {
  const [data, setData] = useState<RecurringProblemsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const { toast } = useToast();

  const fetchRecurringProblems = async () => {
    setIsLoading(true);
    try {
      const result = await recurringAlertsAPI.getRecurringAlerts();
      setData(result.data);
    } catch (error) {
      console.error('Error fetching recurring problems:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const triggerDetection = async () => {
    setIsDetecting(true);
    try {
      await recurringAlertsAPI.detectRecurringProblems();
      
      toast({
        title: "Detection Complete",
        description: "Recurring problem detection completed successfully",
      });
      // Refresh the data
      await fetchRecurringProblems();
    } catch (error) {
      console.error('Error triggering detection:', error);
      toast({
        title: "Error",
        description: "Failed to trigger recurring problem detection",
        variant: "destructive"
      });
    } finally {
      setIsDetecting(false);
    }
  };

  useEffect(() => {
    fetchRecurringProblems();
  }, []);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return <AlertOctagon className="h-4 w-4 text-red-600" />;
      case 'MEDIUM':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'LOW':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'MEDIUM':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'LOW':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getLocationText = (location: any) => {
    // Use readable address if available
    if (location.readableAddress) {
      return location.readableAddress;
    }
    
    // Fallback to block/area
    if (location.blockNumber && location.area) {
      return `Block ${location.blockNumber}, ${location.area}`;
    } else if (location.blockNumber) {
      return `Block ${location.blockNumber}`;
    } else if (location.area) {
      return location.area;
    }
    return 'Unknown Location';
  };

  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <span>Recurring Problems</span>
          </CardTitle>
          <CardDescription>Detecting recurring issues...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.totalCount === 0) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-green-600" />
            <span>Recurring Problems</span>
          </CardTitle>
          <CardDescription>No recurring problems detected</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">
              No recurring problems have been detected in the system.
            </p>
            <Button 
              onClick={triggerDetection} 
              disabled={isDetecting}
              variant="outline"
              size="sm"
            >
              {isDetecting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Detecting...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Run Detection
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <CardTitle>Recurring Problems Alert</CardTitle>
          </div>
          <Button 
            onClick={triggerDetection} 
            disabled={isDetecting}
            variant="outline"
            size="sm"
          >
            {isDetecting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Detecting...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Send Alerts
              </>
            )}
          </Button>
        </div>
        <CardDescription>
          {data.totalCount} recurring problems detected requiring attention
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{data.highSeverityCount}</div>
            <div className="text-sm text-muted-foreground">High Severity</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{data.mediumSeverityCount}</div>
            <div className="text-sm text-muted-foreground">Medium Severity</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{data.lowSeverityCount}</div>
            <div className="text-sm text-muted-foreground">Low Severity</div>
          </div>
        </div>

        {/* Recurring Problems List */}
        <div className="space-y-4">
          {data.recurringProblems.map((problem) => (
            <div 
              key={problem.id} 
              className={`p-4 rounded-lg border ${getSeverityColor(problem.severityLevel)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    {getSeverityIcon(problem.severityLevel)}
                    <h3 className="font-semibold capitalize">{problem.category}</h3>
                    <Badge variant="outline" className={getSeverityColor(problem.severityLevel)}>
                      {problem.severityLevel}
                    </Badge>
                  </div>
                  <p className="text-sm mb-2">
                    <strong>Location:</strong> {getLocationText(problem.location)}
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Total Issues:</strong> {problem.issueCount}
                    </div>
                    <div>
                      <strong>Recent (30 days):</strong> {problem.recentIssueCount}
                    </div>
                    <div>
                      <strong>Unresolved:</strong> {problem.unresolvedCount}
                    </div>
                    <div>
                      <strong>Total Cost:</strong> ₹{problem.totalCost.toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <div>Last reported</div>
                  <div>{new Date(problem.lastReported).toLocaleDateString()}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-800">Action Required</h4>
              <p className="text-sm text-amber-700 mt-1">
                These recurring problems have been automatically detected and email alerts have been sent to committee members. 
                Please review and take appropriate action to address these issues.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecurringProblemsAlert; 