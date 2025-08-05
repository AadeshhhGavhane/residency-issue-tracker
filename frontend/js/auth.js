// API Base URL
const API_BASE_URL = 'http://localhost:5000/api';

// Auth state management
let currentUser = null;

// Enhanced validation functions
const validation = {
  email: (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email || email.trim().length === 0) {
      return 'Email address is required';
    }
    if (!emailRegex.test(email.trim())) {
      return 'Please provide a valid email address';
    }
    if (email.length > 254) {
      return 'Email address is too long';
    }
    return null;
  },
  
  password: (password) => {
    if (!password || password.length === 0) {
      return 'Password is required';
    }
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(password)) {
      return 'Password must contain uppercase, lowercase, number, and special character';
    }
    return null;
  },
  
  name: (name) => {
    if (!name || name.trim().length === 0) {
      return 'Full name is required';
    }
    if (name.trim().length < 2) {
      return 'Name must be at least 2 characters long';
    }
    if (name.trim().length > 50) {
      return 'Name cannot exceed 50 characters';
    }
    if (!/^[a-zA-Z\s\-']+$/.test(name.trim())) {
      return 'Name can only contain letters, spaces, hyphens, and apostrophes';
    }
    return null;
  },
  
  file: (file) => {
    if (!file) return null;
    
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      return 'File must be less than 2MB';
    }
    
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return 'Only JPG, PNG, GIF, and WebP images are allowed';
    }
    
    return null;
  }
};

// Utility functions
const showAlert = (message, type = 'info') => {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
  alertDiv.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  
  const container = document.querySelector('.auth-card') || document.querySelector('.main-content');
  container.insertBefore(alertDiv, container.firstChild);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    if (alertDiv.parentNode) {
      alertDiv.remove();
    }
  }, 5000);
};

const showLoading = (show = true) => {
  const loadingEl = document.querySelector('.loading');
  const submitBtn = document.querySelector('button[type="submit"]');
  
  if (loadingEl) {
    loadingEl.style.display = show ? 'block' : 'none';
  }
  
  if (submitBtn) {
    const btnText = submitBtn.querySelector('.btn-text');
    const spinner = submitBtn.querySelector('.loading-spinner');
    
    if (show) {
      btnText.style.display = 'none';
      spinner.style.display = 'inline-block';
      submitBtn.disabled = true;
    } else {
      btnText.style.display = 'inline';
      spinner.style.display = 'none';
      submitBtn.disabled = false;
    }
  }
};

const redirectTo = (page) => {
  window.location.href = page;
};

// Check if user is authenticated
const checkAuth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      currentUser = data.data.user;
      return true;
    }
    return false;
  } catch (error) {
    console.error('Auth check error:', error);
    return false;
  }
};

// Redirect if not authenticated
const requireAuth = async () => {
  const isAuthenticated = await checkAuth();
  if (!isAuthenticated) {
    redirectTo('login.html');
  }
  return isAuthenticated;
};

// Redirect if authenticated
const requireGuest = async () => {
  const isAuthenticated = await checkAuth();
  if (isAuthenticated) {
    redirectTo('index.html');
  }
  return !isAuthenticated;
};

// Register function
const register = async (formData) => {
  try {
    showLoading(true);
    
    // Enhanced validation
    const name = formData.get('name');
    const email = formData.get('email');
    const password = formData.get('password');
    const file = formData.get('profilePicture');
    
    // Validate inputs
    const nameError = validation.name(name);
    if (nameError) {
      showAlert(nameError, 'danger');
      return;
    }
    
    const emailError = validation.email(email);
    if (emailError) {
      showAlert(emailError, 'danger');
      return;
    }
    
    const passwordError = validation.password(password);
    if (passwordError) {
      showAlert(passwordError, 'danger');
      return;
    }
    
    if (file && file.size > 0) {
      const fileError = validation.file(file);
      if (fileError) {
        showAlert(fileError, 'danger');
        return;
      }
    }
    
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      credentials: 'include',
      body: formData // FormData for file upload
    });
    
    const data = await response.json();
    
    if (response.ok) {
      showAlert('Registration successful! Please check your email to verify your account.', 'success');
      setTimeout(() => redirectTo('login.html'), 2000);
    } else {
      // Handle rate limiting
      if (response.status === 429) {
        showAlert('Too many requests. Please wait a moment and try again.', 'warning');
      } else {
        showAlert(data.message || 'Registration failed', 'danger');
      }
    }
  } catch (error) {
    console.error('Register error:', error);
    showAlert('Network error. Please try again.', 'danger');
  } finally {
    showLoading(false);
  }
};

// Login function
const login = async (formData) => {
  try {
    showLoading(true);
    
    // Enhanced validation
    const emailError = validation.email(formData.email);
    if (emailError) {
      showAlert(emailError, 'danger');
      return null;
    }
    
    if (!formData.password || formData.password.length === 0) {
      showAlert('Password is required', 'danger');
      return null;
    }
    
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(formData)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      showAlert('Login successful! Redirecting...', 'success');
      setTimeout(() => redirectTo('index.html'), 1500);
      return data;
    } else {
      // Handle email verification requirement
      if (response.status === 401 && data.needsVerification) {
        showAlert('Please verify your email address before logging in. Check your email for a verification link.', 'warning');
        return data; // Return data so frontend can handle verification
      }
      // Handle rate limiting
      else if (response.status === 429) {
        showAlert('Too many requests. Please wait a moment and try again.', 'warning');
      } else {
        showAlert(data.message || 'Login failed', 'danger');
      }
      return data;
    }
  } catch (error) {
    console.error('Login error:', error);
    showAlert('Network error. Please try again.', 'danger');
    return null;
  } finally {
    showLoading(false);
  }
};

