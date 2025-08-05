// Issues API Module
const issues = {
    // API base URL
    baseURL: 'http://localhost:5000/api',

    /**
     * Report a new issue
     * @param {FormData} formData - Form data containing issue details
     * @returns {Promise} API response
     */
    async reportIssue(formData) {
        try {
            const response = await fetch(`${this.baseURL}/issues`, {
                method: 'POST',
                credentials: 'include', // Include cookies for authentication
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to report issue');
            }

            return await response.json();
        } catch (error) {
            console.error('Report issue error:', error);
            throw error;
        }
    },

    /**
     * Get all issues (filtered by user role)
     * @param {Object} filters - Query parameters
     * @returns {Promise} API response
     */
    async getIssues(filters = {}) {
        try {
            const queryParams = new URLSearchParams(filters);
            
            // Use admin endpoint ONLY for committee members
            let endpoint = '/issues';
            
            // Check if auth is available and user has committee role
            if (typeof auth !== 'undefined' && auth.currentUser) {
                if (auth.currentUser.role === 'committee') {
                    endpoint = '/issues/admin/all';
                }
                // Technicians should NOT use admin endpoint - they should use regular endpoint
                // which will show them their own issues (if any) or empty list
            }
            
            const response = await fetch(`${this.baseURL}${endpoint}?${queryParams}`, {
                method: 'GET',
                credentials: 'include', // Include cookies for authentication
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to fetch issues');
            }

            return await response.json();
        } catch (error) {
            console.error('Get issues error:', error);
            throw error;
        }
    },

    /**
     * Get issue by ID
     * @param {string} issueId - Issue ID
     * @returns {Promise} API response
     */
    async getIssue(issueId) {
        try {
            const response = await fetch(`${this.baseURL}/issues/${issueId}`, {
                method: 'GET',
                credentials: 'include', // Include cookies for authentication
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to fetch issue');
            }

            return await response.json();
        } catch (error) {
            console.error('Get issue error:', error);
            throw error;
        }
    },

    /**
     * Update issue
     * @param {string} issueId - Issue ID
     * @param {Object} data - Update data
     * @returns {Promise} API response
     */
    async updateIssue(issueId, data) {
        try {
            const response = await fetch(`${this.baseURL}/issues/${issueId}`, {
                method: 'PUT',
                credentials: 'include', // Include cookies for authentication
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to update issue');
            }

            return await response.json();
        } catch (error) {
            console.error('Update issue error:', error);
            throw error;
        }
    },

    /**
     * Delete issue
     * @param {string} issueId - Issue ID
     * @returns {Promise} API response
     */
    async deleteIssue(issueId) {
        try {
            const response = await fetch(`${this.baseURL}/issues/${issueId}`, {
                method: 'DELETE',
                credentials: 'include', // Include cookies for authentication
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to delete issue');
            }

            return await response.json();
        } catch (error) {
            console.error('Delete issue error:', error);
            throw error;
        }
    },

    /**
     * Assign issue to technician
     * @param {string} issueId - Issue ID
     * @param {Object} data - Assignment data
     * @returns {Promise} API response
     */
    async assignIssue(issueId, data) {
        try {
            const response = await fetch(`${this.baseURL}/issues/${issueId}/assign`, {
                method: 'POST',
                credentials: 'include', // Include cookies for authentication
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to assign issue');
            }

            return await response.json();
        } catch (error) {
            console.error('Assign issue error:', error);
            throw error;
        }
    },

    /**
     * Update issue status
     * @param {string} issueId - Issue ID
     * @param {Object} data - Status update data
     * @returns {Promise} API response
     */
    async updateIssueStatus(issueId, data) {
        try {
            const response = await fetch(`${this.baseURL}/issues/${issueId}/status`, {
                method: 'PUT',
                credentials: 'include', // Include cookies for authentication
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to update issue status');
            }

            return await response.json();
        } catch (error) {
            console.error('Update issue status error:', error);
            throw error;
        }
    },

    /**
     * Get available categories
     * @returns {Promise} API response
     */
    async getCategories() {
        try {
            const response = await fetch(`${this.baseURL}/issues/categories`, {
                method: 'GET',
                credentials: 'include', // Include cookies for authentication
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to fetch categories');
            }

            return await response.json();
        } catch (error) {
            console.error('Get categories error:', error);
            throw error;
        }
    },

    /**
     * Get issue analytics
     * @param {Object} filters - Query parameters
     * @returns {Promise} API response
     */
    async getAnalytics(filters = {}) {
        try {
            const queryParams = new URLSearchParams(filters);
            const response = await fetch(`${this.baseURL}/issues/analytics?${queryParams}`, {
                method: 'GET',
                credentials: 'include', // Include cookies for authentication
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to fetch analytics');
            }

            return await response.json();
        } catch (error) {
            console.error('Get analytics error:', error);
            throw error;
        }
    },

    /**
     * Get all assignments (filtered by user role)
     * @param {Object} filters - Query parameters
     * @returns {Promise} API response
     */
    async getAssignments(filters = {}) {
        try {
            const queryParams = new URLSearchParams(filters);
            const response = await fetch(`${this.baseURL}/assignments?${queryParams}`, {
                method: 'GET',
                credentials: 'include', // Include cookies for authentication
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to fetch assignments');
            }

            return await response.json();
        } catch (error) {
            console.error('Get assignments error:', error);
            throw error;
        }
    },

    /**
     * Get assignment by ID
     * @param {string} assignmentId - Assignment ID
     * @returns {Promise} API response
     */
    async getAssignment(assignmentId) {
        try {
            const response = await fetch(`${this.baseURL}/assignments/${assignmentId}`, {
                method: 'GET',
                credentials: 'include', // Include cookies for authentication
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to fetch assignment');
            }

            return await response.json();
        } catch (error) {
            console.error('Get assignment error:', error);
            throw error;
        }
    },

    /**
     * Accept assignment
     * @param {string} assignmentId - Assignment ID
     * @returns {Promise} API response
     */
    async acceptAssignment(assignmentId) {
        try {
            const response = await fetch(`${this.baseURL}/assignments/${assignmentId}/accept`, {
                method: 'POST',
                credentials: 'include', // Include cookies for authentication
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to accept assignment');
            }

            return await response.json();
        } catch (error) {
            console.error('Accept assignment error:', error);
            throw error;
        }
    },

    /**
     * Reject assignment
     * @param {string} assignmentId - Assignment ID
     * @param {string} reason - Rejection reason
     * @returns {Promise} API response
     */
    async rejectAssignment(assignmentId, reason) {
        try {
            const response = await fetch(`${this.baseURL}/assignments/${assignmentId}/reject`, {
                method: 'POST',
                credentials: 'include', // Include cookies for authentication
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reason })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to reject assignment');
            }

            return await response.json();
        } catch (error) {
            console.error('Reject assignment error:', error);
            throw error;
        }
    },

    /**
     * Start work on assignment
     * @param {string} assignmentId - Assignment ID
     * @returns {Promise} API response
     */
    async startWork(assignmentId) {
        try {
            const response = await fetch(`${this.baseURL}/assignments/${assignmentId}/start`, {
                method: 'POST',
                credentials: 'include', // Include cookies for authentication
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to start work');
            }

            return await response.json();
        } catch (error) {
            console.error('Start work error:', error);
            throw error;
        }
    },

    /**
     * Complete assignment
     * @param {string} assignmentId - Assignment ID
     * @param {Object} data - Completion data
     * @returns {Promise} API response
     */
    async completeAssignment(assignmentId, data) {
        try {
            const response = await fetch(`${this.baseURL}/assignments/${assignmentId}/complete`, {
                method: 'POST',
                credentials: 'include', // Include cookies for authentication
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to complete assignment');
            }

            return await response.json();
        } catch (error) {
            console.error('Complete assignment error:', error);
            throw error;
        }
    },

    /**
     * Get available technicians
     * @param {Object} filters - Query parameters
     * @returns {Promise} API response
     */
    async getTechnicians(filters = {}) {
        try {
            const queryParams = new URLSearchParams(filters);
            const response = await fetch(`${this.baseURL}/assignments/technicians?${queryParams}`, {
                method: 'GET',
                credentials: 'include', // Include cookies for authentication
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to fetch technicians');
            }

            return await response.json();
        } catch (error) {
            console.error('Get technicians error:', error);
            throw error;
        }
    },

    /**
     * Get assignment analytics
     * @param {Object} filters - Query parameters
     * @returns {Promise} API response
     */
    async getAssignmentAnalytics(filters = {}) {
        try {
            const queryParams = new URLSearchParams(filters);
            const response = await fetch(`${this.baseURL}/assignments/analytics?${queryParams}`, {
                method: 'GET',
                credentials: 'include', // Include cookies for authentication
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to fetch assignment analytics');
            }

            return await response.json();
        } catch (error) {
            console.error('Get assignment analytics error:', error);
            throw error;
        }
    },

    // Utility functions
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    getStatusBadgeClass(status) {
        const statusClasses = {
            'new': 'bg-secondary',
            'assigned': 'bg-info',
            'in_progress': 'bg-warning',
            'resolved': 'bg-success',
            'closed': 'bg-dark'
        };
        return statusClasses[status] || 'bg-secondary';
    },

    getPriorityBadgeClass(priority) {
        const priorityClasses = {
            'low': 'bg-success',
            'medium': 'bg-warning',
            'high': 'bg-danger',
            'urgent': 'bg-danger'
        };
        return priorityClasses[priority] || 'bg-secondary';
    },

    getCategoryDisplayName(category) {
        const categoryNames = {
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
        return categoryNames[category] || category;
    }
};

// Make issues available globally
window.issues = issues; 