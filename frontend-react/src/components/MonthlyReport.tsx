import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Download, TrendingUp, AlertTriangle, CheckCircle, Clock, DollarSign, Users } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Issue {
  _id: string;
  title: string;
  status: string;
  priority: string;
  category: string;
  createdAt: string;
  resolvedAt?: string;
  cost?: number;
  rating?: number;
  ratingComment?: string;
  address?: {
    blockNumber?: string;
    apartmentNumber?: string;
    floorNumber?: string;
    area?: string;
  };
}

interface MonthlyReportProps {
  issues: Issue[];
}

const MonthlyReport: React.FC<MonthlyReportProps> = ({ issues }) => {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const monthlyData = useMemo(() => {
    if (!Array.isArray(issues) || !issues.length) {
      return {
        totalIssues: 0,
        resolvedIssues: 0,
        pendingIssues: 0,
        inProgressIssues: 0,
        totalCost: 0,
        averageCost: 0,
        categoryBreakdown: {},
        priorityBreakdown: {},
        locationBreakdown: {},
        resolutionTime: 0,
        averageRating: 0,
        topIssues: [],
        costByCategory: {},
        dailyTrends: {}
      };
    }

    const [year, month] = selectedMonth.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const monthlyIssues = issues.filter(issue => {
      const issueDate = new Date(issue.createdAt);
      return issueDate >= startDate && issueDate <= endDate;
    });

    const resolvedIssues = monthlyIssues.filter(issue => issue.status === 'resolved');
    const pendingIssues = monthlyIssues.filter(issue => issue.status === 'new');
    const inProgressIssues = monthlyIssues.filter(issue => issue.status === 'in_progress');

    // Category breakdown
    const categoryBreakdown = monthlyIssues.reduce((acc, issue) => {
      acc[issue.category] = (acc[issue.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Priority breakdown
    const priorityBreakdown = monthlyIssues.reduce((acc, issue) => {
      acc[issue.priority] = (acc[issue.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Location breakdown
    const locationBreakdown = monthlyIssues.reduce((acc, issue) => {
      const location = issue.address?.blockNumber || issue.address?.area || 'Unknown';
      acc[location] = (acc[location] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Cost analysis
    const issuesWithCost = monthlyIssues.filter(issue => issue.cost && issue.cost > 0);
    const totalCost = issuesWithCost.reduce((sum, issue) => sum + (issue.cost || 0), 0);
    const averageCost = issuesWithCost.length > 0 ? totalCost / issuesWithCost.length : 0;

    // Cost by category
    const costByCategory = issuesWithCost.reduce((acc, issue) => {
      if (!acc[issue.category]) {
        acc[issue.category] = { totalCost: 0, count: 0 };
      }
      acc[issue.category].totalCost += issue.cost || 0;
      acc[issue.category].count += 1;
      return acc;
    }, {} as Record<string, { totalCost: number; count: number }>);

    // Resolution time analysis
    const resolvedWithTime = resolvedIssues.filter(issue => issue.resolvedAt);
    const totalResolutionTime = resolvedWithTime.reduce((sum, issue) => {
      const created = new Date(issue.createdAt);
      const resolved = new Date(issue.resolvedAt!);
      return sum + (resolved.getTime() - created.getTime());
    }, 0);
    const averageResolutionTime = resolvedWithTime.length > 0 ? totalResolutionTime / resolvedWithTime.length : 0;

    // Rating analysis
    const ratedIssues = monthlyIssues.filter(issue => issue.rating && issue.rating > 0);
    const averageRating = ratedIssues.length > 0 
      ? ratedIssues.reduce((sum, issue) => sum + (issue.rating || 0), 0) / ratedIssues.length 
      : 0;

    // Top issues by cost
    const topIssues = monthlyIssues
      .filter(issue => issue.cost && issue.cost > 0)
      .sort((a, b) => (b.cost || 0) - (a.cost || 0))
      .slice(0, 5);

    // Daily trends
    const dailyTrends = monthlyIssues.reduce((acc, issue) => {
      const date = new Date(issue.createdAt).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalIssues: monthlyIssues.length,
      resolvedIssues: resolvedIssues.length,
      pendingIssues: pendingIssues.length,
      inProgressIssues: inProgressIssues.length,
      totalCost,
      averageCost,
      categoryBreakdown,
      priorityBreakdown,
      locationBreakdown,
      resolutionTime: averageResolutionTime,
      averageRating,
      topIssues,
      costByCategory,
      dailyTrends
    };
  }, [issues, selectedMonth]);

  const generateReport = () => {
    const monthName = new Date(selectedMonth + '-01').toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });

    // Create PDF document
    const doc = new jsPDF();
    
    // Set up fonts and colors
    const primaryColor = [41, 128, 185]; // Blue
    const secondaryColor = [52, 73, 94]; // Dark gray
    const accentColor = [46, 204, 113]; // Green
    const warningColor = [231, 76, 60]; // Red

    // Helper function to add section headers
    const addSectionHeader = (text: string, y: number) => {
      doc.setFontSize(16);
      doc.setTextColor(...primaryColor);
      doc.setFont('helvetica', 'bold');
      doc.text(text, 20, y);
      doc.setDrawColor(...primaryColor);
      doc.line(20, y + 2, 190, y + 2);
      return y + 15;
    };

    // Helper function to add subsection headers
    const addSubsectionHeader = (text: string, y: number) => {
      doc.setFontSize(12);
      doc.setTextColor(...secondaryColor);
      doc.setFont('helvetica', 'bold');
      doc.text(text, 20, y);
      return y + 8;
    };

    // Helper function to add text
    const addText = (text: string, y: number, fontSize = 10, color = secondaryColor) => {
      doc.setFontSize(fontSize);
      doc.setTextColor(...color);
      doc.setFont('helvetica', 'normal');
      doc.text(text, 20, y);
      return y + fontSize + 2;
    };

    // Helper function to add metric
    const addMetric = (label: string, value: string, y: number) => {
      doc.setFontSize(10);
      doc.setTextColor(...secondaryColor);
      doc.setFont('helvetica', 'normal');
      doc.text(label, 20, y);
      
      doc.setFontSize(12);
      doc.setTextColor(...primaryColor);
      doc.setFont('helvetica', 'bold');
      doc.text(value, 80, y);
      return y + 8;
    };

    let yPosition = 20;

    // Header
    doc.setFontSize(24);
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text('MONTHLY MAINTENANCE REPORT', 105, yPosition, { align: 'center' });
    
    yPosition += 10;
    doc.setFontSize(16);
    doc.setTextColor(...secondaryColor);
    doc.setFont('helvetica', 'normal');
    doc.text(monthName.toUpperCase(), 105, yPosition, { align: 'center' });
    
    yPosition += 15;
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`, 105, yPosition, { align: 'center' });

    yPosition += 20;

    // Executive Summary
    yPosition = addSectionHeader('EXECUTIVE SUMMARY', yPosition);
    
    yPosition = addMetric('Total Issues Reported', monthlyData.totalIssues.toString(), yPosition);
    yPosition = addMetric('Resolved Issues', `${monthlyData.resolvedIssues} (${monthlyData.totalIssues > 0 ? Math.round((monthlyData.resolvedIssues / monthlyData.totalIssues) * 100) : 0}%)`, yPosition);
    yPosition = addMetric('Pending Issues', monthlyData.pendingIssues.toString(), yPosition);
    yPosition = addMetric('In Progress Issues', monthlyData.inProgressIssues.toString(), yPosition);
    yPosition = addMetric('Total Maintenance Cost', `₹${monthlyData.totalCost.toLocaleString()}`, yPosition);
    yPosition = addMetric('Average Cost per Issue', `₹${monthlyData.averageCost.toFixed(0)}`, yPosition);
    yPosition = addMetric('Average Customer Rating', `${monthlyData.averageRating.toFixed(1)}/5.0`, yPosition);
    yPosition = addMetric('Average Resolution Time', `${Math.round(monthlyData.resolutionTime / (1000 * 60 * 60 * 24))} days`, yPosition);

    yPosition += 10;

    // Category Analysis
    yPosition = addSectionHeader('CATEGORY ANALYSIS', yPosition);
    
    const categoryData = Object.entries(monthlyData.categoryBreakdown)
      .sort(([, a], [, b]) => b - a)
      .map(([category, count]) => [
        category.replace('_', ' ').toUpperCase(),
        count.toString(),
        `${Math.round((count / monthlyData.totalIssues) * 100)}%`,
        count > (monthlyData.totalIssues / Object.keys(monthlyData.categoryBreakdown).length) ? 'HIGH' : 'NORMAL'
      ]);

    autoTable(doc, {
      head: [['Category', 'Count', 'Percentage', 'Trend']],
      body: categoryData,
      startY: yPosition,
      styles: {
        fontSize: 9,
        cellPadding: 3,
        headStyles: {
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        }
      },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 30, halign: 'center' },
        3: { cellWidth: 30, halign: 'center' }
      }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Priority Distribution
    yPosition = addSectionHeader('PRIORITY DISTRIBUTION', yPosition);
    
    const priorityData = Object.entries(monthlyData.priorityBreakdown)
      .sort(([, a], [, b]) => b - a)
      .map(([priority, count]) => [
        priority.toUpperCase(),
        count.toString(),
        `${Math.round((count / monthlyData.totalIssues) * 100)}%`,
        priority === 'urgent' ? 'CRITICAL' : priority === 'high' ? 'IMPORTANT' : 'STANDARD'
      ]);

    autoTable(doc, {
      head: [['Priority Level', 'Count', 'Percentage', 'Status']],
      body: priorityData,
      startY: yPosition,
      styles: {
        fontSize: 9,
        cellPadding: 3,
        headStyles: {
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        }
      },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 30, halign: 'center' },
        3: { cellWidth: 40, halign: 'center' }
      }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Cost Analysis
    yPosition = addSectionHeader('COST ANALYSIS', yPosition);
    
    const costData = Object.entries(monthlyData.costByCategory)
      .sort(([, a], [, b]) => b.totalCost - a.totalCost)
      .map(([category, data]) => [
        category.replace('_', ' ').toUpperCase(),
        `₹${data.totalCost.toLocaleString()}`,
        data.count.toString(),
        `₹${(data.totalCost / data.count).toFixed(0)}`,
        data.totalCost > (monthlyData.totalCost / Object.keys(monthlyData.costByCategory).length) ? 'HIGH COST' : 'EFFICIENT'
      ]);

    autoTable(doc, {
      head: [['Category', 'Total Cost (₹)', 'Issue Count', 'Average Cost (₹)', 'Efficiency']],
      body: costData,
      startY: yPosition,
      styles: {
        fontSize: 8,
        cellPadding: 2,
        headStyles: {
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        }
      },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 35, halign: 'center' },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 35, halign: 'center' },
        4: { cellWidth: 30, halign: 'center' }
      }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Top Issues by Cost
    yPosition = addSectionHeader('TOP 5 MOST EXPENSIVE ISSUES', yPosition);
    
    const topIssuesData = monthlyData.topIssues.map((issue, index) => [
      `#${index + 1}`,
      issue.title.length > 30 ? issue.title.substring(0, 30) + '...' : issue.title,
      issue.category.replace('_', ' ').toUpperCase(),
      issue.priority.toUpperCase(),
      `₹${issue.cost?.toLocaleString() || '0'}`,
      issue.status.toUpperCase()
    ]);

    autoTable(doc, {
      head: [['Rank', 'Issue Title', 'Category', 'Priority', 'Cost (₹)', 'Status']],
      body: topIssuesData,
      startY: yPosition,
      styles: {
        fontSize: 8,
        cellPadding: 2,
        headStyles: {
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        }
      },
      columnStyles: {
        0: { cellWidth: 20, halign: 'center' },
        1: { cellWidth: 50 },
        2: { cellWidth: 35 },
        3: { cellWidth: 25, halign: 'center' },
        4: { cellWidth: 30, halign: 'center' },
        5: { cellWidth: 30, halign: 'center' }
      }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Performance Metrics
    yPosition = addSectionHeader('PERFORMANCE METRICS', yPosition);
    
    const resolutionRate = monthlyData.totalIssues > 0 ? Math.round((monthlyData.resolvedIssues / monthlyData.totalIssues) * 100) : 0;
    const avgResolutionTime = Math.round(monthlyData.resolutionTime / (1000 * 60 * 60 * 24));
    
    const performanceData = [
      ['Resolution Rate', `${resolutionRate}%`, '>80%', resolutionRate >= 80 ? 'ON TARGET' : 'NEEDS IMPROVEMENT'],
      ['Average Resolution Time', `${avgResolutionTime} days`, '<7 days', avgResolutionTime <= 7 ? 'ON TARGET' : 'NEEDS IMPROVEMENT'],
      ['Customer Satisfaction', `${monthlyData.averageRating.toFixed(1)}/5.0`, '>4.0', monthlyData.averageRating >= 4.0 ? 'EXCELLENT' : 'NEEDS IMPROVEMENT'],
      ['Cost Efficiency', `₹${monthlyData.averageCost.toFixed(0)}/issue`, '<₹1000', monthlyData.averageCost <= 1000 ? 'EFFICIENT' : 'HIGH COST']
    ];

    autoTable(doc, {
      head: [['Metric', 'Value', 'Target', 'Status']],
      body: performanceData,
      startY: yPosition,
      styles: {
        fontSize: 9,
        cellPadding: 3,
        headStyles: {
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        }
      },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 40, halign: 'center' },
        2: { cellWidth: 30, halign: 'center' },
        3: { cellWidth: 40, halign: 'center' }
      }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Recommendations
    yPosition = addSectionHeader('RECOMMENDATIONS', yPosition);
    
    const recommendations = [
      ['Resource Allocation', monthlyData.totalIssues > 50 ? 'Consider increasing technician capacity' : 'Current capacity is adequate', 'MEDIUM'],
      ['Cost Management', monthlyData.averageCost > 1000 ? 'Review cost allocation and vendor pricing' : 'Costs are within acceptable range', 'HIGH'],
      ['Response Time', avgResolutionTime > 7 ? 'Implement faster response protocols' : 'Response times are satisfactory', 'MEDIUM'],
      ['Customer Satisfaction', monthlyData.averageRating < 4.0 ? 'Focus on improving service quality' : 'Maintain current service standards', 'HIGH']
    ];

    autoTable(doc, {
      head: [['Area', 'Recommendation', 'Priority']],
      body: recommendations,
      startY: yPosition,
      styles: {
        fontSize: 9,
        cellPadding: 3,
        headStyles: {
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        }
      },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 80 },
        2: { cellWidth: 30, halign: 'center' }
      }
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(...secondaryColor);
      doc.text(`Page ${i} of ${pageCount}`, 105, 280, { align: 'center' });
      doc.text('Residency Issue Tracker - Monthly Report', 105, 285, { align: 'center' });
    }

    // Save the PDF
    doc.save(`Monthly_Maintenance_Report_${selectedMonth.replace('-', '_')}.pdf`);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'assigned': return 'bg-yellow-100 text-yellow-800';
      case 'new': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Monthly Reports</h2>
          <p className="text-muted-foreground">
            Comprehensive monthly analysis and insights
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
                return (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <Button onClick={generateReport} className="flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Download Report</span>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthlyData.totalIssues}</div>
            <p className="text-xs text-muted-foreground">
              {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{monthlyData.resolvedIssues}</div>
            <p className="text-xs text-muted-foreground">
              {monthlyData.totalIssues > 0 
                ? Math.round((monthlyData.resolvedIssues / monthlyData.totalIssues) * 100) 
                : 0}% resolution rate
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{monthlyData.totalCost.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Avg: ₹{monthlyData.averageCost.toFixed(0)}
            </p>
          </CardContent>
        </Card>

        
      </div>

      {/* Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
            <CardDescription>Issues by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(monthlyData.categoryBreakdown)
                .sort(([, a], [, b]) => b - a)
                .map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="font-medium capitalize">{category.replace('_', ' ')}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ 
                            width: `${(count / monthlyData.totalIssues) * 100}%` 
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

        {/* Priority Breakdown */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Priority Breakdown</CardTitle>
            <CardDescription>Issues by priority level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(monthlyData.priorityBreakdown)
                .sort(([, a], [, b]) => b - a)
                .map(([priority, count]) => (
                  <div key={priority} className="flex items-center justify-between">
                    <Badge className={getPriorityColor(priority)}>
                      {priority.toUpperCase()}
                    </Badge>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-orange-500 h-2 rounded-full" 
                          style={{ 
                            width: `${(count / monthlyData.totalIssues) * 100}%` 
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
      </div>

      {/* Top Issues by Cost */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Top Issues by Cost</CardTitle>
          <CardDescription>Most expensive issues this month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {monthlyData.topIssues.map((issue, index) => (
              <div key={issue._id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                  <div>
                    <p className="font-medium">{issue.title}</p>
                    <p className="text-sm text-muted-foreground">{issue.category}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getPriorityColor(issue.priority)}>
                    {issue.priority}
                  </Badge>
                  <Badge className={getStatusColor(issue.status)}>
                    {issue.status}
                  </Badge>
                  <Badge className="bg-green-100 text-green-800">
                    ₹{issue.cost?.toLocaleString()}
                  </Badge>
                </div>
              </div>
            ))}
            {monthlyData.topIssues.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No issues with cost data for this month</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MonthlyReport; 