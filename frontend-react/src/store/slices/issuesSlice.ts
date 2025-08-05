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
  // Cost field
  cost?: number;
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
}

interface IssuesState {
  issues: Issue[];
  assignments: Assignment[];
  selectedIssue: Issue | null;
  selectedAssignment: Assignment | null;
  isLoading: boolean;
  error: string | null;
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
      // Get user role from state to determine which endpoint to use
      const state = getState() as any;
      const userRole = state.auth.user?.role;
      
      let response;
      if (userRole === 'committee') {
        // Committee members can see all issues
        response = await issuesAPI.getAllIssues(params);
      } else {
        // Regular users see only their issues
        response = await issuesAPI.getIssues(params);
      }
      
      // Backend returns: { success: true, data: { issues, pagination } }
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
        state.issues = payload.issues || payload.data?.issues || [];
        state.pagination = payload.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 };
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
        state.assignments = payload.assignments || payload.data?.assignments || [];
        state.pagination = payload.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 };
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
        const updatedAssignment = payload.data?.assignment || payload.assignment || payload;
        const index = state.assignments.findIndex(assignment => assignment._id === updatedAssignment._id);
        if (index !== -1) {
          state.assignments[index] = updatedAssignment;
        }
        if (state.selectedAssignment?._id === updatedAssignment._id) {
          state.selectedAssignment = updatedAssignment;
        }
      })
      .addCase(updateAssignment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
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