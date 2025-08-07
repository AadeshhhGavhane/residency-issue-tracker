import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { issuesAPI } from '@/services/api';

export interface Issue {
  _id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'new' | 'assigned' | 'in_progress' | 'resolved' | 'closed';
  location?: {
    type: string;
    coordinates: number[];
  };
  address?: {
    blockNumber?: string;
    apartmentNumber?: string;
    floorNumber?: string;
    area?: string;
  };
  images?: Array<{
    url: string;
    publicId: string;
    uploadedAt: string;
  }>;
  videos?: Array<{
    url: string;
    publicId: string;
    uploadedAt: string;
  }>;
  tags?: string[];
  reportedBy: string;
  reportedByName: string;
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  assignedToName?: string;
  assignedAt?: string;
  resolvedAt?: string;
  completedAt?: string;
  estimatedCompletion?: string;
  assignments?: Array<{
    _id: string;
    assignedTo: {
      _id: string;
      name: string;
      email: string;
    };
    status: string;
    assignedAt: string;
    actualCompletionTime?: string;
  }>;
  // Rating fields for completed issues
  rating?: number;
  ratingComment?: string;
  ratedAt?: string;
}

export interface Assignment {
  _id: string;
  issueId: string;
  issue: Issue;
  technicianId: string;
  assignedBy: string;
  assignedAt: string;
  acceptedAt?: string;
  startedAt?: string;
  completedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'rejected';
  estimatedCompletion?: string;
  actualCompletion?: string;
  workLog?: string[];
  materialsUsed?: string[];
  paymentAmount?: number;
}

interface IssuesState {
  issues: Issue[];
  assignments: Assignment[];
  selectedIssue: Issue | null;
  selectedAssignment: Assignment | null;
  isLoading: boolean;
  error: string | null;
  // Cache for better performance
  cache: {
    issues: Record<string, { data: { issues: Issue[]; pagination: any }; timestamp: number; ttl: number }>;
    assignments: Record<string, { data: { assignments: Assignment[]; pagination: any }; timestamp: number; ttl: number }>;
    analytics: Record<string, { data: any; timestamp: number; ttl: number }>;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    status?: string;
    priority?: string;
    category?: string;
    assignedTo?: string;
    dateRange?: { start: string; end: string };
    search?: string;
  };
}

const initialState: IssuesState = {
  issues: [],
  assignments: [],
  selectedIssue: null,
  selectedAssignment: null,
  isLoading: false,
  error: null,
  cache: {
    issues: {},
    assignments: {},
    analytics: {},
  },
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  filters: {},
};

// Async thunks
export const fetchIssues = createAsyncThunk(
  'issues/fetchIssues',
  async (params: any = {}, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const userRole = state.auth.user?.role;
      const issuesState = state.issues;
      
      // Create cache key
      const cacheKey = JSON.stringify({ params, userRole });
      const cachedData = issuesState.cache.issues[cacheKey];
      
      // Check if cache is valid (5 minutes TTL)
      if (cachedData && Date.now() - cachedData.timestamp < cachedData.ttl) {
        return cachedData.data;
      }
      
      let response;
      if (userRole === 'committee') {
        response = await issuesAPI.getAllIssues(params);
      } else {
        response = await issuesAPI.getIssues(params);
      }
      
      return response.data || response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch issues');
    }
  }
);

export const createIssue = createAsyncThunk(
  'issues/createIssue',
  async (issueData: FormData, { rejectWithValue }) => {
    try {
      const response = await issuesAPI.createIssue(issueData);
      // Backend returns: { success: true, data: { issue }, message: string }
      return response.data?.issue || response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create issue');
    }
  }
);

export const updateIssue = createAsyncThunk(
  'issues/updateIssue',
  async ({ id, data }: { id: string; data: Partial<Issue> }, { rejectWithValue }) => {
    try {
      const response = await issuesAPI.updateIssue(id, data);
      // Backend returns: { success: true, data: { issue }, message: string }
      return response.data?.issue || response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update issue');
    }
  }
);

export const deleteIssue = createAsyncThunk(
  'issues/deleteIssue',
  async (issueId: string, { rejectWithValue }) => {
    try {
      const response = await issuesAPI.deleteIssue(issueId);
      return response.data || response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete issue');
    }
  }
);

export const assignIssue = createAsyncThunk(
  'issues/assignIssue',
  async ({ issueId, data }: { issueId: string; data: any }, { rejectWithValue }) => {
    try {
      const response = await issuesAPI.assignIssue(issueId, data);
      return response.data || response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to assign issue');
    }
  }
);

export const fetchAssignments = createAsyncThunk(
  'issues/fetchAssignments',
  async (params: any = {}, { rejectWithValue }) => {
    try {
      const response = await issuesAPI.getAssignments(params);
      // Backend returns: { success: true, data: { assignments, pagination } }
      return response.data || response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch assignments');
    }
  }
);

export const updateAssignment = createAsyncThunk(
  'issues/updateAssignment',
  async ({ id, action, data }: { id: string; action: string; data?: any }, { rejectWithValue }) => {
    try {
      const response = await issuesAPI.updateAssignment(id, action, data);
      // Backend returns: { success: true, data: { assignment }, message: string }
      return response.data || response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update assignment');
    }
  }
);

