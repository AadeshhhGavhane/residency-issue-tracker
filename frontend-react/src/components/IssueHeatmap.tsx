import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, TrendingUp, AlertTriangle } from 'lucide-react';

interface Issue {
  _id: string;
  title: string;
  status: string;
  priority: string;
  category: string;
  createdAt: string;
  address?: {
    blockNumber?: string;
    apartmentNumber?: string;
    floorNumber?: string;
    area?: string;
  };
}

interface IssueHeatmapProps {
  issues: Issue[];
}

const IssueHeatmap: React.FC<IssueHeatmapProps> = ({ issues }) => {
  const heatmapData = useMemo(() => {
    if (!Array.isArray(issues) || !issues.length) {
      return {
        locationHeatmap: {},
        timeHeatmap: {},
        categoryHeatmap: {},
        priorityHeatmap: {}
      };
    }

    // Location heatmap
    const locationHeatmap = issues.reduce((acc, issue) => {
      const location = issue.address?.blockNumber || issue.address?.area || 'Unknown';
      acc[location] = (acc[location] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Time heatmap (by hour of day)
    const timeHeatmap = issues.reduce((acc, issue) => {
      const hour = new Date(issue.createdAt).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    // Category heatmap
    const categoryHeatmap = issues.reduce((acc, issue) => {
      acc[issue.category] = (acc[issue.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Priority heatmap
    const priorityHeatmap = issues.reduce((acc, issue) => {
      acc[issue.priority] = (acc[issue.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      locationHeatmap,
      timeHeatmap,
      categoryHeatmap,
      priorityHeatmap
    };
  }, [issues]);

  const getHeatmapColor = (value: number, max: number) => {
    const intensity = value / max;
    if (intensity >= 0.8) return 'bg-red-500';
    if (intensity >= 0.6) return 'bg-orange-500';
    if (intensity >= 0.4) return 'bg-yellow-500';
    if (intensity >= 0.2) return 'bg-blue-500';
    return 'bg-gray-300';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const topLocations = Object.entries(heatmapData.locationHeatmap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const topCategories = Object.entries(heatmapData.categoryHeatmap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const maxLocationValue = Math.max(...Object.values(heatmapData.locationHeatmap), 1);
  const maxTimeValue = Math.max(...Object.values(heatmapData.timeHeatmap), 1);

  return (
    <div className="space-y-6">
      {/* Location Heatmap */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Issue Density by Location</span>
          </CardTitle>
          <CardDescription>
            Areas with the highest issue concentration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topLocations.map(([location, count]) => (
              <div key={location} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded ${getHeatmapColor(count, maxLocationValue)}`} />
                  <span className="font-medium">{location}</span>
                </div>
                <Badge variant="secondary">{count} issues</Badge>
              </div>
            ))}
            {topLocations.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                <p className="text-sm">No location data available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Time Heatmap */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Issue Reports by Hour</span>
          </CardTitle>
          <CardDescription>
            Peak hours for issue reporting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-6 gap-2">
            {Array.from({ length: 24 }, (_, hour) => {
              const count = heatmapData.timeHeatmap[hour] || 0;
              return (
                <div key={hour} className="text-center">
                  <div className={`w-full h-8 rounded ${getHeatmapColor(count, maxTimeValue)} mb-1`} />
                  <span className="text-xs text-muted-foreground">{hour}:00</span>
                  {count > 0 && (
                    <div className="text-xs font-medium">{count}</div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Category Distribution */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Issue Categories</span>
          </CardTitle>
          <CardDescription>
            Distribution of issues by category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topCategories.map(([category, count]) => (
              <div key={category} className="flex items-center justify-between">
                <span className="font-medium capitalize">{category.replace('_', ' ')}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ 
                        width: `${(count / Math.max(...Object.values(heatmapData.categoryHeatmap))) * 100}%` 
                      }}
                    />
                  </div>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Priority Distribution */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Priority Distribution</span>
          </CardTitle>
          <CardDescription>
            Breakdown of issues by priority level
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(heatmapData.priorityHeatmap).map(([priority, count]) => (
              <div key={priority} className="text-center">
                <Badge className={getPriorityColor(priority)}>
                  {priority.toUpperCase()}
                </Badge>
                <div className="text-2xl font-bold mt-2">{count}</div>
                <div className="text-xs text-muted-foreground">issues</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IssueHeatmap; 