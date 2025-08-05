import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, TrendingUp } from 'lucide-react';

interface Issue {
  _id: string;
  title: string;
  status: string;
  priority: string;
  category: string;
  createdAt: string;
}

interface IssueCalendarHeatmapProps {
  issues: Issue[];
}

const IssueCalendarHeatmap: React.FC<IssueCalendarHeatmapProps> = ({ issues }) => {
  const calendarData = useMemo(() => {
    if (!Array.isArray(issues) || !issues.length) {
      return { dailyCounts: {}, maxCount: 0 };
    }

    // Group issues by date
    const dailyCounts: Record<string, number> = {};
    let maxCount = 0;

    issues.forEach(issue => {
      const date = new Date(issue.createdAt).toISOString().split('T')[0];
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
      maxCount = Math.max(maxCount, dailyCounts[date]);
    });

    return { dailyCounts, maxCount };
  }, [issues]);

  const getHeatmapColor = (count: number, maxCount: number) => {
    if (count === 0) return 'bg-gray-100';
    const intensity = count / maxCount;
    if (intensity >= 0.8) return 'bg-red-500';
    if (intensity >= 0.6) return 'bg-orange-500';
    if (intensity >= 0.4) return 'bg-yellow-500';
    if (intensity >= 0.2) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const generateCalendarDays = () => {
    const days = [];
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 90); // Show last 90 days

    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const count = calendarData.dailyCounts[dateStr] || 0;
      days.push({
        date: dateStr,
        count,
        isToday: dateStr === today.toISOString().split('T')[0]
      });
    }

    return days;
  };

  const calendarDays = generateCalendarDays();
  const weeks = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  const getMonthLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short' });
  };

  const getTooltipText = (day: { date: string; count: number }) => {
    const date = new Date(day.date);
    const formattedDate = date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    return `${formattedDate}: ${day.count} issue${day.count !== 1 ? 's' : ''}`;
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="h-5 w-5" />
          <span>Issue Activity Calendar</span>
        </CardTitle>
        <CardDescription>
          Issue density over the last 90 days
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Calendar Grid */}
          <div className="flex space-x-2">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col space-y-1">
                {week.map((day, dayIndex) => (
                  <div
                    key={day.date}
                    className={`w-3 h-3 rounded-sm ${getHeatmapColor(day.count, calendarData.maxCount)} ${
                      day.isToday ? 'ring-2 ring-blue-500' : ''
                    } hover:scale-125 transition-transform cursor-pointer`}
                    title={getTooltipText(day)}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Less</span>
            <div className="flex space-x-1">
              <div className="w-3 h-3 bg-gray-100 rounded-sm" />
              <div className="w-3 h-3 bg-green-500 rounded-sm" />
              <div className="w-3 h-3 bg-blue-500 rounded-sm" />
              <div className="w-3 h-3 bg-yellow-500 rounded-sm" />
              <div className="w-3 h-3 bg-orange-500 rounded-sm" />
              <div className="w-3 h-3 bg-red-500 rounded-sm" />
            </div>
            <span>More</span>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Object.values(calendarData.dailyCounts).filter(count => count > 0).length}
              </div>
              <div className="text-xs text-muted-foreground">Active Days</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.max(...Object.values(calendarData.dailyCounts), 0)}
              </div>
              <div className="text-xs text-muted-foreground">Peak Daily Issues</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(Object.values(calendarData.dailyCounts).reduce((sum, count) => sum + count, 0) / 90 * 10) / 10}
              </div>
              <div className="text-xs text-muted-foreground">Avg Daily Issues</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default IssueCalendarHeatmap; 