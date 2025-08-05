import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, UserPlus, Upload, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RootState, AppDispatch } from '@/store';
import { register, clearError } from '@/store/slices/authSlice';

const Register = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);
  
  const [isSuccess, setIsSuccess] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    apartmentNumber: '',
    blockNumber: '',
    phoneNumber: '',
    specializations: [] as string[],
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    const formDataToSend = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'specializations') {
        // Send each specialization as a separate field
        if (Array.isArray(value)) {
          value.forEach((spec: string) => {
            formDataToSend.append('specializations', spec);
          });
        }
      } else {
        formDataToSend.append(key, value as string);
      }
    });

    if (profilePicture) {
      formDataToSend.append('profilePicture', profilePicture);
    }

    const result = await dispatch(register(formDataToSend));
    if (result.meta.requestStatus === 'fulfilled') {
      setIsSuccess(true);
      // Capture the response message if available
      const payload = result.payload as any;
      if (payload?.message) {
        setResponseMessage(payload.message);
      }
      // Don't redirect immediately, let user see success message and choose to verify mobile
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePicture(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSpecializationChange = (specialization: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      specializations: checked
        ? [...prev.specializations, specialization]
        : prev.specializations.filter(s => s !== specialization)
    }));
  };

  const specializations = [
    'sanitation', 'security', 'water', 'electricity', 'elevator', 'noise', 'parking', 
    'maintenance', 'cleaning', 'pest_control', 'landscaping', 'fire_safety', 'other'
  ];

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

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="shadow-elevated border-0">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-hero rounded-full flex items-center justify-center shadow-glow">
              <UserPlus className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
              <CardDescription>
                Join Society Tracker and manage issues efficiently
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isSuccess && (
              <Alert className="mb-4">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Account created successfully! Please check your email to verify your account.
                  {formData.phoneNumber && (
                    <div className="mt-2">
                      <p className="text-sm">
                        {responseMessage?.includes('trial limits') 
                          ? 'WhatsApp verification is not available for this phone number due to trial limits. You can verify your mobile number later from your profile page.'
                          : 'A WhatsApp verification link has also been sent to your mobile number. You can verify your mobile number later from your profile page.'
                        }
                      </p>
                      {!responseMessage?.includes('trial limits') && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => window.location.href = '/mobile-verification'}
                        >
                          Verify Mobile Now
                        </Button>
                      )}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Profile Picture */}
              <div className="space-y-2">
                <Label>Profile Picture (Optional)</Label>
                <div className="flex items-center space-x-4">
                  {previewUrl && (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Create a password"
                      required
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="resident">Resident</SelectItem>
                    <SelectItem value="committee">Committee Member</SelectItem>
                    <SelectItem value="technician">Technician</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Role-specific fields */}
              {formData.role === 'resident' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="apartmentNumber">Apartment Number</Label>
                    <Input
                      id="apartmentNumber"
                      name="apartmentNumber"
                      value={formData.apartmentNumber}
                      onChange={handleChange}
                      placeholder="e.g., A-101"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="blockNumber">Block Number</Label>
                    <Input
                      id="blockNumber"
                      name="blockNumber"
                      value={formData.blockNumber}
                      onChange={handleChange}
                      placeholder="e.g., Block A"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
              )}

              {/* Phone Number - For all roles */}
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                  required
                  disabled={isLoading}
                />
              </div>

              {formData.role === 'technician' && (
                <div className="space-y-2">
                  <Label>Specializations</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {specializations.map((spec) => (
                      <div key={spec} className="flex items-center space-x-2">
                        <Checkbox
                          id={spec}
                          checked={formData.specializations.includes(spec)}
                          onCheckedChange={(checked) => 
                            handleSpecializationChange(spec, checked as boolean)
                          }
                          disabled={isLoading}
                        />
                        <Label htmlFor={spec} className="text-sm">
                          {specializationLabels[spec as keyof typeof specializationLabels] || spec}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-hero hover:opacity-90 transition-opacity"
                disabled={isLoading}
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-primary hover:text-primary-glow font-medium transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;