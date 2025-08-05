import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Calendar } from 'lucide-react';

interface Issue {
  _id: string;
  title: string;
  status: string;
  priority: string;
  category: string;
  createdAt: string;
}

interface IssueWeeklyHeatmapProps {
  issues: Issue[];
}

const IssueWeeklyHeatmap: React.FC<IssueWeeklyHeatmapProps> = ({ issues }) => {
  const weeklyData = useMemo(() => {
    if (!Array.isArray(issues) || !issues.length) {
      return { weeklyHeatmap: {}, maxValue: 0 };
    }

    // Create a 7x24 grid (days x hours)
    const weeklyHeatmap: Record<number, Record<number, number>> = {};
    let maxValue = 0;

    // Initialize the grid
    for (let day = 0; day < 7; day++) {
      weeklyHeatmap[day] = {};
      for (let hour = 0; hour < 24; hour++) {
        weeklyHeatmap[day][hour] = 0;
      }
    }

    // Populate the grid
    issues.forEach(issue => {
      const date = new Date(issue.createdAt);
      const day = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const hour = date.getHours();
      
      weeklyHeatmap[day][hour]++;
      maxValue = Math.max(maxValue, weeklyHeatmap[day][hour]);
    });

    return { weeklyHeatmap, maxValue };
  }, [issues]);

  const getHeatmapColor = (value: number, maxValue: number) => {
    if (value === 0) return 'bg-gray-100';
    const intensity = value / maxValue;
    if (intensity >= 0.8) return 'bg-red-500';
    if (intensity >= 0.6) return 'bg-orange-500';
    if (intensity >= 0.4) return 'bg-yellow-500';
    if (intensity >= 0.2) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hourLabels = Array.from({ length: 24 }, (_, i) => `${i}:00`);

  const getTooltipText = (day: number, hour: number, count: number) => {
    const dayName = dayLabels[day];
    const hourLabel = hourLabels[hour];
    return `${dayName} ${hourLabel}: ${count} issue${count !== 1 ? 's' : ''}`;
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="h-5 w-5" />
          <span>Weekly Issue Patterns</span>
        </CardTitle>
        <CardDescription>
          Issue activity by day of week and hour of day
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Weekly Heatmap Grid */}
          <div className="overflow-x-auto">
            <div className="min-w-max">
              {/* Hour labels */}
              <div className="flex mb-2">
                <div className="w-12"></div> {/* Empty space for day labels */}
                {hourLabels.map((hour, index) => (
                  <div key={index} className="w-6 text-xs text-muted-foreground text-center">
                    {index % 6 === 0 ? hour : ''}
                  </div>
                ))}
              </div>

              {/* Heatmap grid */}
              {dayLabels.map((dayLabel, dayIndex) => (
                <div key={dayIndex} className="flex items-center mb-1">
                  <div className="w-12 text-xs font-medium">{dayLabel}</div>
                  {Array.from({ length: 24 }, (_, hourIndex) => {
                    const count = weeklyData.weeklyHeatmap[dayIndex][hourIndex];
                    return (
                      <div
                        key={hourIndex}
                        className={`w-6 h-6 rounded-sm ${getHeatmapColor(count, weeklyData.maxValue)} hover:scale-110 transition-transform cursor-pointer`}
                        title={getTooltipText(dayIndex, hourIndex, count)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Less</span>
            <div className="flex space-x-1">
              <div className="w-4 h-4 bg-gray-100 rounded-sm" />
              <div className="w-4 h-4 bg-green-500 rounded-sm" />
              <div className="w-4 h-4 bg-blue-500 rounded-sm" />
              <div className="w-4 h-4 bg-yellow-500 rounded-sm" />
              <div className="w-4 h-4 bg-orange-500 rounded-sm" />
              <div className="w-4 h-4 bg-red-500 rounded-sm" />
            </div>
            <span>More</span>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {dayLabels.reduce((maxDay, day, index) => {
                  const dayTotal = Object.values(weeklyData.weeklyHeatmap[index]).reduce((sum, count) => sum + count, 0);
                  return dayTotal > maxDay.total ? { day, total: dayTotal } : maxDay;
                }, { day: 'None', total: 0 }).day}
              </div>
              <div className="text-xs text-muted-foreground">Busiest Day</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Array.from({ length: 24 }, (_, hour) => 
                  Object.values(weeklyData.weeklyHeatmap).reduce((sum, dayData) => sum + dayData[hour], 0)
                ).reduce((maxHour, total, hour) => total > maxHour.total ? { hour, total } : maxHour, { hour: 0, total: 0 }).hour}:00
              </div>
              <div className="text-xs text-muted-foreground">Peak Hour</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(issues.length / 7 * 10) / 10}
              </div>
              <div className="text-xs text-muted-foreground">Avg Daily Issues</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default IssueWeeklyHeatmap; 