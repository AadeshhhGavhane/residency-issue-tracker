import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { User, Edit, Save, X, Camera, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RootState, AppDispatch } from '@/store';
import { updateProfile, clearError } from '@/store/slices/authSlice';

const Profile = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, isLoading, error } = useSelector((state: RootState) => state.auth);
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    apartmentNumber: '',
    blockNumber: '',
  });
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [fileError, setFileError] = useState<string>('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        apartmentNumber: user.apartmentNumber || '',
        blockNumber: user.blockNumber || '',
      });
      setPreviewUrl(user.profilePicture || '');
    }
  }, [user]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const validateFile = (file: File): boolean => {
    // Check file size (2MB limit)
    const maxSize = 2 * 1024 * 1024; // 2MB in bytes
    if (file.size > maxSize) {
      setFileError('Profile picture must be less than 2MB');
      return false;
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setFileError('Please select a valid image file (JPG, PNG, GIF, WebP)');
      return false;
    }

    setFileError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name.trim()) {
      alert('Please enter your full name');
      return;
    }

    // Validate file if selected
    if (profilePicture && !validateFile(profilePicture)) {
      return;
    }
    
    const formDataToSend = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value) formDataToSend.append(key, value);
    });

    if (profilePicture) {
      formDataToSend.append('profilePicture', profilePicture);
    }

    const result = await dispatch(updateProfile(formDataToSend));
    if (result.meta.requestStatus === 'fulfilled') {
      setIsEditing(false);
      setProfilePicture(null);
      setFileError('');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (validateFile(file)) {
        setProfilePicture(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else {
        // Clear the file input
        e.target.value = '';
      }
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        apartmentNumber: user.apartmentNumber || '',
        blockNumber: user.blockNumber || '',
      });
      setPreviewUrl(user.profilePicture || '');
    }
    setProfilePicture(null);
    setFileError('');
    dispatch(clearError());
  };

  const handleEditClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Edit button clicked, setting isEditing to true');
    console.log('Current isEditing state before:', isEditing);
    setIsEditing(true);
    console.log('isEditing state set to true');
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'committee':
        return 'bg-gradient-status text-white';
      case 'technician':
        return 'bg-info text-info-foreground';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const specializationLabels = {
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

  // Show loading state while user data is being fetched
  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  // Safe role display with fallback
  const displayRole = user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User';

  console.log('Profile component render - isEditing:', isEditing, 'user:', user.name);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Edit Profile</h1>
        <p className="text-muted-foreground">
          Update your profile information and settings
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {fileError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{fileError}</AlertDescription>
        </Alert>
      )}

      <Card className="shadow-card">
        <CardContent className="pt-6">
          {isEditing && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700 font-medium">
                ✏️ Edit Mode - You can now modify your profile information
              </p>
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Picture Section */}
              <div className="lg:col-span-1 text-center space-y-4">
                <div className="relative inline-block group">
                  <Avatar className="h-32 w-32 ring-4 ring-white shadow-lg">
                    <AvatarImage src={previewUrl} alt={user.name || 'User'} />
                    <AvatarFallback className="text-2xl">
                      {user.name ? user.name.slice(0, 2).toUpperCase() : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  {isEditing && (
  <div className="absolute -bottom-2 -right-2">
    <input
      type="file"
      accept="image/*"
      onChange={handleFileChange}
      className="hidden"
      id="profile-picture"
      disabled={isLoading}
    />
    <label
      htmlFor="profile-picture"
      className="flex items-center justify-center w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full cursor-pointer transition-colors duration-200 shadow-lg border-2 border-white"
    >
      <Camera className="h-4 w-4" />
    </label>
  </div>
)}
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">{user.name || 'User'}</h3>
                  <Badge className={getRoleBadgeClass(user.role || 'resident')}>
                    {displayRole}
                  </Badge>
                </div>

                {isEditing && (
                  <div className="text-xs text-muted-foreground">
                    <p>Maximum file size: 2MB</p>
                    <p>Supported formats: JPG, PNG, GIF, WebP</p>
                  </div>
                )}
              </div>

              {/* Form Fields */}
              <div className="lg:col-span-2 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={!isEditing || isLoading}
                      placeholder="Enter your full name"
                      className={!isEditing ? "bg-muted cursor-not-allowed" : "bg-background cursor-text"}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      disabled={true}
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed for security reasons
                    </p>
                  </div>
                </div>

                {/* Phone Number - For all roles */}
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    disabled={!isEditing || isLoading}
                    placeholder="Enter your phone number"
                    className={!isEditing ? "bg-muted cursor-not-allowed" : "bg-background cursor-text"}
                  />
                  {formData.phoneNumber && (
                    <div className="flex items-center gap-2">
                      {user.isMobileVerified ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          ✓ Mobile Verified
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          ⚠ Mobile Not Verified
                        </Badge>
                      )}
                      {!user.isMobileVerified && formData.phoneNumber && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => window.location.href = '/mobile-verification'}
                          className="text-xs"
                        >
                          Verify Mobile
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {user.role === 'resident' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="apartmentNumber">Apartment Number</Label>
                      <Input
                        id="apartmentNumber"
                        name="apartmentNumber"
                        value={formData.apartmentNumber}
                        onChange={handleChange}
                        disabled={!isEditing || isLoading}
                        placeholder="e.g., A101"
                        className={!isEditing ? "bg-muted cursor-not-allowed" : "bg-background cursor-text"}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="blockNumber">Block Number</Label>
                      <Input
                        id="blockNumber"
                        name="blockNumber"
                        value={formData.blockNumber}
                        onChange={handleChange}
                        disabled={!isEditing || isLoading}
                        placeholder="e.g., Block A"
                        className={!isEditing ? "bg-muted cursor-not-allowed" : "bg-background cursor-text"}
                      />
                    </div>
                  </div>
                )}

                {/* Specializations for Technicians */}
                {user.role === 'technician' && user.specializations && (
                  <div className="space-y-2">
                    <Label>Specializations</Label>
                    <div className="flex flex-wrap gap-2">
                      {user.specializations.map(spec => (
                        <Badge key={spec} variant="outline">
                          {specializationLabels[spec as keyof typeof specializationLabels] || spec}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </form>

          {/* Action Buttons - Outside the form to prevent submission */}
          <div className="flex gap-2 pt-4">
            {!isEditing ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleEditClick}
                disabled={isLoading}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  className="bg-gradient-hero hover:opacity-90"
                  disabled={isLoading}
                  onClick={handleSubmit}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? 'Saving...' : 'Update Profile'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>
            Your account details and statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              
              <div className="flex justify-between">
                <span className="font-medium">Email verified:</span>
                <Badge variant={user.isEmailVerified ? "default" : "destructive"}>
                  {user.isEmailVerified ? "Verified" : "Not Verified"}
                </Badge>
              </div>
            </div>
            
            <div className="text-right">
              <Button 
                variant="outline" 
                className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                Delete Account
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;