const issuesSlice = createSlice({
  name: 'issues',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedIssue: (state, action: PayloadAction<Issue | null>) => {
      state.selectedIssue = action.payload;
    },
    setSelectedAssignment: (state, action: PayloadAction<Assignment | null>) => {
      state.selectedAssignment = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<IssuesState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    setPagination: (state, action: PayloadAction<Partial<IssuesState['pagination']>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Issues
      .addCase(fetchIssues.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchIssues.fulfilled, (state, action) => {
        state.isLoading = false;
        const payload = action.payload as any;
        const issues = payload.issues || payload.data?.issues || [];
        const pagination = payload.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 };
        
        // Cache the data
        const cacheKey = JSON.stringify({ params: action.meta.arg, userRole: 'committee' }); // Simplified key
        state.cache.issues[cacheKey] = {
          data: { issues, pagination },
          timestamp: Date.now(),
          ttl: 5 * 60 * 1000 // 5 minutes
        };
        
        state.issues = issues;
        state.pagination = pagination;
      })
      .addCase(fetchIssues.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create Issue
      .addCase(createIssue.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createIssue.fulfilled, (state, action) => {
        state.isLoading = false;
        const payload = action.payload as any;
        const newIssue = payload.issue || payload;
        state.issues.unshift(newIssue);
      })
      .addCase(createIssue.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update Issue
      .addCase(updateIssue.fulfilled, (state, action) => {
        const payload = action.payload as any;
        const updatedIssue = payload.issue || payload;
        const index = state.issues.findIndex(issue => issue._id === updatedIssue._id);
        if (index !== -1) {
          state.issues[index] = updatedIssue;
        }
        if (state.selectedIssue?._id === updatedIssue._id) {
          state.selectedIssue = updatedIssue;
        }
      })
      // Delete Issue
      .addCase(deleteIssue.fulfilled, (state, action) => {
        const payload = action.payload as any;
        const deletedIssueId = payload.issueId || payload._id || payload;
        state.issues = state.issues.filter(issue => issue._id !== deletedIssueId);
        if (state.selectedIssue?._id === deletedIssueId) {
          state.selectedIssue = null;
        }
      })
      // Fetch Assignments
      .addCase(fetchAssignments.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAssignments.fulfilled, (state, action) => {
        state.isLoading = false;
        const payload = action.payload as any;
        console.log('FetchAssignments fulfilled payload:', payload);
        
        const newAssignments = payload.assignments || payload.data?.assignments || [];
        console.log('New assignments from API:', newAssignments.map(a => ({ id: a._id, status: a.status, title: a.issue?.title })));
        
        state.assignments = newAssignments;
        state.pagination = payload.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 };
        
        console.log('State assignments after fetch:', state.assignments.map(a => ({ id: a._id, status: a.status, title: a.issue?.title })));
      })
      .addCase(fetchAssignments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update Assignment
      .addCase(updateAssignment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateAssignment.fulfilled, (state, action) => {
        state.isLoading = false;
        const payload = action.payload as any;
        
        console.log('UpdateAssignment fulfilled payload:', payload);
        console.log('Current assignments before update:', state.assignments.map(a => ({ id: a._id, status: a.status })));
        
        // Handle different response structures
        let updatedAssignment;
        if (payload.data?.assignment) {
          updatedAssignment = payload.data.assignment;
        } else if (payload.assignment) {
          updatedAssignment = payload.assignment;
        } else if (payload.data) {
          updatedAssignment = payload.data;
        } else {
          updatedAssignment = payload;
        }
        
        console.log('Extracted updated assignment:', updatedAssignment);
        
        // Update the assignment in the assignments array
        if (updatedAssignment && updatedAssignment._id) {
          const index = state.assignments.findIndex(assignment => assignment._id === updatedAssignment._id);
          console.log('Found assignment at index:', index);
          
          if (index !== -1) {
            // Merge the updated assignment with existing data to preserve populated fields
            const existingAssignment = state.assignments[index];
            const newAssignment = {
              ...existingAssignment,
              ...updatedAssignment,
              // Ensure status is updated
              status: updatedAssignment.status || existingAssignment.status
            };
            state.assignments[index] = newAssignment;
            console.log('Updated assignment in state:', newAssignment);
          } else {
            console.log('Assignment not found in state, adding new assignment');
            state.assignments.push(updatedAssignment);
          }
          
          // Update selected assignment if it's the same one
          if (state.selectedAssignment?._id === updatedAssignment._id) {
            state.selectedAssignment = {
              ...state.selectedAssignment,
              ...updatedAssignment,
              status: updatedAssignment.status || state.selectedAssignment.status
            };
          }
        } else {
          console.log('No valid assignment data in payload');
        }
        
        console.log('Assignments after update:', state.assignments.map(a => ({ id: a._id, status: a.status })));
      })
      .addCase(updateAssignment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        console.log('UpdateAssignment rejected:', action.payload);
      })
      // Assign Issue
      .addCase(assignIssue.fulfilled, (state, action) => {
        const payload = action.payload as any;
        const updatedIssue = payload.issue || payload;
        const index = state.issues.findIndex(issue => issue._id === updatedIssue._id);
        if (index !== -1) {
          state.issues[index] = updatedIssue;
        }
        if (state.selectedIssue?._id === updatedIssue._id) {
          state.selectedIssue = updatedIssue;
        }
      });
  },
});

export const {
  clearError,
  setSelectedIssue,
  setSelectedAssignment,
  setFilters,
  clearFilters,
  setPagination,
} = issuesSlice.actions;
export default issuesSlice.reducer;