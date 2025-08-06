import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store';
import { login } from '@/store/slices/authSlice';
import { useTranslation } from 'react-i18next';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await dispatch(login({
        email: formData.email,
        password: formData.password
      }));

      if (result.meta.requestStatus === 'fulfilled') {
        toast({
          title: t('auth.loginSuccess'),
          description: t('messages.welcomeBack')
        });
        
        // Check user role and redirect accordingly
        const userRole = result.payload?.user?.role || result.payload?.role;
        
        if (userRole === 'technician') {
          navigate('/technician-dashboard');
        } else {
          navigate('/dashboard');
        }
      } else {
        toast({
          title: t('errors.general'),
          description: result.payload?.message || t('errors.invalidCredentials'),
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: t('errors.general'),
        description: t('errors.network'),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-hero rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">ST</span>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            {t('auth.loginTitle')}
          </CardTitle>
          <CardDescription className="text-center">
            {t('auth.loginSubtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.password')}</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="rememberMe"
                checked={formData.rememberMe}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, rememberMe: checked as boolean })
                }
              />
              <Label htmlFor="rememberMe" className="text-sm">
                {t('auth.rememberMe')}
              </Label>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t('common.loading') : t('auth.signIn')}
            </Button>
          </form>
          <div className="mt-4 text-center space-y-2">
            <Link to="/forgot-password" className="text-sm text-blue-600 hover:underline">
              {t('auth.forgotPassword')}
            </Link>
            <div className="text-sm text-gray-600">
              {t('auth.dontHaveAccount')}{' '}
              <Link to="/register" className="text-blue-600 hover:underline">
                {t('auth.signUp')}
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;