// Logout function
const logout = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'GET',
      credentials: 'include'
    });
    
    if (response.ok) {
      currentUser = null;
      redirectTo('login.html');
    }
  } catch (error) {
    console.error('Logout error:', error);
    // Still redirect even if logout fails
    redirectTo('login.html');
  }
};

// Update profile function
const updateProfile = async (formData) => {
  try {
    showLoading(true);
    
    const response = await fetch(`${API_BASE_URL}/user/me`, {
      method: 'PUT',
      credentials: 'include',
      body: formData // FormData for file upload
    });
    
    const data = await response.json();
    
    if (response.ok) {
      showAlert('Profile updated successfully!', 'success');
      currentUser = data.data.user;
      updateProfileDisplay();
    } else {
      showAlert(data.message || 'Profile update failed', 'danger');
    }
  } catch (error) {
    console.error('Profile update error:', error);
    showAlert('Network error. Please try again.', 'danger');
  } finally {
    showLoading(false);
  }
};

// Update profile display
const updateProfileDisplay = () => {
  if (!currentUser) return;
  
  const nameEl = document.getElementById('user-name');
  const emailEl = document.getElementById('user-email');
  const profilePicEl = document.getElementById('profile-picture');
  
  if (nameEl) nameEl.textContent = currentUser.name;
  if (emailEl) emailEl.textContent = currentUser.email;
  
  if (profilePicEl) {
    if (currentUser.profilePicture) {
      profilePicEl.src = currentUser.profilePicture;
      profilePicEl.style.display = 'block';
    } else {
      profilePicEl.style.display = 'none';
    }
  }
};

// Profile picture preview
const setupProfilePicturePreview = () => {
  const fileInput = document.getElementById('profile-picture-input');
  const preview = document.getElementById('profile-picture-preview');
  
  if (fileInput && preview) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          preview.src = e.target.result;
          preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
      }
    });
  }
};

// Initialize page
const initPage = async () => {
  const path = window.location.pathname;
  
  if (path.includes('login.html') || path.includes('register.html')) {
    await requireGuest();
  } else if (path.includes('index.html') || path.includes('profile.html')) {
    await requireAuth();
    updateProfileDisplay();
  }
  
  // Setup profile picture preview
  setupProfilePicturePreview();
};

// Event listeners
document.addEventListener('DOMContentLoaded', initPage);

// Export functions for use in HTML
// Email verification functions
const verifyEmail = async (token) => {
  try {
    showLoading(true);
    
    const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      showAlert('Email verified successfully!', 'success');
      return true;
    } else {
      showAlert(data.message || 'Email verification failed', 'danger');
      return false;
    }
  } catch (error) {
    console.error('Email verification error:', error);
    showAlert('Network error. Please try again.', 'danger');
    return false;
  } finally {
    showLoading(false);
  }
};

const resendVerification = async (email) => {
  try {
    showLoading(true);
    
    const response = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      showAlert('Verification email sent successfully!', 'success');
      return true;
    } else {
      showAlert(data.message || 'Failed to send verification email', 'danger');
      return false;
    }
  } catch (error) {
    console.error('Resend verification error:', error);
    showAlert('Network error. Please try again.', 'danger');
    return false;
  } finally {
    showLoading(false);
  }
};

// Password reset functions
const forgotPassword = async (email) => {
  try {
    showLoading(true);
    
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      showAlert('If an account with that email exists, a password reset link has been sent.', 'success');
      return true;
    } else {
      showAlert(data.message || 'Failed to send reset email', 'danger');
      return false;
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    showAlert('Network error. Please try again.', 'danger');
    return false;
  } finally {
    showLoading(false);
  }
};

const resetPassword = async (token, newPassword) => {
  try {
    showLoading(true);
    
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token, newPassword })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      showAlert('Password reset successfully!', 'success');
      return true;
    } else {
      showAlert(data.message || 'Failed to reset password', 'danger');
      return false;
    }
  } catch (error) {
    console.error('Reset password error:', error);
    showAlert('Network error. Please try again.', 'danger');
    return false;
  } finally {
    showLoading(false);
  }
};

// Delete account function
const deleteAccount = async () => {
  try {
    showLoading(true);
    
    const response = await fetch(`${API_BASE_URL}/user/me`, {
      method: 'DELETE',
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (response.ok) {
      showAlert('Account deleted successfully', 'success');
      // Clear any stored data
      currentUser = null;
      // Redirect immediately
      window.location.href = 'login.html';
    } else {
      showAlert(data.message || 'Failed to delete account', 'danger');
    }
  } catch (error) {
    console.error('Delete account error:', error);
    showAlert('Network error. Please try again.', 'danger');
  } finally {
    showLoading(false);
  }
};

// Export functions
window.auth = {
  register,
  login,
  logout,
  updateProfile,
  deleteAccount,
  checkAuth,
  showAlert,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  validation,
  get currentUser() { return currentUser; }
}; 