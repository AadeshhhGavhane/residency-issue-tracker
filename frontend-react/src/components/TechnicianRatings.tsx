import React, { useEffect, useState } from 'react';
import { Star, Users, TrendingUp, Award } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import StarRating from '@/components/ui/star-rating';

interface TechnicianRating {
  _id: string;
  name: string;
  specializations: string[];
  feedbacks: number[];
  rating: number;
  ratingSummary?: {
    averageRating: number;
    totalRatings: number;
    ratingPercentage: number;
  };
}

interface TechnicianRatingsProps {
  technicians: TechnicianRating[];
  isLoading?: boolean;
}

const TechnicianRatings: React.FC<TechnicianRatingsProps> = ({
  technicians,
  isLoading = false
}) => {
  const [sortedTechnicians, setSortedTechnicians] = useState<TechnicianRating[]>([]);

  useEffect(() => {
    // Sort by rating (highest first), then by number of ratings
    const sorted = [...(technicians || [])].sort((a, b) => {
      if (a.rating !== b.rating) {
        return b.rating - a.rating;
      }
      return (b.feedbacks?.length || 0) - (a.feedbacks?.length || 0);
    });
    setSortedTechnicians(sorted);
  }, [technicians]);

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 4.0) return 'text-blue-600';
    if (rating >= 3.5) return 'text-yellow-600';
    if (rating >= 3.0) return 'text-orange-600';
    return 'text-red-600';
  };

  const getRatingBadgeColor = (rating: number) => {
    if (rating >= 4.5) return 'bg-green-100 text-green-800';
    if (rating >= 4.0) return 'bg-blue-100 text-blue-800';
    if (rating >= 3.5) return 'bg-yellow-100 text-yellow-800';
    if (rating >= 3.0) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const formatSpecializations = (specializations: string[]) => {
    const labels: { [key: string]: string } = {
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

    if (!specializations || specializations.length === 0) {
      return 'General Maintenance';
    }
    return specializations.map(spec => labels[spec] || spec).join(', ');
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-muted-foreground">Loading technician ratings...</p>
        </div>
      </div>
    );
  }

  if (sortedTechnicians.length === 0) {
    return (
      <Card className="shadow-card">
        <CardContent className="text-center py-12">
          <div className="text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">No technicians found</h3>
            <p>No technician ratings are available at the moment.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Technicians</p>
                <p className="text-2xl font-bold">{sortedTechnicians.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Rating</p>
                <p className="text-2xl font-bold">
                  {sortedTechnicians.length > 0 
                    ? (sortedTechnicians.reduce((sum, tech) => sum + (tech.rating || 0), 0) / sortedTechnicians.length).toFixed(1)
                    : '0.0'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Top Rated</p>
                <p className="text-2xl font-bold">
                  {sortedTechnicians.filter(tech => tech.rating >= 4.5).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Technician Ratings */}
      <div className="space-y-4">
        {sortedTechnicians.map((technician) => (
          <Card key={technician._id} className="shadow-card hover:shadow-elevated transition-shadow">
            <CardContent className="pt-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-semibold text-lg">{technician.name}</h3>
                    <Badge className={getRatingBadgeColor(technician.rating || 0)}>
                      {(technician.rating || 0).toFixed(1)} ★
                    </Badge>
                    {(technician.rating || 0) >= 4.5 && (
                      <Badge className="bg-green-100 text-green-800">
                        <Award className="h-3 w-3 mr-1" />
                        Top Rated
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-muted-foreground mb-3">
                    {formatSpecializations(technician.specializations)}
                  </p>
                  
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span className="flex items-center">
                      <Star className="h-4 w-4 mr-1 text-yellow-500" />
                      {technician.feedbacks?.length || 0} ratings
                    </span>
                    <span className="flex items-center">
                      <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
                      {technician.ratingSummary?.ratingPercentage?.toFixed(0) || '0'}% positive
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {/* Star Rating Display */}
                  <div className="flex items-center space-x-2">
                    <StarRating
                      rating={Math.round(technician.rating || 0)}
                      readonly
                      size="sm"
                    />
                    <span className={`text-sm font-medium ${getRatingColor(technician.rating || 0)}`}>
                      {(technician.rating || 0).toFixed(1)}
                    </span>
                  </div>

                  {/* Rating Summary */}
                  <div className="hidden lg:flex items-center space-x-2 text-xs text-muted-foreground">
                    <span>Average: {(technician.rating || 0).toFixed(1)}</span>
                    <span>•</span>
                    <span>{technician.feedbacks?.length || 0} ratings</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TechnicianRatings; 