"use client";

/**
 * Dashboard page.
 * Main application dashboard for authenticated users.
 */

import { useAuth } from '@/lib/hooks';
import { useBoardingPass } from '@/lib/hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Upload, Plane, User, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const { uploadFile, isLoading: uploadLoading } = useBoardingPass();
  const router = useRouter();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await uploadFile(file);
      console.log('Upload successful:', result);
      // Handle successful upload - could show results, navigate to results page, etc.
    } catch (error) {
      console.error('Upload failed:', error);
      // Handle upload error - could show error message
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-gray-600">Welcome back, {user.name || user.email}</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              <span>{user.email}</span>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Upload className="h-5 w-5 text-blue-500" />
                <CardTitle>Upload Boarding Pass</CardTitle>
              </div>
              <CardDescription>
                Upload your boarding pass to extract flight information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="space-y-2">
                    <Plane className="h-8 w-8 mx-auto text-gray-400" />
                    <div className="text-sm text-gray-600">
                      <span className="font-medium text-blue-600 hover:text-blue-500">
                        Click to upload
                      </span>{' '}
                      or drag and drop
                    </div>
                    <div className="text-xs text-gray-500">
                      PDF, PNG, JPEG up to 10MB
                    </div>
                  </div>
                </label>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFileUpload}
                  disabled={uploadLoading}
                  className="sr-only"
                />
              </div>
              {uploadLoading && (
                <div className="mt-4 text-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">Processing...</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
              <CardDescription>
                Your flight tracking overview
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Total Flights</span>
                  <span className="text-2xl font-bold text-gray-900">0</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">This Month</span>
                  <span className="text-2xl font-bold text-gray-900">0</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Miles Traveled</span>
                  <span className="text-2xl font-bold text-gray-900">0</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Flights Section (placeholder) */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Recent Flights</CardTitle>
            <CardDescription>
              Your latest boarding pass uploads
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <Plane className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No flights uploaded yet</p>
              <p className="text-sm mt-1">Upload your first boarding pass to get started</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}